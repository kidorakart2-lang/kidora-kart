# AI Agent Fix Plan

## Review Date: 2026-07-27

---

## How It Works

**Architecture**: Express backend (api/) → AI SDK v7 streaming → Next.js frontend (admin-panel/)

**Request Flow**:
1. User types in `ChatInput` → `useAiChat` hook sends via `DefaultChatTransport` (SSE)
2. Express `chat()` endpoint receives `{ messages, conversationId, provider }`
3. Wraps 18 tool definitions with `sdkTool({ description, inputSchema, execute })`
4. Calls `streamText()` with system prompt + tools (`stopWhen: isStepCount(20), temperature: 0.2`)
5. Pipes response via `pipeUIMessageStreamToResponse` (SSE stream)
6. On finish, saves/upserts to MongoDB via `AiResponse` model
7. Frontend renders `UIMessage` parts (text + `dynamic-tool` parts)

**18 Tools**: Search/lookup (9), create (7), update (1), web fetch (2), utility (1)

**Caching**: In-memory, 600s TTL on lookups, invalidated on entity creates

---

## Changes

### SEC-001: Add rate limiting to chat endpoint ✅ (already existed)
- `api/src/middleware/rateLimit.ts:154` — `aiAgentChat` limiter already exists (15 req / 15 min)
- `api/src/routes/admin/ai-agent.routes.ts:35` — already applied on `/chat` route

### SEC-002: Fix SSRF IPv6 bypass in fetchUrl ✅
- `api/src/controller/admin/ai-agent/tools.ts` — replaced brittle regex with `isPrivateHostname()` using `node:net.isIPv6()`
- Handles IPv6 loopback (`::1`), ULA (`fc00::/7`), link-local (`fe80::/10`), and IPv4-mapped IPv6

### SEC-003: Fail early if auth missing ✅ (already handled by middleware)
- Route already applies `protect` + `adminOnly` middleware which sets `req.user`

### SEC-004: Retry + structured logging on onFinish DB errors ✅
- `controller.ts:129-155` — added retry-once with structured error metadata (`conversationId`, `adminId`)

### PERF-001: Hoist tool wrapping to module level ✅
- `controller.ts:11-18` — pre-wraps all 18 tools at module init instead of per-request
- Uses `Record<string, any>` cast to avoid TS generic inference issues

### PERF-002: Increase cache TTL 60→600s ✅
- `tools.ts:37` — `CACHE_TTL` changed from 60 to 600 (10 minutes)

### PERF-003: Fix cachedQuery falsy bug ✅
- `tools.ts:39-43` — uses `Symbol("cacheMiss")` sentinel instead of `!== undefined` check
- `0`, `""`, `false`, `null`, `[]` are now properly recognized as cache hits

### PERF-004: Memoize ChatMessage ✅
- `admin-panel/components/chat/ChatMessage.tsx` — wrapped with `React.memo`

### PERF-005: Optimistic history update ❌ (skipped — low value)
- Current `queryClient.invalidateQueries()` approach is adequate for the paginated history

### ARCH-001: Type agentTools properly ✅
- `tools.ts:41-43` — added `ToolDefinition` interface with `description`, `inputSchema`, `execute`
- `export const agentTools: Record<string, ToolDefinition>` — properly typed

### ARCH-002: Extract reusable slugify helper ✅
- `helpers.ts:14-16` — added `slugify(text)` using `slugify` package
- `tools.ts` — all inline slug generation replaced with `slugify()` calls
- `createSubCategory`, `createSubSubCategory`, and `createCategory` now share the same slug logic

### ARCH-003: Fix createEntityTool name assumption ✅
- `tools.ts:85-108` — added `nameField = "name"` parameter
- FAQ uses `nameField: "question"`, Banner uses `nameField: "description"`, Testimonial uses `nameField: "title"`
- Removed `findExisting` and all `as unknown as` casts

### UX-001: Add copy button to assistant messages ✅
- `admin-panel/components/chat/ChatMessage.tsx` — copy button appears on hover over assistant messages
- Shows Check icon briefly on copy success, then reverts to Copy icon
