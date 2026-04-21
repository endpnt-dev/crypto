/**
 * Demo proxy configuration for origin-based access control
 *
 * Phase 0 of demo-proxy standardization: strict origin enforcement
 * per CC-SPEC-DEMO-PROXY-STANDARDIZATION.md v3.2
 */

export const ALLOWED_ORIGINS = [
  'https://cipher.endpnt.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

export type AllowedOrigin = string