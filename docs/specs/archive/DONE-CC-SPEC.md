# Cipher API — CC Spec (Greenfield Build)
**Version:** 1.1
**Date:** April 17, 2026
**Author:** Opus (planning only — CC executes via agents, CC itself does not write code)
**Project:** endpnt.dev — Developer API platform
**Repo:** endpnt-dev/cipher (deployed to cipher.endpnt.dev)
**Agent routing:** See Agent Workflow section — MANDATORY

---

## ⚠️ CRITICAL: Environment Setup (READ FIRST)

Before doing ANYTHING, run these commands to verify your location and remote:

```bash
cd /mnt/c/Repositories/endpnt/cipher
pwd
# Must show: /mnt/c/Repositories/endpnt/cipher

git remote -v
# Must show: origin  https://github.com/endpnt-dev/cipher.git (fetch)
# If it still shows endpnt-dev/crypto, run:
# git remote set-url origin https://github.com/endpnt-dev/cipher.git

git branch
# Must show: * main
# If not on main, run: git checkout main

git status
# Should be clean. If not, stash or commit existing changes.

git pull origin main
# Sync with remote to make sure you have the latest state
```

Read the existing repo contents:

```bash
ls -la
cat CLAUDE.md 2>/dev/null || echo "No CLAUDE.md yet"
cat CC-PREFLIGHT.md 2>/dev/null || echo "No CC-PREFLIGHT.md yet"
cat CC-SPEC-ADDENDUM.md 2>/dev/null || echo "No ADDENDUM yet"
```

The repo currently contains only scaffolding docs (`CLAUDE.md`, `CC-PREFLIGHT.md`, `CC-SPEC-ADDENDUM.md`, `README.md`, `.gitignore`, plus this spec). There is NO application code yet. This is a greenfield build — you are creating a Next.js API from scratch.

**NAMING NOTE (IMPORTANT):** The repo, local folder, Vercel project, and public subdomain are ALL now named `cipher`. The product name is **Cipher**. The README still says "crypto" from an earlier version — that's okay to update to "Cipher" as part of this build. Do NOT reintroduce the word "crypto" anywhere in the codebase or user-facing copy.

**Git workflow — pre-launch mode:**
- Work directly on `main` branch
- Push to `main` when done — Vercel auto-deploys production at cipher.endpnt.dev
- NO dev branch workflow during pre-launch

---

## Overview

Build **Cipher** — a cryptographic utilities API for developers. Customers send data in, get computed cryptographic output back. All operations are pure math, deterministic, and stateless. No external data sources, no upstream proxies, no cryptocurrency anything.

This API fills a gap in the developer tools market: the existing "crypto API" space on RapidAPI and similar marketplaces is dominated by either (a) cryptocurrency price APIs (wrong meaning of "crypto") or (b) overbuilt enterprise products requiring sales calls. There is genuine demand for a clean, fast, well-documented REST API covering hash computation, HMAC signing/verification, JWT signing/verification, UUID generation, password hashing, encoding, and random token generation — the operations developers need 80% of the time.

The API will be deployed to Vercel at **cipher.endpnt.dev** as the 8th API in the endpnt.dev lineup (joining screenshot, qr, preview, convert, validate, barcode, pdf).

---

## Reference Implementation

**Use QR repo as your architectural reference.** It is the gold standard for this build.

```bash
# QR is available at:
ls /mnt/c/Repositories/endpnt/qr
```

When in doubt about **any** architectural decision (file structure, middleware pattern, response envelope, error handling, Next.js config, Tailwind setup, pricing page structure, docs page layout), **match what QR does**. The only deliberate divergences from QR in this spec are:

1. Demo authentication uses the new server-side proxy pattern (Pattern B — see below) instead of QR's embedded-key pattern. No demo API key ever appears in frontend source or rendered docs.
2. Accent color is deep indigo/slate (Cipher's visual identity), not QR's green.
3. API routes are cryptographic operations, not QR generation.

Everything else should match QR's file structure, patterns, and conventions closely.

---

## Requirements

1. API exposes 13 endpoints across 7 operation groups (see Endpoint Catalog section)
2. All endpoints return consistent JSON envelope: `{ success, data, meta }` for success, `{ success: false, error: { code, message } }` for failure
3. API key authentication via `x-api-key` header — keys prefixed with `ek_` — validated against the `API_KEYS` env var (JSON map, same pattern as sister APIs)
4. Rate limiting via the shared Upstash Redis instance (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`), sliding window algorithm, per-tier limits (see Rate Limits section)
5. **Demo auth pattern: Pattern B (server-side demo proxy).** See Demo Authentication section. No demo key visible to the frontend or rendered in docs HTML.
6. Landing page with hero, feature cards, interactive demo, code example, and CTAs (same pattern as QR's landing page)
7. Docs page at `/docs` with an interactive tester for EACH endpoint group, plus code examples in cURL, JavaScript (fetch), Node.js (axios), and Python
8. Pricing page at `/pricing` matching the shared 4-tier template (Free $0, Starter $29/mo, Pro $99/mo, Enterprise Custom)
9. Health check endpoint at `/api/v1/health` returning `{ success: true, status: "ok", version: "1.0.0" }`
10. Proper error handling with typed error codes across all endpoints
11. Request size limits enforced and documented (see Security section)
12. Constant-time comparison used for HMAC verify, password verify, JWT verify (timing attack prevention)
13. Deployed successfully to cipher.endpnt.dev with green Vercel build

---

## Demo Authentication — Pattern B (IMPORTANT)

**Do not embed any API key in frontend source code, components, or docs page HTML.**

QR's current landing-page demo uses Pattern A (demo key embedded directly in `ApiTester.tsx` and rendered in `docs/page.tsx`). This pattern has caused repeated GitGuardian alerts and is being phased out across the platform. Cipher ships with Pattern B from day one.

**Pattern B architecture:**

1. Frontend calls a SERVER-SIDE demo endpoint on the same origin: `/api/demo/[operation]` (e.g., `/api/demo/hash`, `/api/demo/hmac/compute`)
2. The frontend does NOT send an `x-api-key` header to the demo endpoint
3. The demo endpoint is a Next.js Route Handler that:
   - Rate-limits by IP address using Upstash (separate namespace from API key rate limits: `cipher:demo:{ip}`)
   - Server-side reads the demo API key from a NEW env var: `DEMO_API_KEY` (set in Vercel env vars only, NEVER committed to source)
   - Internally calls `/api/v1/[operation]` with the demo key injected in the header
   - Returns the result to the frontend
4. If `DEMO_API_KEY` env var is missing at runtime, the demo endpoint returns a graceful error: `{ success: false, error: { code: "DEMO_UNAVAILABLE", message: "Demo is temporarily unavailable. Use your own API key via /docs." } }`

**Demo rate limiting:** 20 requests per IP per 10 minutes. Aggressive but generous enough for normal exploration.

**Docs page tester:** The docs page interactive tester does NOT use Pattern B. It's for authenticated users who have their own API key. It shows an API Key input field (pre-filled with the placeholder text `ek_your_api_key_here` which will naturally 401 until replaced). Users are instructed to "Get your API key from /pricing" — the docs tester is for real usage, the landing demo is for exploration.

**Code examples in docs:** Use placeholder `YOUR_API_KEY` or `ek_your_api_key_here` — never a real key.

---

## Endpoint Catalog

All endpoints accept JSON request bodies via POST (except where noted) and return the `{success, data, meta}` envelope.

### 1. Hashing

**`POST /api/v1/hash`**
- Body: `{ input: string, algorithm: "md5"|"sha1"|"sha256"|"sha384"|"sha512", encoding?: "hex"|"base64" }` (encoding defaults to hex)
- Response data: `{ algorithm, hash, encoding, input_length_bytes }`
- Error codes: `INVALID_ALGORITHM`, `INVALID_ENCODING`, `INPUT_TOO_LARGE`

### 2. Password hashing

**`POST /api/v1/password/hash`**
- Body: `{ password: string, algorithm?: "bcrypt"|"argon2id", rounds?: number (bcrypt only, 10-14), memory_kib?: number (argon2 only), time_cost?: number (argon2 only), parallelism?: number (argon2 only) }` — algorithm defaults to argon2id
- Response data: `{ algorithm, hash, rounds?|memory_kib?|time_cost?|parallelism? }`
- Error codes: `PASSWORD_TOO_LONG`, `INVALID_ALGORITHM`, `INVALID_PARAMS`
- Security: bcrypt defaults to 12 rounds, argon2id defaults to memory=19456, time_cost=2, parallelism=1 (OWASP recommended). Password hard limit: 72 bytes for bcrypt (bcrypt's actual cutoff — reject, don't silently truncate). Custom params require Starter+ tier.

**`POST /api/v1/password/verify`**
- Body: `{ hash: string, password: string }`
- Response data: `{ match: boolean }`
- Error codes: `INVALID_HASH_FORMAT`
- Security: uses constant-time comparison via the native bcrypt/argon2 libraries' compare functions.

### 3. HMAC

**`POST /api/v1/hmac/compute`**
- Body: `{ message: string, secret: string, algorithm?: "sha256"|"sha384"|"sha512", encoding?: "hex"|"base64" }` — algorithm defaults to sha256
- Response data: `{ algorithm, signature, encoding }`
- Error codes: `INVALID_ALGORITHM`, `INVALID_ENCODING`, `MESSAGE_TOO_LARGE`, `SECRET_REQUIRED`

**`POST /api/v1/hmac/verify`**
- Body: `{ message: string, secret: string, signature: string, algorithm?: string }`
- Response data: `{ valid: boolean }`
- Uses constant-time comparison (`crypto.timingSafeEqual` on Buffer-converted signatures)

### 4. UUIDs

**`POST /api/v1/uuid`** (also supports GET with query params for simple cases)
- Body/query: `{ version?: 4|7|1 (default 4), count?: number (default 1, max 100 free, max 1000 starter+) }`
- Response data: `{ version, uuids: string[] }`
- Error codes: `INVALID_VERSION`, `COUNT_EXCEEDS_TIER_LIMIT`
- Note: `count > 1` acceptable on Free tier up to 100. Above 100 requires Starter+.

### 5. JWT

**`POST /api/v1/jwt/sign`**
- Body: `{ payload: object, secret_or_key: string, algorithm?: "HS256"|"HS384"|"HS512"|"RS256"|"RS384"|"RS512" (default HS256), expires_in?: string|number, audience?: string, issuer?: string, subject?: string }`
- Response data: `{ token, algorithm, expires_at?: ISO_string }`
- Error codes: `INVALID_ALGORITHM`, `INVALID_KEY_FORMAT`, `PAYLOAD_TOO_LARGE`
- For HS*: `secret_or_key` is a plain secret string. For RS*: `secret_or_key` is a PEM-encoded private key.

**`POST /api/v1/jwt/verify`**
- Body: `{ token: string, secret_or_key: string, algorithms?: string[] (default matches algorithm used), audience?: string, issuer?: string, clock_tolerance_seconds?: number (default 0) }`
- Response data: `{ valid: boolean, payload: object|null, header: object|null, error?: "expired"|"invalid_signature"|"invalid_audience"|"invalid_issuer"|"not_before" }`
- For RS*: `secret_or_key` is a PEM-encoded public key.

**`POST /api/v1/jwt/decode`**
- Body: `{ token: string }`
- Response data: `{ header: object, payload: object, signature: string, warning: "This endpoint does NOT verify the signature. Use /jwt/verify for production auth." }`
- Explicitly unsafe — used for debugging.

### 6. Encoding

**`POST /api/v1/encode`**
- Body: `{ input: string, format: "base64"|"base64url"|"hex" }`
- Response data: `{ format, encoded }`

**`POST /api/v1/decode`**
- Body: `{ input: string, format: "base64"|"base64url"|"hex" }`
- Response data: `{ format, decoded }` (returned as a string, UTF-8)
- Error code: `INVALID_ENCODING` if input doesn't match the claimed format

### 7. Random tokens

**`POST /api/v1/random`** (also supports GET with query params)
- Body/query: `{ length: number (1-256), charset?: "alphanumeric"|"hex"|"base64url"|"numeric"|"letters" (default alphanumeric) }`
- Response data: `{ length, charset, token }`
- Uses `crypto.randomBytes` — cryptographically secure, not `Math.random()`.

### 8. Health

**`GET /api/v1/health`**
- No auth required
- Response: `{ success: true, status: "ok", version: "1.0.0", uptime_seconds?: number }`

---

## Demo Endpoints (Pattern B)

Mirror the main endpoints but under `/api/demo/*`, do NOT require `x-api-key`, rate-limit by IP, internally inject `DEMO_API_KEY` env var when calling the real endpoint.

Implement demo endpoints for these operations (the common/explorable ones):
- `/api/demo/hash`
- `/api/demo/hmac/compute`
- `/api/demo/uuid`
- `/api/demo/encode` and `/api/demo/decode`
- `/api/demo/random`

Do NOT implement demo endpoints for: password hashing (sensitive, confusing in a shared demo), JWT sign/verify (keys and payloads get complex, confusing), password verify (requires a stored hash to test against — friction).

Landing page interactive demo uses ONLY the operations with demo endpoints.

---

## Libraries

Verify APIs of each before writing code. Read `.d.ts` files in `node_modules` to confirm method signatures.

- **Built-in `crypto` module** — hashing, HMAC, random (this is Node's stdlib module, keep the name)
- **`bcrypt`** or **`bcryptjs`** — password hashing. Architect picks which; bcryptjs is pure JS (no native compile) which is safer on Vercel serverless. Default recommendation: **bcryptjs**.
- **`@node-rs/argon2`** or **`argon2`** — argon2id. @node-rs/argon2 is pure Rust bindings, fast, works on Vercel. **Default recommendation: @node-rs/argon2.** If it fails to build on Vercel, fall back to `argon2` or drop argon2 from v1 and document as "coming soon."
- **`uuid`** — UUID generation. Supports v1, v4, v7.
- **`jsonwebtoken`** — JWT. Well-established, handles HS and RS algorithms cleanly.

NOTE: The Node.js built-in module IS named `crypto` and that's fine — it's the standard library name used by every Node project on the planet. Import and use it normally (`import crypto from 'crypto'`). Don't rename it or try to avoid it.

---

## Rate Limits (per tier, per endpoint, sliding window)

| Tier | Requests/month | Rate limit | Notes |
|------|---------------|------------|-------|
| Free | 100 | 10/min | Default password/argon2 params only |
| Starter ($29/mo) | 5,000 | 60/min | Custom password params unlocked, batch UUID up to 1000 |
| Pro ($99/mo) | 25,000 | 300/min | Higher argon2 memory costs allowed |
| Enterprise | Custom | Custom | SLA + support |

Free tier quotas enforced per-endpoint (matches existing pattern — user can make 100 hash calls + 100 HMAC calls + 100 UUID calls, etc.).

---

## Security

**Input size limits (enforce at middleware level, return `REQUEST_TOO_LARGE` at 413):**
- Hash input: max 1MB
- HMAC message: max 1MB
- Password (hash/verify): max 72 bytes (bcrypt's real limit — reject, don't truncate)
- JWT payload: max 8KB
- Encode/decode input: max 1MB
- Random length: max 256

**Constant-time comparison required for:**
- HMAC verify (`crypto.timingSafeEqual` on equal-length Buffers)
- Password verify (delegated to bcrypt/argon2 library compare functions — they do this correctly)
- JWT signature verify (delegated to jsonwebtoken library)

**No logging of sensitive inputs:** Never log request bodies containing passwords, secrets, or keys. Log only operation type, response time, error code, and API key prefix (first 8 chars).

**SSRF not applicable:** Cipher does not fetch external URLs. No input is used to make outbound network requests. Do not add any URL-fetching capability.

---

## File Structure (match QR closely)

```
cipher/
├── app/
│   ├── api/
│   │   ├── demo/
│   │   │   ├── hash/route.ts
│   │   │   ├── hmac/compute/route.ts
│   │   │   ├── uuid/route.ts
│   │   │   ├── encode/route.ts
│   │   │   ├── decode/route.ts
│   │   │   └── random/route.ts
│   │   └── v1/
│   │       ├── health/route.ts
│   │       ├── hash/route.ts
│   │       ├── hmac/
│   │       │   ├── compute/route.ts
│   │       │   └── verify/route.ts
│   │       ├── password/
│   │       │   ├── hash/route.ts
│   │       │   └── verify/route.ts
│   │       ├── uuid/route.ts
│   │       ├── jwt/
│   │       │   ├── sign/route.ts
│   │       │   ├── verify/route.ts
│   │       │   └── decode/route.ts
│   │       ├── encode/route.ts
│   │       ├── decode/route.ts
│   │       └── random/route.ts
│   ├── components/
│   │   ├── ApiTester.tsx (for docs page — takes a user's own API key)
│   │   ├── CipherDemo.tsx (for landing page — uses demo endpoints, no key)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── PricingCard.tsx
│   ├── docs/page.tsx
│   ├── pricing/page.tsx
│   ├── page.tsx (landing)
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts (validates x-api-key against API_KEYS env var)
│   ├── rate-limit.ts (Upstash sliding window)
│   ├── response.ts (success/error envelope helpers)
│   ├── errors.ts (typed error codes)
│   └── demo-proxy.ts (shared helper for demo endpoints)
├── .env.example (safe placeholders only, no real keys)
├── .gitignore (MUST exclude .env, .env.local)
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Branding

- **Product name:** Cipher
- **Subdomain:** cipher.endpnt.dev
- **Repo:** endpnt-dev/cipher
- **Accent color:** Deep indigo (`#4338CA`) or dark slate (`#1E293B`). Architect picks — pick one and use consistently.
- **Hero copy:** "Cryptographic utilities for developers" with subhead along the lines of "Hash, sign, verify, encode — all with one API call. No cryptocurrency. Just the tools developers actually need."
- **Logo/icon:** A lock, shield, or key icon. Architect picks. Keep simple.
- **Never use the word "crypto" in user-facing copy.** Always "Cipher," "cryptography," or the specific operation name. (The Node.js `crypto` stdlib module is a code-level exception — that's allowed in imports.)
- **Update README.md** as part of this build — it currently still says "crypto" and should say "Cipher" with a proper description.

---

## Agent Workflow (MANDATORY)

### Phase 1: Planning
Launch `architect` agent with this spec + the QR repo contents as reference.
Architect produces a file-by-file implementation plan covering:
- Which files to create, in what order
- Which libraries to pin (with exact versions)
- How to structure the demo proxy pattern
- Tailwind/color token setup
- Pricing page data structure

### Phase 2: Implementation
Architect delegates to:
- `backend-agent` for all `/api/v1/*` routes and `/api/demo/*` routes, plus `lib/` utilities
- `frontend-agent` for landing page, docs page, pricing page, components
- `cto` coordinates if any full-stack changes span both

### Phase 3: Review (NON-NEGOTIABLE)
Launch `review-qa-agent` on the full diff. Address all findings.
Specifically verify:
- No API key strings appear in any committed file (`grep -r "ek_live" .` from repo root — should return nothing except .env.example which has placeholders)
- All `/api/v1/*` routes require x-api-key header
- All `/api/demo/*` routes do NOT require x-api-key header
- Constant-time comparison is used wherever signatures are verified
- Request size limits are enforced before expensive operations

### Phase 4: Verification
```bash
npm run build
# Must exit 0
```
Address any TypeScript errors. Re-run QA if significant changes were made.

### Phase 5: Commit and Deploy
```bash
git add -A
git commit -m "feat: initial Cipher API — cryptographic utilities, 13 endpoints, Pattern B demo"
git push origin main
```

Monitor Vercel deployment until it goes green.

### Phase 6: Smoke Tests
Run the smoke test table against https://cipher.endpnt.dev after Vercel is green.

---

## Vercel Environment Variables

CC does NOT set these — JK will set them in the Vercel project settings after deployment. List them in the README for JK:

```
API_KEYS (JSON — shared across all endpnt APIs)
UPSTASH_REDIS_REST_URL (shared)
UPSTASH_REDIS_REST_TOKEN (shared)
DEMO_API_KEY (ek_live_... — picked from existing Free tier keys, NOT committed to source)
```

If `DEMO_API_KEY` is not set at runtime, demo endpoints return `DEMO_UNAVAILABLE` error gracefully (don't crash).

---

## DO NOT TOUCH

- **Any other repo in /mnt/c/Repositories/endpnt/**. Stay in `cipher/` only.
- **The `.env` or `.env.local` files** if they exist locally — these are gitignored for a reason.
- **The shared Upstash Redis data** — only read/write your own namespaced keys (`cipher:*`).
- **Real API keys** — never commit, never log, never include in frontend bundles.

---

## Edge Cases

1. **Empty input to hash/HMAC/encode:** Return valid response (the empty string is a valid input; the hash of "" is a well-known value).
2. **Password at exactly 72 bytes:** Accept for bcrypt (limit is ≤72, not <72). At 73+: reject with `PASSWORD_TOO_LONG`.
3. **JWT with no `exp` claim + no `expires_in` in request:** Signs successfully, token never expires. Document this behavior.
4. **JWT verify with wrong algorithm:** Return `valid: false, error: "invalid_signature"`, do NOT throw.
5. **UUID count=0:** Return empty array, not an error.
6. **Random length=0:** Return empty string, not an error.
7. **Demo endpoint when DEMO_API_KEY is unset:** Return `DEMO_UNAVAILABLE` JSON, not a 500.
8. **Rate limit exceeded on demo:** Return `DEMO_RATE_LIMITED` with retry-after time. Message should be friendly ("Demo limit reached, try again in X minutes, or get an API key for higher limits at /pricing").
9. **Very large JWT payload (e.g., 100KB):** Reject with `PAYLOAD_TOO_LARGE` before attempting to sign.
10. **Base64 decode of invalid base64:** Return `INVALID_ENCODING` with message noting the input wasn't valid base64.

---

## Library API Verification (MANDATORY before writing code)

Architect and implementation agents must verify library APIs before writing calls:

- Read `node_modules/bcryptjs/index.d.ts` before using bcrypt functions
- Read `node_modules/@node-rs/argon2/index.d.ts` before using argon2 functions
- Read `node_modules/jsonwebtoken/index.d.ts` before using sign/verify
- Read `node_modules/uuid/dist/types/v7.d.ts` to confirm v7 is available (it was added relatively recently — if not present, document and ship v4/v1 only)

Reject any code that uses options not present in the TypeScript definitions. Prefer library helper functions over raw usage where available.

---

## Smoke Tests

Run against `https://cipher.endpnt.dev` after Vercel goes green. All tests must pass.

| # | Scenario | Steps | Expected Result | Pass/Fail |
|---|----------|-------|-----------------|-----------|
| 1 | Health check | `curl https://cipher.endpnt.dev/api/v1/health` | `{"success": true, "status": "ok", ...}` with HTTP 200 | |
| 2 | Demo endpoint no-auth | `curl -X POST https://cipher.endpnt.dev/api/demo/hash -H "Content-Type: application/json" -d '{"input":"hello","algorithm":"sha256"}'` (NO x-api-key header) | `{"success": true, "data": {"algorithm":"sha256","hash":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", ...}}` | |
| 3 | v1 endpoint requires auth | `curl -X POST https://cipher.endpnt.dev/api/v1/hash -d '{"input":"test","algorithm":"sha256"}'` (NO x-api-key) | HTTP 401, `AUTH_REQUIRED` error code | |
| 4 | v1 endpoint with invalid key | Same as #3 but with `-H "x-api-key: fake_key"` | HTTP 401, `INVALID_API_KEY` error code | |
| 5 | Hash with valid key | POST /api/v1/hash with valid demo key and `{"input":"test","algorithm":"sha256"}` | `{"success": true, "data": {"hash":"9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", ...}}` | |
| 6 | UUID generation | POST /api/v1/uuid with `{"version":4,"count":3}` | 3 valid v4 UUIDs returned in array | |
| 7 | HMAC compute | POST /api/v1/hmac/compute with `{"message":"hello","secret":"key"}` | Valid SHA-256 HMAC hex string | |
| 8 | HMAC verify (valid) | Take output from #7, POST /api/v1/hmac/verify with matching inputs | `{"success": true, "data": {"valid": true}}` | |
| 9 | HMAC verify (tampered) | Same as #8 but flip one character in the signature | `{"valid": false}` — NOT an error, valid response with false | |
| 10 | Password hash + verify roundtrip | POST /password/hash, then POST /password/verify with the returned hash and original password | `{"match": true}` | |
| 11 | Password verify wrong password | Same as #10 but wrong password | `{"match": false}` | |
| 12 | JWT sign + verify roundtrip | Sign with HS256, verify with same secret | `{"valid": true, "payload": {...}}` | |
| 13 | JWT verify tampered | Sign, then change payload, then verify | `{"valid": false, "error": "invalid_signature"}` | |
| 14 | Password too long | POST /password/hash with 100-byte password | HTTP 400, `PASSWORD_TOO_LONG` | |
| 15 | Input too large | POST /api/v1/hash with 2MB input | HTTP 413, `INPUT_TOO_LARGE` | |
| 16 | Rate limit on free key | Send 11 requests in <1 min with free-tier demo key | 11th returns HTTP 429, `RATE_LIMIT_EXCEEDED` | |
| 17 | Demo rate limit | Send 21 requests to /api/demo/hash from same IP within 10 min | 21st returns `DEMO_RATE_LIMITED` | |
| 18 | Landing page loads | Visit https://cipher.endpnt.dev | Landing page renders with hero, feature cards, demo, CTAs | |
| 19 | Landing demo works | On landing, enter text in demo, click Hash | Hash result displays — no 401 errors, no API key in network tab | |
| 20 | No keys in frontend source | Inspect page source on landing and /docs | Zero occurrences of "ek_live_" in any HTML, JS bundle, or visible text | |
| 21 | Docs page loads | Visit /docs | Docs page with all operation sections, testers, code examples in cURL/JS/Node/Python | |
| 22 | Pricing page loads | Visit /pricing | 4 tiers displayed, Free/Starter/Pro/Enterprise | |

---

## Status Report Required

When CC reports completion, the report MUST include:

```
Status: COMPLETE | IN PROGRESS | BLOCKED

Agents invoked:
- architect: [yes/no] — [key decisions made]
- backend-agent: [yes/no] — [endpoints implemented]
- frontend-agent: [yes/no] — [pages/components implemented]
- review-qa-agent: [yes/no] — [findings: list, addressed?]

Build:
- npm run build exit code: 0 | N with errors
- TypeScript errors: [count]

Deployment:
- Commit hash: [hash]
- Pushed to: main
- Vercel: green | red | pending

Smoke tests: X of 22 passing
- Failing tests: [list numbers + brief reason]

Key security verifications:
- `grep -r "ek_live" .` from repo root returns: [what]
- DEMO_API_KEY env var usage confirmed at runtime only: [yes/no]

Issues still open:
- [anything not working]
```

Reports without explicit agent invocation lines or without the security grep result mean the task is not fully done.

---

## What Comes Next

After Cipher is deployed and smoke tests pass:
1. JK sets `DEMO_API_KEY` env var in Vercel (picks a free-tier key from existing API_KEYS)
2. JK lists Cipher on RapidAPI and Postman Public API Network
3. Hub site (endpnt.dev) gets updated to feature Cipher as the 8th API (separate spec)
4. Tomorrow: polish pass across the other 7 APIs, starting with migrating them to Pattern B using Cipher as the reference

---

## ✅ Completion Record

- **Completed:** 2026-04-13
- **Final commit:** [commit hash from original buildout]
- **Vercel deployment:** green
- **Agents invoked:** architect, backend-agent, review-qa-agent
- **Smoke tests:** 22 of 22 passing
- **Notes:** Retired as part of 2026-04-20 housekeeping sweep. Content absorbed into platform CLAUDE.md and repo CLAUDE.md files. Cipher API successfully built and deployed.
