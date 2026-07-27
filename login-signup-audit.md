# Login & Signup System Audit

## File Inventory

| Component | File | Related User |
|-----------|------|-------------|
| **Login page (client)** | `web/src/app/(sections)/Login.tsx` | Website user |
| **Signup page (client)** | `web/src/app/(sections)/SignUp.tsx` | Website user |
| **Login modal** | `web/src/components/comman/LoginModal.tsx` | Website user |
| **Google OAuth button** | `web/src/components/comman/GoogleLoginBtn.tsx` | Website user |
| **Google callback page** | `web/src/app/(pages)/auth/google/callback/page.tsx` | Website user |
| **Cookie helpers** | `web/src/lib/cookies.ts` | Website + Admin |
| **Auth Redux slice** | `web/src/redux/features/auth.ts` | Website user |
| **Sync guest data** | `web/src/lib/syncGuestData.ts` | Website user |
| **User controller (server)** | `api/src/controller/web/user.controller.ts` | Website user |
| **Admin user controller (server)** | `api/src/controller/admin/userAdmin.controller.ts` | Admin |
| **User routes** | `api/src/routes/web/user.route.ts` | Website user |
| **Admin user routes** | `api/src/routes/admin/userAdmin.routes.ts` | Admin |
| **Auth middleware** | `api/src/middleware/authMiddleware.ts` | Website + Admin |
| **JWT utilities** | `api/src/lib/jwt.ts` | Website + Admin |
| **Token/cookie config** | `api/src/lib/tokens.ts` | Website + Admin |
| **User model** | `api/src/models/user.ts` | Website + Admin |
| **Response helpers** | `api/src/utils/responses.ts` | Website + Admin |
| **Admin login page** | `admin-panel/app/page.tsx` | Admin |
| **Admin panel header** | `admin-panel/components/header.tsx` | Admin |
| **Admin panel API client** | `admin-panel/lib/api.ts` | Admin |

---

## Flow-by-Flow Analysis

### 1. Website Login Flow (Login.tsx → loginUser)

**Client:**
- Sends POST `/api/website/user/login` with `{ email, password }`
- On success: reads `data._token`, dispatches `login()` + `setProfile(data._data)`, syncs guest cart/wishlist, redirects
- **Does NOT manually set any cookies** — relies entirely on server-side `Set-Cookie` headers via the Next.js rewrite proxy
- **✅ Correct** — cookies flow through the proxy automatically

**Server (loginUser):**
- Validates email + password existence
- Finds user by email (`.lean()`) — `password` field included for comparison
- Compares password, returns 401 "Invalid email or password" on failure (security best practice ✅)
- Calls `setSessionCookies(res, user, "user")`:
  - Sets `userToken` (httpOnly, `sameSite: "strict"`, `secure: prod`) — used during auto-refresh
  - Sets `userToken` (non-httpOnly, `sameSite: "lax"`, `secure: prod`) — readable by `js-cookie`
  - Sets `userRefreshToken` (httpOnly, `sameSite: "strict"`, `secure: prod`)
- Returns `{ _status: true, _data: userData, _token: accessToken }`
- Deletes `password` and `googleId` from response data ✅

### 2. Website Signup Flow (SignUp.tsx → registerUser)

**Client:**
- Sends POST `/api/website/user/register` with `{ name, email, password, turnstileToken }`
- Includes Turnstile verification ✅
- Same cookie reliance as login — no client-side `Cookies.set()`

**Server (registerUser):**
- Validates Turnstile token (if configured) ✅
- Checks for duplicate email → 409 "User already exists"
- Creates user, hashes password
- Calls `setSessionCookies(res, newUser, "user")` — identical cookie config to login
- Returns `{ _status: true, _data: userData, _token: accessToken }`

**✅ All clear — no cookie or logic issues.**

---

### 3. Google OAuth Flow (GoogleLoginBtn → googleAuthCallback)

**Flow:**
1. Client fetches `/api/website/user/google-auth-init` → receives signed state + Google auth URL
2. Browser redirects to Google → user authorizes
3. Google redirects to `/auth/google/callback?code=...&state=...`
4. Client sends code + state to `/api/website/user/google-callback`
5. Server verifies state (CSRF protection ✅), exchanges code for tokens, creates/finds user
6. Server calls `setSessionCookies(res, user, "user")` — same config

**Issues Found:**

**🟡 MEDIUM: Google callback response has nested structure**
- Login returns: `{ _data: userData, _token: accessToken }`
- Google callback returns: `{ _data: { user: cleanData }, _token: accessToken }`
- Client handles both correctly (`data._data` vs `data._data.user`) ✅
- But the inconsistency is a maintenance risk — future devs might expect uniform structure

**🟡 MEDIUM: `access_type=offline` but refresh token not used**
- The Google auth URL uses `access_type=offline` which requests a refresh token
- The received refresh token `tokens.refresh_token` is **never stored or used**
- Google may still return a refresh token that's silently ignored

**🟢 LOW: Duplicate callback prevention uses sessionStorage**
- `sessionStorage.setItem('google_cb_' + code, "1")` prevents double-processing
- SessionStorage is tab-scoped — different tabs can race each other
- However, Google codes are single-use, so only one exchange succeeds anyway

---

### 4. Admin Login Flow (admin-panel/page.tsx → userAdmin.controller login)

**Client (admin-panel/app/page.tsx):**
- Uses `api.post("/api/admin/user/login", { email, password })`
- `api.ts` sets `credentials: "include"` — cookies sent/received ✅
- On success: redirects to `/dashboard`
- **Checks only response status — no `_data` or `_token` needed**

**Server (userAdmin.controller login):**
- Finds user with `role: "admin"` filter ✅
- Uses `generateToken(user, "admin")` — 7-day JWT
- Calls `setSessionCookies(res, user)`:
  - Sets `adminToken` (httpOnly, `sameSite: "strict"`) ✅
  - Sets `adminToken` (non-httpOnly, `sameSite: "lax"`) ✅
  - Sets `adminRefreshToken` (httpOnly, `sameSite: "strict"`) ✅
- Returns simple `{ _status: true, _message: "..." }` — no body data

**Issues Found:**

**🔴 HIGH: Admin CSRF token not re-fetched after login**
- `api.ts` calls `ensureCsrfToken()` at **module load time** (before login)
- After successful login, `csrfTokenPromise` is already resolved
- But: the CSRF cookie (`sameSite: "strict"`) is **set before login** with `path: "/"`
- After login, the same CSRF cookie is still valid (24-hour expiry)
- **Risk**: if the CSRF fetch failed at page load (network glitch), `csrfTokenPromise = null` and NO CSRF token exists
  - All subsequent admin mutations would get 403 "Invalid CSRF token"
  - The admin would be stuck — logged in but unable to perform any actions

**🔴 HIGH: Admin logout does not revoke refresh token**
- `logoutUser` (user) revokes refresh token: ✅
  ```typescript
  const { hashToken } = await import("../../lib/tokens.js");
  const tokenHash = hashToken(refreshValue);
  await revokeRefreshToken(tokenHash);
  ```
- `logout` (admin) just clears cookies, **no revoke**:
  ```typescript
  export const logout = async (_req: Request, res: Response) => {
    clearSessionCookiesAdmin(res);
    // No refresh token revocation!
  };
  ```
- **Consequence**: admin's refresh token stays valid in DB for 10 more days
- If an attacker had the old cookie (before it was cleared), they could mint new sessions

---

### 5. Token Refresh & Auto-Refresh

**Proactive refresh (admin header):**
- `header.tsx` calls `POST /api/admin/user/refresh` every 10 minutes
- Uses `credentials: "include"` — sends httpOnly refresh cookie
- Also fires on `visibilitychange` when tab becomes visible ✅

**Middleware auto-refresh (authMiddleware.ts):**
- `attemptAutoRefresh` fires when a protected endpoint receives an expired token
- Reads refresh cookie, verifies, **rotates** (revoke old → create new), sets new cookies
- Then calls `next()` to continue the **original request** — seamless UX ✅

**Issues Found:**

**🟡 MEDIUM: Race between proactive refresh and middleware auto-refresh**
- Both read the same `userRefreshToken` / `adminRefreshToken` cookie
- Both call `verifyRefreshToken` which finds the same doc
- First one revokes and creates new token
- Second one's `revokeRefreshToken` is a no-op (already deleted), but it still creates a NEW refresh token
- **Net result**: two refresh tokens created for the same rotation; first one is orphaned
- **Low risk** in practice because the window is very small and no data loss

**🟡 MEDIUM: Admin refresh endpoint not protected by middleware**
- `router.post("/refresh", rateLimit.refreshToken, uploadNone, refreshAdminToken);`
- No `protect` middleware — it reads the refresh cookie directly
- This is intentional (you can't use a token to refresh itself), but means:
  - No auto-refresh fallback if the refresh endpoint itself receives an expired token
  - The endpoint relies entirely on the refresh token cookie being valid

---

### 6. Logout Flows

**User logout (logoutUser in user.controller.ts):**
- Revokes refresh token ✅
- Calls `clearSessionCookies(res)` which clears ALL cookies:
  - `userToken`, `userRefreshToken` ✅
  - `adminToken`, `adminRefreshToken` ⚠️
  - `deliveryToken`, `deliveryRefreshToken` ⚠️
- **🟡 MEDIUM: User logout clears admin cookies** — if an admin is also browsing the website and logs out there, their admin session is also terminated

**Admin logout (userAdmin.controller.ts):**
- Calls `clearSessionCookiesAdmin(res)` which clears:
  - `adminToken`, `adminRefreshToken` ✅
- **Does NOT revoke refresh token** — see 🔴 HIGH above

**Client-side clear (cookies.ts clearAuthCookies):**
- Manually removes `userToken`, `userRefreshToken`, `adminToken`, `adminRefreshToken` via `js-cookie`
- Also removes the `auth` slice from redux-persist ✅
- Used as a fallback when tokens are expired

---

### 7. Password Reset Flow

**Forgot password → verify OTP → reset password**

**Issues Found:**

**🟡 MEDIUM: verifyUser OTP exposed in URL**
```typescript
verificationLink: `${env.FRONTEND_URL}/verify-email?token=${verificationToken}&otp=${otp}`
```
- OTP is embedded as a query parameter alongside the JWT
- If the user bookmarks this URL or forwards the email, both token and OTP are exposed
- The OTP is also embedded inside the JWT (`otpHash`), so the URL param is redundant for server verification
- **Recommendation**: remove `&otp=${otp}` from the verification link — the JWT already contains the hashed OTP

**🟡 MEDIUM: Password reset clears ALL sessions**
```typescript
await revokeAllUserRefreshTokens(String(user._id));
clearSessionCookies(res);
```
- After resetting password, the user is **logged out** of all sessions
- This is intentional and good practice ✅
- But: no user-facing message indicating "you'll be logged out after reset"

**🟢 LOW: No server-side password strength validation**
- Client uses `StrongPasswordInput` component (likely provides strength feedback)
- Server only checks `newPassword.length < 6` — no complexity requirements
- No character class requirements (uppercase, number, special char)

---

### 8. Cookie Configuration Audit

**Cookie type settings across all endpoints:**

| Cookie | httpOnly | sameSite | secure | Set By |
|--------|----------|----------|--------|--------|
| `userToken` (httpOnly) | ✅ true | `strict` | `env.NODE_ENV === "production"` | login / register / google-callback / refresh |
| `userToken` (non-httpOnly) | ❌ false | `lax` | `env.NODE_ENV === "production"` | login / register / google-callback / refresh |
| `userRefreshToken` | ✅ true | `strict` | `env.NODE_ENV === "production"` | login / register / google-callback / refresh |
| `adminToken` (httpOnly) | ✅ true | `strict` | `env.NODE_ENV === "production"` | admin login / refresh |
| `adminToken` (non-httpOnly) | ❌ false | `lax` | `env.NODE_ENV === "production"` | admin login / refresh |
| `adminRefreshToken` | ✅ true | `strict` | `env.NODE_ENV === "production"` | admin login / refresh |
| `csrfToken` | ❌ false | `strict` | `env.NODE_ENV === "production"` | `GET /api/admin/csrf-token` |

**✅ All cookies use `secure: env.NODE_ENV === "production"` consistently**
**✅ Non-httpOnly tokens use `sameSite: "lax"`** (required for `js-cookie` to read them)
**✅ httpOnly tokens use `sameSite: "strict"`** (better security)
**✅ All cookies set `path: "/"`**

**🟢 LOW: No `domain` property set on cookies**
- Cookies use default domain (current origin)
- With Next.js rewrites, the domain is the same as the frontend
- This is correct — setting an explicit domain could cause subdomain issues

---

### 9. Response Structure Consistency

| Endpoint | Response Shape | Contains `_token` | Contains `_data` |
|----------|---------------|:------------------:|:-----------------:|
| `POST /register` | `{ _status, _message, _data, _token }` | ✅ | ✅ `userData` |
| `POST /login` | `{ _status, _message, _data, _token }` | ✅ | ✅ `userData` |
| `POST /google-callback` | `{ _status, _message, _data: { user }, _token }` | ✅ | ✅ nested |
| `POST /admin/login` | `{ _status, _message }` | ❌ | ❌ |
| `POST /refresh` | `{ _status, _message, _token }` | ✅ | ❌ |
| `POST /admin/refresh` | `{ _status, _message }` | ❌ | ❌ |
| `POST /re-login` | `{ _status, _message }` | ❌ | ❌ |
| `POST /forgot-password` | `{ _status, _message, _token }` | ✅ | ❌ |
| `POST /verify-otp` | `{ _status, _message, _token }` | ✅ | ❌ |

**Issues:**

**🟡 MEDIUM: `/re-login` doesn't return `_token`**
- The response is `{ _status: true, _message: "Login successful" }`
- Cookies are set, so token refresh works via HTTP
- But if any client code expects `data._token`, it gets `undefined`

**🟡 MEDIUM: `/admin/refresh` doesn't return `_token`** 
- Same as above — cookies are set, but no body token
- The admin panel's `header.tsx` only checks that the response is OK (not 4xx/5xx)

**🟡 MEDIUM: Google callback response shape is nested differently**
- `_data: { user: cleanData }` vs `_data: cleanData` in login/register
- Currently handled correctly on the client, but inconsistent

---

### 10. Logical Edge Cases & Potential Bugs

**🔴 HIGH: `completeVerify` uses `decoded.userId!` — could be `undefined`**
```typescript
invalidateUserCache(decoded.userId!);
```
- The JWT payload type is `{ type?: string; otp?: string; userId?: string }`
- If `userId` is missing from the JWT (e.g., malformed token), `invalidateUserCache(undefined)` would try to delete cache key `user_undefined`
- **Minor risk** — JWT is signed server-side, so this only happens with tampered tokens

**🟡 MEDIUM: `forgotPassword` doesn't check `deletedAt`**
```typescript
const user = await User.findOne({ email }).select("name").lean();
```
- Finds user by email but doesn't check if `deletedAt` is set
- Even for deleted users, the "OTP sent" response is returned
- However, the email is still sent (to the deleted user's email) — no security issue
- The `resetPassword` endpoint correctly checks `user.deletedAt` before resetting

**🟢 LOW: `loggedOut useModal` — user can start login with returnTo= pointing to external URL**
```typescript
router.push(returnTo || "/");
```
- `returnTo` comes from `useSearchParams().get("returnTo")`
- Could be an open redirect vector if set to an external domain
- **Mitigation**: Next.js `router.push` only accepts internal paths, so external URLs become relative
- **No actual vulnerability** with Next.js router, but worth noting

**🟢 LOW: `LoginSignUp.tsx` is unused**
- File at `web/src/app/(sections)/LoginSignUp.tsx` is an empty component rendering "LoginSignUp"
- Dead code — should be cleaned up

---

### 11. Summary Table

| # | Severity | Category | Issue | File(s) |
|---|----------|----------|-------|---------|
| 1 | 🔴 HIGH | Admin Logout | Refresh token not revoked on admin logout | `userAdmin.controller.ts` |
| 2 | 🔴 HIGH | CSRF | CSRF token not re-fetched after login — admin stuck if initial fetch failed | `admin-panel/lib/api.ts` |
| 3 | 🟡 MEDIUM | Token Refresh | Race condition between proactive refresh and middleware auto-refresh | `authMiddleware.ts`, `header.tsx` |
| 4 | 🟡 MEDIUM | Response | `/re-login` and `/admin/refresh` don't return `_token` in response body | `user.controller.ts`, `userAdmin.controller.ts` |
| 5 | 🟡 MEDIUM | Response | Google callback has nested `_data: { user }` vs flat `_data` in login/signup | `user.controller.ts` |
| 6 | 🟡 MEDIUM | Cookie | User `clearSessionCookies` also wipes admin cookies | `user.controller.ts` |
| 7 | 🟡 MEDIUM | Security | `verifyUser` OTP exposed in verification URL as query param | `user.controller.ts` |
| 8 | 🟡 MEDIUM | Security | Password reset logs user out of all sessions without warning | `user.controller.ts` |
| 9 | 🟡 MEDIUM | Validation | No server-side password strength validation beyond min length | `user.controller.ts` |
| 10 | 🟡 MEDIUM | Google OAuth | `access_type=offline` requests refresh token but it's never stored/used | `user.controller.ts` |
| 11 | 🟢 LOW | Edge Case | `forgotPassword` doesn't check `deletedAt` before sending OTP | `user.controller.ts` |
| 12 | 🟢 LOW | Edge Case | `completeVerify` uses `decoded.userId!` — could invalidate wrong cache key | `user.controller.ts` |
| 13 | 🟢 LOW | Dead Code | `LoginSignUp.tsx` is an unused empty component | `LoginSignUp.tsx` |
| 14 | 🟢 LOW | Security | `returnTo` param could theoretically be used for open redirect (mitigated by Next.js) | `Login.tsx`, `SignUp.tsx` |

---

### 12. Recommendations (Priority Order)

1. **🔥 Fix admin logout refresh token revocation** — Add the same `revokeRefreshToken` logic from `logoutUser` to the admin `logout` function
2. **🔥 Re-fetch CSRF token after login** — In `admin-panel/app/page.tsx`, call a CSRF refresh after successful login before redirecting to `/dashboard`
3. **⚠️ Return `_token` from `/re-login` and `/admin/refresh`** — For consistency and to support future clients that expect the token in the response body
4. **⚠️ Add `deletedAt` check in `forgotPassword`** — Prevent sending OTP emails to deleted accounts
5. **⚠️ Remove OTP from email verification URL** — The JWT already contains `otpHash`, so `&otp=${otp}` is redundant and exposes the OTP
6. **ℹ️ Clean up unused `LoginSignUp.tsx`**
7. **ℹ️ Add server-side password strength validation** — e.g., `zod` schema with character class requirements
