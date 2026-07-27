import type { Request, Response } from "express";
import {
  streamText,
  isStepCount,
  convertToModelMessages,
  toUIMessageStream,
  pipeUIMessageStreamToResponse,
} from "ai";
import type { UIMessage } from "ai";
import { resolveModel, listConfiguredProviders, type AiProviderName } from "../../lib/ai-providers.js";
import { logger } from "../../lib/logger.js";
import AiResponse from "../../models/aiResponse.js";
import { agentTools } from "./ai-agent/tools.js";
import { SYSTEM_PROMPT } from "./ai-agent/system-prompt.js";
/// <reference path="../../types/express.d.ts" />

export const listProviders = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ _status: true, _data: listConfiguredProviders() });
};

export const listHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AiResponse.find({ page: "ai-agent", adminId: req.user?._id })
        .select("messages createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AiResponse.countDocuments({ page: "ai-agent", adminId: req.user?._id }),
    ]);

    return res.status(200).json({
      _status: true,
      _data: {
        items: items.map((i) => ({
          _id: i._id,
          messages: i.messages,
          createdAt: i.createdAt,
        })),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing AI agent history");
    return res.status(500).json({ _status: false, _message: "Failed to fetch history" });
  }
};

export const deleteConversation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ _status: false, _message: "Conversation ID is required" });
    const deleted = await AiResponse.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ _status: false, _message: "Conversation not found" });
    return res.status(200).json({ _status: true, _message: "Conversation deleted" });
  } catch (err) {
    logger.error({ err }, "Delete conversation error");
    return res.status(500).json({ _status: false, _message: "Failed to delete conversation" });
  }
};

const STREAM_TIMEOUT_MS = 300_000;

export const chat = async (req: Request, res: Response): Promise<void> => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("Stream timeout"));
  }, STREAM_TIMEOUT_MS);

  try {
    const { messages, provider, conversationId } = req.body as {
      messages?: UIMessage[];
      provider?: AiProviderName;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ _status: false, _message: "Messages array is required" });
      return;
    }

    const configured = listConfiguredProviders();
    if (configured.length === 0) {
      res.status(503).json({ _status: false, _message: "AI is not configured on the server" });
      return;
    }

    let model;
    try {
      model = resolveModel(provider);
    } catch (err) {
      res.status(400).json({
        _status: false,
        _message: err instanceof Error ? err.message : "Selected AI provider is not available",
      });
      return;
    }

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: agentTools,
      stopWhen: isStepCount(20),
      temperature: 0.2,
      maxOutputTokens: 8192,
      abortSignal: abortController.signal,
    });

    const adminId = req.user?._id;

    const uiStream = toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: async ({ messages: finalMessages }) => {
        const text = finalMessages
          .flatMap((m) => m.parts?.filter((p) => p.type === "text").map((p) => (p as { text: string }).text))
          .join("") || "";
        const historyData = {
          page: "ai-agent" as const,
          adminId,
          prompt: messages[0]?.parts?.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("").slice(0, 500) || "",
          response: text.slice(0, 10000) || "...",
          messages: finalMessages,
        };

        const saveConversation = () =>
          conversationId
            ? AiResponse.findByIdAndUpdate(conversationId, { $set: historyData })
            : new AiResponse(historyData).save();

        try {
          await saveConversation();
        } catch (saveErr) {
          logger.error({ err: saveErr, conversationId, adminId }, "Failed to save AI response, retrying once");
          try {
            await saveConversation();
          } catch (retryErr) {
            logger.error({ err: retryErr, conversationId, adminId }, "AI response save failed after retry");
          }
        }
      },
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    pipeUIMessageStreamToResponse({ response: res, stream: uiStream });
    Promise.resolve(result.consumeStream()).catch(() => {});
  } catch (err) {
    logger.error({ err }, "AI agent chat error");
    if (!res.headersSent) {
      res.status(500).json({ _status: false, _message: err instanceof Error ? err.message : "Internal server error" });
    }
  } finally {
    clearTimeout(timeoutId);
    abortController.abort();
  }
};
