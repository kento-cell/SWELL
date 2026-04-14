# Security Review 2026-04-06

Repository: `kento-cell/SWELL`

Reviewed commit:
- `b696c1de6f1aa564d244b8332d75408a5464cc74`

Scope:
- server auth and session flow
- OAuth callback flow
- CORS and cookie handling
- client-side token and user-info storage
- secret exposure in tracked files

Conclusion:
- No hardcoded production secrets were found in tracked source files.
- The main risk is not "API keys committed to git".
- The main risk is "authenticated data can be read by a third-party origin because of unsafe CORS".
- The second major risk is "OAuth state is not a CSRF defense".

## Highest Risk Findings

### 1. Credentialed CORS allows cross-origin authenticated data exposure

Severity: High

Files:
- `server/_core/index.ts`
- `server/_core/oauth.ts`
- `server/routers.ts`

Problem:
- The server reflects any request `Origin` into `Access-Control-Allow-Origin`.
- The server also sets `Access-Control-Allow-Credentials: true`.
- This combination allows a malicious website to make credentialed requests from a victim browser and read authenticated responses.

Why this matters:
- If a victim is logged in, a third-party site can call endpoints such as:
  - `GET /api/auth/me`
  - `POST /api/trpc/auth.me`
  - any future authenticated endpoint that returns user-specific data
- Because the response origin is reflected and credentials are allowed, the attacker can read the returned JSON.

Evidence:
- `server/_core/index.ts` reflects `req.headers.origin`
- `server/_core/index.ts` enables credentials globally

Recommended fix:
- Replace origin reflection with a strict allowlist.
- Only set `Access-Control-Allow-Credentials: true` for explicitly trusted origins.
- Reject or omit CORS headers for unknown origins.

### 2. OAuth state is not validated as a nonce

Severity: High

Files:
- `constants/oauth.ts`
- `server/_core/sdk.ts`
- `server/_core/oauth.ts`

Problem:
- `state` is just a Base64-encoded redirect URI.
- The server decodes it and uses it as `redirectUri`.
- There is no nonce generation, server-side storage, or callback verification.

Why this matters:
- This does not provide CSRF protection for the OAuth flow.
- Login CSRF and callback manipulation risks remain.
- A user can be forced into an unintended authenticated state.

Recommended fix:
- Generate a random state nonce on login start.
- Store it server-side or in a signed, short-lived cookie/session.
- Verify it on callback before exchanging the code.
- Keep redirect URI independent from the CSRF token.

## Medium Risk Findings

### 3. Session token is accepted from URL parameters

Severity: Medium

Files:
- `app/oauth/callback.tsx`

Problem:
- The callback screen accepts `sessionToken` directly from query params and stores it.

Why this matters:
- URL-based tokens leak via browser history, logs, app-link handling, and operational telemetry.
- This also increases account-mixup risk if a crafted URL is opened.

Recommended fix:
- Remove URL-based session token ingestion.
- Use only `code + state` exchange for OAuth completion.

### 4. JWT secret can silently default to an empty string

Severity: Medium

Files:
- `server/_core/env.ts`
- `server/_core/sdk.ts`

Problem:
- `JWT_SECRET` defaults to `""` instead of failing fast.

Why this matters:
- If production or preview is misconfigured, session signing uses a predictable empty secret.
- An attacker who knows the code can forge session JWTs under that misconfiguration.

Recommended fix:
- Fail server startup when `JWT_SECRET` is missing.
- Do the same for other required auth secrets and endpoint base URLs.

### 5. Excessive logging of auth and user data

Severity: Medium

Files:
- `lib/_core/auth.ts`
- `hooks/use-auth.ts`
- `lib/_core/api.ts`
- `app/oauth/callback.tsx`

Problem:
- Logs include partial session tokens, auth state details, response headers, and user objects.

Why this matters:
- Logs are a common secondary leak path.
- Partial tokens and user records should not be emitted in production.

Recommended fix:
- Remove token logging entirely.
- Avoid logging response headers that may include auth metadata.
- Gate sensitive diagnostics behind a development-only flag.

## Secret Exposure Review

What was checked:
- tracked files for API keys and common secret patterns
- `.env`-like files
- private key material patterns
- bearer token patterns

Result:
- No committed live credentials were found in tracked source files during this review.
- Documentation includes example variable names, but not actual secret values.

Caveat:
- This does not prove runtime environment variables are safe.
- Deployment configuration still needs manual verification.

## Tamper / Integrity Review

Observed:
- No obvious backdoor patterns such as `eval`, `child_process`, or shell execution were found in production paths reviewed.
- No hidden auto-update or remote code download path was identified in reviewed code.

Remaining integrity concerns:
- Unsafe CORS enables data extraction from authenticated browsers.
- OAuth flow weakness can put users into unintended sessions.
- Empty-secret misconfiguration would allow session forgery.

## Priority Order

1. Fix CORS allowlist behavior.
2. Implement real OAuth state nonce validation.
3. Remove URL-parameter session token handling.
4. Fail fast when `JWT_SECRET` is absent.
5. Remove sensitive auth logging.

## Files To Read First Next Time

1. `server/_core/index.ts`
2. `server/_core/oauth.ts`
3. `server/_core/sdk.ts`
4. `server/_core/cookies.ts`
5. `app/oauth/callback.tsx`
6. `lib/_core/auth.ts`
7. `lib/_core/api.ts`

## Suggested Verification After Fixes

1. Confirm unknown origins receive no credentialed CORS response.
2. Confirm OAuth callback rejects missing or mismatched state.
3. Confirm no session token appears in callback URLs, browser history, or logs.
4. Confirm server refuses to start without `JWT_SECRET`.
5. Confirm auth logs do not contain token fragments or user PII.
