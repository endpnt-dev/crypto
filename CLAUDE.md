# CLAUDE.md — Cipher API Specific Rules

**This file supplements `C:\Repositories\endpnt\CLAUDE.md` (platform-wide rules).** Read both. Universal rules (definition of done, mandatory workflow, agent usage, status-report honesty, etc.) are in the platform file. Only Cipher-specific guidance lives here.

---

## Security is Non-Negotiable

This API handles secrets, passwords, and keys. Security is more important than any other concern:

### Never log inputs or outputs

- Log: `request_id`, `algorithm`, `processing_ms`
- NEVER log: plaintext, secrets, payloads, hash outputs, tokens

If you add a `console.log(input)` for debugging, REMOVE IT before committing. Not "comment it out" — remove it.

### Never echo secrets back in responses

- HMAC response contains output only, NOT the secret input
- JWT encode response contains the token only, NOT the signing secret
- Bcrypt hash response contains the hash only, NOT the plaintext password

Even when it would be "convenient" to echo back for client confirmation, don't. The response field must not contain any secret passed in.

### Reject JWT `none` algorithm explicitly

`jsonwebtoken` library and its ilk have historical CVEs around accepting `alg: "none"` tokens as valid. Your code must:

- Reject `"none"` in `/jwt/encode` with `INVALID_PARAMS`
- Pass explicit `algorithms: ['HS256', 'HS384', ...]` array to `jwt.verify()` — never let it accept whatever's in the token header

### Use `bcryptjs`, NEVER `bcrypt`

Native `bcrypt` fails to compile on Vercel. `bcryptjs` is pure JavaScript, works everywhere, 3-5x slower but fine for API use cases. If CC "helpfully" swaps to `bcrypt`, the build will break.

---

## Library API Specifics

### jsonwebtoken v9+

Read `node_modules/@types/jsonwebtoken/index.d.ts` before writing JWT code. Key functions:

```typescript
// sign(payload, secretOrPrivateKey, options?): string
// verify(token, secretOrPublicKey, options?, callback?): JwtPayload | string
// decode(token, options?): null | JwtPayload | string
```

Pass explicit `algorithms` array to `verify()`. Never rely on defaults.

### Node's built-in `crypto` module

For SHA family, HMAC, random: use Node's built-in `crypto` module (the Node.js standard library), not third-party. Verify available algorithms:

```typescript
import { getHashes } from 'crypto';
console.log(getHashes());  // Lists all supported hash algorithms
```

SHA-3 variants are named `sha3-256` and `sha3-512` in Node — confirm exact names before hardcoding.

> **Note on naming:** This API is `cipher` (the endpnt.dev service). The underlying Node standard-library module that provides primitives is still called `crypto` — that's a Node name, not an endpnt name. When this file references Node's `crypto` module, it means the Node.js standard library. When it references this API, it's "Cipher."

---

## No Native Modules Needed (simpler than other APIs)

Cipher uses only pure-JS libraries. No `@napi-rs/canvas`, no binaries, no WASM. This means:

- `next.config.js` can be minimal (just `reactStrictMode: true`)
- No `serverComponentsExternalPackages` entries needed
- No webpack externals hacks
- No binary bundling

**If you find yourself adding `experimental` blocks to next.config.js for this API, stop and verify it's actually necessary.** Cipher is the simplest API in the platform — keep the config simple too.

---

## Rate Limit Tiers

Cipher uses the platform-standard tier limits. Free tier is **100 operations/month** — matching `web/lib/pricing.ts` (source of truth) and `lib/config.ts` (enforcement). The earlier claim of 1,000/month in this file was incorrect (traced to a false citation in a retired addendum spec).

Copying `lib/rate-limit.ts` from another API is correct — cipher uses the platform-standard tier counts, no adjustment needed.

---

## Cipher-Specific Error Codes

Beyond platform errors:
- `UNSUPPORTED_ALGORITHM` (400)
- `INVALID_INPUT_FORMAT` (400)
- `INVALID_BCRYPT_COST` (400)
- `INVALID_UUID_VERSION` (400)
- `INVALID_JWT` (400)
- `JWT_EXPIRED` (401)
- `JWT_INVALID_SIGNATURE` (401)
- `JWT_INVALID_ISSUER` (401)
- `JWT_INVALID_AUDIENCE` (401)
- `INPUT_TOO_LARGE` (400) — 1MB limit on hash/hmac inputs
- `INVALID_CHARSET` (400)

---

## Bcrypt Cost Warning

- Bcrypt cost 10 is the default sweet spot
- Cost < 10 is insecure — reject
- Cost > 12 may hit Vercel's 10s function timeout on cold starts — warn in meta but allow up to 15

Set `maxDuration: 10` in `vercel.json` for `/bcrypt/hash` and return a clear timeout error if exceeded.

---

## `review-qa-agent` is MANDATORY for this API

Beyond the universal agent guidance: for Cipher, run `review-qa-agent` BEFORE the final commit on ANY change. A missed security bug here is a much bigger deal than a missed bug in color conversion or string validation.
