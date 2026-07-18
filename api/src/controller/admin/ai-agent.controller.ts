import type { Request, Response } from "express";
import { streamText } from "ai";
import { resolveModel, listConfiguredProviders, type AiProviderName } from "../../lib/ai-providers.js";
import { logger } from "../../lib/logger.js";
import AiResponse from "../../models/aiResponse.js";
import { agentTools } from "./ai-agent/tools.js";
import { SYSTEM_PROMPT } from "./ai-agent/system-prompt.js";
/// <reference path="../../types/express.d.ts" />

// ── deleteConversation ─────────────────────────────────────────────

export const deleteConversation = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ _status: false, _message: "Conversation ID is required" });
    }
    const deleted = await AiResponse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ _status: false, _message: "Conversation not found" });
    }
    return res.status(200).json({ _status: true, _message: "Conversation deleted" });
  } catch (err) {
    logger.error({ err }, "Delete conversation error");
    return res.status(500).json({ _status: false, _message: "Failed to delete conversation" });
  }
};

// ── Controllers ────────────────────────────────────────────────────

/**
 * GET /api/admin/ai-agent/providers
 * Returns the list of configured providers for the frontend dropdown.
 */
export const listProviders = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const configured = listConfiguredProviders();
  return res.status(200).json({ _status: true, _data: configured });
};

/**
 * GET /api/admin/ai-agent/history
 * Returns recent AI agent conversations for the history sidebar.
 */
export const listHistory = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { page: rawPage, limit: rawLimit } = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(rawPage ?? 1));
    const limit = Math.min(50, Math.max(1, Number(rawLimit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AiResponse.find({ page: "ai-agent", adminId: req.user?._id })
        .select("prompt response messages createdAt")
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AiResponse.countDocuments({ page: "ai-agent", adminId: req.user?._id }),
    ]);

    return res.status(200).json({
      _status: true,
      _data: {
        items,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing AI agent history");
    return res.status(500).json({ _status: false, _message: "Failed to fetch history" });
  }
};

/**
 * POST /api/admin/ai-agent/chat
 * Accepts: { messages: Array<{ role, content }>, provider?: AiProviderName, conversationId?: string }
 * Streams the agent response. Groups messages by conversationId.
 */
export const chat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { messages, provider, conversationId } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      provider?: AiProviderName;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ _status: false, _message: "Messages array is required" });
      return;
    }

    for (const [i, m] of messages.entries()) {
      if (!m.role || (m.role !== "user" && m.role !== "assistant")) {
        res.status(400).json({ _status: false, _message: `Invalid message role at index ${i}: expected "user" or "assistant"` });
        return;
      }
      if (typeof m.content !== "string" || m.content.length > 10000) {
        res.status(400).json({ _status: false, _message: `Invalid content at index ${i}: must be a string with max 10000 characters` });
        return;
      }
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

    const sdKMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let conversationIdToUse = conversationId || "";
    const cumulativeToolSummaries: string[] = [];
    const allAssistantContents: string[] = [];
    const allAccumulatedToolResults: string[] = [];

    if (conversationId) {
      try {
        const exists = await AiResponse.findById(conversationId).select("_id").lean();
        if (!exists) {
          logger.warn({ conversationId }, "Invalid conversationId, will create new");
          conversationIdToUse = "";
        }
      } catch (convErr) {
        logger.warn({ conversationId, err: convErr }, "Invalid conversationId format, will create new");
        conversationIdToUse = "";
      }
    }

    // ── Auto-continuation loop ──────────────────────────────────────
    const MAX_ITERATIONS = 8;
    let iteration = 0;
    let currentSdkMessages = [...sdKMessages];
    let lookupOnlyIterationCount = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      logger.info({ iteration, totalToolSummaries: cumulativeToolSummaries.length }, "AI agent loop iteration");

      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: currentSdkMessages,
        tools: agentTools,
        temperature: 0.2,
        maxOutputTokens: 4096,
      });

      let iterationAssistantContent = "";
      let iterationHasToolCall = false;
      let iterationHasCreateOrUpdateAction = false;
      const iterationToolNames: string[] = [];
      const iterationToolSummaries: string[] = [];

      for await (const chunk of result.fullStream) {
        if (chunk.type === "text-delta") {
          iterationAssistantContent += chunk.text;
          res.write(JSON.stringify({ type: "text", text: chunk.text }) + "\n");
        } else if (chunk.type === "tool-call") {
          iterationHasToolCall = true;
          iterationToolNames.push(chunk.toolName);
          if (chunk.toolName.startsWith("create") || chunk.toolName.startsWith("update")) {
            iterationHasCreateOrUpdateAction = true;
          }
          res.write(JSON.stringify({
            type: "tool-call",
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            args: chunk.input,
          }) + "\n");
        } else if (chunk.type === "tool-result") {
          res.write(JSON.stringify({
            type: "tool-result",
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            result: chunk.output,
          }) + "\n");

          const output = chunk.output as Record<string, unknown> | undefined;
          if (output?.created === true) {
            const label = (output.name as string) || chunk.toolName.replace(/^create/, "");
            iterationToolSummaries.push(`✅ Created ${label}`);
          } else if (output?.updated === true) {
            const label = (output.name as string) || "";
            iterationToolSummaries.push(`✅ Updated ${label}`);
          }
          const resultSummary = chunk.toolName + ": " + JSON.stringify(chunk.output).slice(0, 300);
          if (!allAccumulatedToolResults.some((r) => r === resultSummary)) {
            allAccumulatedToolResults.push(resultSummary);
          }
        } else if (chunk.type === "error") {
          logger.error({ err: chunk.error }, "AI agent streaming error");
          const errorMessage = chunk.error instanceof Error ? chunk.error.message : String(chunk.error);
          res.write(JSON.stringify({ type: "error", message: errorMessage }) + "\n");
        }
      }

      allAssistantContents.push(iterationAssistantContent);
      cumulativeToolSummaries.push(...iterationToolSummaries);

      // Determine if we should continue
      let shouldContinue = false;

      if (iterationHasToolCall && !iterationHasCreateOrUpdateAction && !iterationAssistantContent.trim()) {
        lookupOnlyIterationCount++;
      } else {
        lookupOnlyIterationCount = 0;
      }

      if (iterationHasToolCall && iteration < MAX_ITERATIONS) {
        if (iterationHasCreateOrUpdateAction) {
          lookupOnlyIterationCount = 0;
          shouldContinue = true;
        } else if (lookupOnlyIterationCount <= 1) {
          shouldContinue = true;
        } else {
          // Two consecutive lookups with no create/update and no text output = stuck
          shouldContinue = false;
        }
      }

      if (shouldContinue && iteration < MAX_ITERATIONS) {
        res.write(JSON.stringify({ type: "continuation" }) + "\n");

        // Build next iteration's SDK messages
        const continuationText = `[SYSTEM: The task from the user is NOT complete. Continue working on it.]

Your previous actions:
${cumulativeToolSummaries.join("\n")}

All tool results so far:
${allAccumulatedToolResults.join("\n")}

${
  iterationHasCreateOrUpdateAction
    ? "You have made progress. Continue with the next steps to complete the task."
    : "You only did lookups. You MUST now create or update something. Do not stop until the user's request is fully complete."
}

Instructions:
1. If the user wanted to create a product and you already looked up categories/colors, NOW call createProductDraft with the IDs you found.
2. If the user wanted multiple things and you only did one, do the rest now.
3. Do not repeat lookups you already did. Use the results from your previous lookups.
4. If you looked up a category/color and it didn't exist, create it NOW, then use its returned ID to create the product.
5. Do not stop until every item the user asked for has been created.`;

        currentSdkMessages = [
          ...currentSdkMessages,
          { role: "assistant" as const, content: iterationAssistantContent },
          { role: "user" as const, content: continuationText },
        ];
        continue;
      }

      // ── No continuation needed → finalize ────────────────────────
      const fullAssistantText = allAssistantContents.join("\n\n...\n\n");

      if (conversationIdToUse) {
        await AiResponse.findByIdAndUpdate(conversationIdToUse, {
          $set: {
            prompt: messages[0]?.content?.slice(0, 500) || "",
            response: fullAssistantText.slice(0, 10000) || "...",
            messages: [
              ...sdKMessages.map((m) => ({ role: m.role, content: m.content })),
              { role: "assistant", content: fullAssistantText },
            ],
          },
        });
      } else {
        const newHistory = new AiResponse({
          page: "ai-agent",
          adminId: req.user?._id,
          prompt: messages[0]?.content?.slice(0, 500) || "",
          response: fullAssistantText.slice(0, 10000) || "...",
          messages: [
            ...sdKMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "assistant", content: fullAssistantText },
          ],
        });
        const saved = await newHistory.save();
        conversationIdToUse = String(saved._id);
      }

      res.write(JSON.stringify({ type: "done", conversationId: conversationIdToUse }) + "\n");
      res.end();
      return;
    }

    // ── MAX_ITERATIONS reached ──────────────────────────────────────
    const fullText = allAssistantContents.join("\n\n...\n\n");
    if (conversationIdToUse) {
      await AiResponse.findByIdAndUpdate(conversationIdToUse, {
        $set: {
          prompt: messages[0]?.content?.slice(0, 500) || "",
          response: fullText.slice(0, 10000) || "...",
          messages: [
            ...sdKMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "assistant", content: fullText },
          ],
        },
      });
    } else {
      const newHistory = new AiResponse({
        page: "ai-agent",
        adminId: req.user?._id,
        prompt: messages[0]?.content?.slice(0, 500) || "",
        response: fullText.slice(0, 10000) || "...",
        messages: [
          ...sdKMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: "assistant", content: fullText },
        ],
      });
      const saved = await newHistory.save();
      conversationIdToUse = String(saved._id);
    }

    res.write(JSON.stringify({ type: "done", conversationId: conversationIdToUse, note: "Max iterations reached" }) + "\n");
    res.end();
  } catch (err) {
    logger.error({ err }, "AI agent chat error");
    try {
      res.write(JSON.stringify({
        type: "error",
        message: err instanceof Error ? err.message : "Internal server error",
      }) + "\n");
      res.end();
    } catch { /* ignore write errors after failure */ }
  }
};
