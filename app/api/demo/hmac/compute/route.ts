import { NextRequest } from 'next/server'
import { demoProxy } from '@/lib/demo-proxy'
import { ALLOWED_ORIGINS } from '@/lib/demo-config'

export async function POST(request: NextRequest) {
  return demoProxy(request, {
    endpoint: '/hmac/compute',
    allowedOrigins: ALLOWED_ORIGINS,
    allowedMethods: ['POST'],
  })
}