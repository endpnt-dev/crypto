import { NextResponse } from 'next/server'
import { ErrorCode } from './config'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
  }
  meta?: {
    request_id?: string
    processing_ms?: number
    remaining_credits?: number
  }
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  )
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta,
    },
    { status }
  )
}

export function generateRequestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}`
}

export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    AUTH_REQUIRED: 'API key is required. Include x-api-key header.',
    INVALID_API_KEY: 'Invalid API key. Check your credentials.',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    INVALID_PARAMS: 'Invalid parameters. Check the request format.',
    INTERNAL_ERROR: 'Internal server error. Please try again later.',
    // Crypto-specific error messages
    UNSUPPORTED_ALGORITHM: 'Unsupported algorithm. Check the supported algorithms list.',
    INVALID_INPUT_FORMAT: 'Invalid input format. Check the input data.',
    INVALID_BCRYPT_COST: 'Invalid bcrypt cost. Must be between 10 and 15.',
    INVALID_UUID_VERSION: 'Invalid UUID version. Supported versions: 1, 4, 7.',
    INVALID_JWT: 'Invalid JWT token format.',
    JWT_EXPIRED: 'JWT token has expired.',
    JWT_INVALID_SIGNATURE: 'JWT token signature is invalid.',
    JWT_INVALID_ISSUER: 'JWT token issuer is invalid.',
    JWT_INVALID_AUDIENCE: 'JWT token audience is invalid.',
    INPUT_TOO_LARGE: 'Input data is too large. Maximum size is 1MB.',
    INVALID_CHARSET: 'Invalid character set specified.',
    // Demo-proxy specific error messages
    DEMO_UNAVAILABLE: 'Demo service temporarily unavailable.',
    ORIGIN_NOT_ALLOWED: 'Origin not allowed for demo access.',
    UNSUPPORTED_OPERATION: 'Unsupported operation. Check the endpoint documentation.',
  }
  return messages[code]
}