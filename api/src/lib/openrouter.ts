/**
 * Lightweight OpenRouter API client.
 *
 * OpenRouter provides an OpenAI-compatible chat completions API.
 * This client wraps the REST endpoint with proper auth and error handling.
 *
 * Endpoint: POST https://openrouter.ai/api/v1/chat/completions
 * Auth:     Authorization: Bearer <OPENROUTER_API_KEY>
 * Docs:     https://openrouter.ai/docs/api-reference
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterChatOptions {
  model?: string;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: { content: string; role: string };
    finish_reason: string;
    index: number;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

/**
 * Send a chat completion request to OpenRouter and return the response text.
 *
 * @param apiKey   - OpenRouter API key (Authorization: Bearer)
 * @param options  - Model, messages, and generation parameters
 * @returns        - The generated text content
 * @throws         - If the API returns a non-2xx status or the response is malformed
 */
export async function callOpenRouter(
  apiKey: string,
  options: OpenRouterChatOptions,
): Promise<string> {
  const { model = "openrouter/free", messages, maxTokens = 1024, temperature = 0.7 } = options;

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter recommends sending these for better support
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": process.env.APP_NAME || "Kidora Kart",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "(could not read error body)";
    }
    throw new Error(
      `OpenRouter API error (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenRouter returned empty response");
  }

  return text;
}
