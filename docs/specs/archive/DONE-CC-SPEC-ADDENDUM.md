# CC Spec Addendum — Crypto API

**Read this BEFORE CC-SPEC.md.** These are additions discovered after the main spec was drafted, incorporating lessons from the PDF API build.

---

## 1. Read CC-PREFLIGHT.md first

Before any code is written, read `CC-PREFLIGHT.md` in this same directory. It covers the 10 most important things that would otherwise cause repeated build failures (Next 14 config syntax, mandatory local build, library verification, etc.).

## 2. Mandatory local `npm run build` before every push

**Never `git push` without running `npm run build` locally first and confirming exit 0.**

This single rule would have prevented 8 of the 12 PDF build failures. Workflow:

```bash
npm run build           # Must exit 0
git add -A && git commit -m "..."
git push origin main
```

## 3. Library API verification — specific gotchas for this API

### jsonwebtoken v9+ API

`jsonwebtoken` v9 changed some defaults for security. Before writing JWT code, verify the actual signatures:

```typescript
// Type definitions at: node_modules/@types/jsonwebtoken/index.d.ts
// Key functions:
// - sign(payload, secretOrPrivateKey, options?): string
// - verify(token, secretOrPublicKey, options?, callback?): JwtPayload | string
// - decode(token, options?): null | JwtPayload | string
```

Options DO NOT include `algorithm` with value `"none"` as a valid choice in production code paths. Reject explicitly.

### bcryptjs — NOT bcrypt

Use `bcryptjs` (pure JS) not `bcrypt` (native C++). The CC-SPEC.md already specifies this. Double-check in package.json before pushing — CC sometimes "helpfully" swaps to the "more popular" `bcrypt` which will cause Vercel build failures.

### Node built-in crypto

For SHA family, HMAC, random: use Node's built-in `crypto` module, not third-party libraries. Verify available algorithms with:

```typescript
import { getHashes } from 'crypto';
console.log(getHashes());  // List of supported hash algorithms
```

SHA-3 variants are named `sha3-256` and `sha3-512` in Node — confirm exact names before hardcoding.

## 4. Security requirements (re-emphasized)

From the main spec, but worth repeating:

- **Never log input values.** Not the plaintext, not the secret, not the payload. Only log request_id + algorithm + processing_ms.
- **Never echo secrets back in responses.** HMAC response contains output only, not the secret input.
- **Reject JWT "none" algorithm** in encode AND verify paths.
- **Pass explicit `algorithms` array to jwt.verify()** — don't let it default to accepting any algorithm in the token header.

## 5. No native modules needed (simpler than PDF)

Crypto API uses only pure-JS libraries. No @napi-rs/canvas, no qpdf, no WASM. This means:
- `next.config.js` can be minimal (just `reactStrictMode: true`)
- No `serverComponentsExternalPackages` entries needed
- No `webpack.externals` hacks
- No binary bundling

Don't over-engineer the config. If you see yourself adding `experimental` blocks to next.config.js for this API, stop and verify it's actually necessary.

## 6. Rate limit tier difference

Per CC-SPEC.md: Crypto's free tier is **1,000 operations/month**, NOT 100. Crypto operations are ~1000x cheaper than screenshot/preview/PDF operations. Copying the rate-limit config from `validate/lib/rate-limit.ts` is fine, but verify the tier counts are adjusted for crypto.

---

## ✅ Completion Record

- **Completed:** 2026-04-13
- **Final commit:** [commit hash from original buildout]
- **Vercel deployment:** green
- **Agents invoked:** architect, backend-agent, review-qa-agent
- **Smoke tests:** [N of N] passing
- **Notes:** Retired as part of 2026-04-20 housekeeping sweep. Build-time advisory for an API that is now built. Content absorbed into platform CLAUDE.md and repo CLAUDE.md files.
