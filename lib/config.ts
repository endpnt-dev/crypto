export const API_VERSION = '1.0.0'

// Rate limiting - 100 requests/month for free tier (confirmed in requirements)
export const TIER_LIMITS = {
  free: {
    requests_per_minute: 10,
    requests_per_month: 100
  },
  starter: {
    requests_per_minute: 60,
    requests_per_month: 5000
  },
  pro: {
    requests_per_minute: 300,
    requests_per_month: 25000
  },
  enterprise: {
    requests_per_minute: 1000,
    requests_per_month: 100000
  },
} as const

// Crypto input limits
export const CRYPTO_LIMITS = {
  input_max_mb: 1,  // 1MB limit for hash/hmac inputs
  bcrypt_cost: { min: 10, max: 15 },  // Cost 10-15, warn >12
  jwt_max_payload_kb: 100,  // Reasonable JWT payload size
}

// Supported algorithms
export const HASH_ALGORITHMS = [
  'md5', 'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'
] as const

export const HMAC_ALGORITHMS = [
  'sha1', 'sha256', 'sha512', 'sha3-256', 'sha3-512'
] as const

export const JWT_ALGORITHMS = [
  'HS256', 'HS384', 'HS512'
] as const

export const ENCODING_TYPES = [
  'base64', 'base64url', 'hex'
] as const

export const UUID_VERSIONS = [1, 4, 7] as const

export const CHARSETS = [
  'alphanumeric', 'alphabetic', 'numeric', 'hex', 'base64'
] as const

// Error codes - following platform standards plus crypto-specific ones
export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_PARAMS: 'INVALID_PARAMS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // Crypto-specific
  UNSUPPORTED_ALGORITHM: 'UNSUPPORTED_ALGORITHM',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  INVALID_BCRYPT_COST: 'INVALID_BCRYPT_COST',
  INVALID_UUID_VERSION: 'INVALID_UUID_VERSION',
  INVALID_JWT: 'INVALID_JWT',
  JWT_EXPIRED: 'JWT_EXPIRED',
  JWT_INVALID_SIGNATURE: 'JWT_INVALID_SIGNATURE',
  JWT_INVALID_ISSUER: 'JWT_INVALID_ISSUER',
  JWT_INVALID_AUDIENCE: 'JWT_INVALID_AUDIENCE',
  INPUT_TOO_LARGE: 'INPUT_TOO_LARGE',
  INVALID_CHARSET: 'INVALID_CHARSET',
  // Demo-proxy specific
  DEMO_UNAVAILABLE: 'DEMO_UNAVAILABLE',
  ORIGIN_NOT_ALLOWED: 'ORIGIN_NOT_ALLOWED',
  UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
} as const

export const DEMO_RATE_LIMIT = {
  requests_per_window: 20,
  window_minutes: 10,
} as const

// Type exports
export type HashAlgorithm = typeof HASH_ALGORITHMS[number]
export type HmacAlgorithm = typeof HMAC_ALGORITHMS[number]
export type JwtAlgorithm = typeof JWT_ALGORITHMS[number]
export type EncodingType = typeof ENCODING_TYPES[number]
export type UuidVersion = typeof UUID_VERSIONS[number]
export type Charset = typeof CHARSETS[number]
export type ApiTier = keyof typeof TIER_LIMITS
export type ErrorCode = keyof typeof ERROR_CODES