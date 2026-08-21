import type { HandleChargeOptions } from './handleChargeRequest.ts'
import { handleChargeRequest } from './handleChargeRequest.ts'

// Type declarations for Next.js server (virtual module)
// These types are declared in src/types/next-server.d.ts

export function createNextRouteHandler(options: HandleChargeOptions) {
  return async function POST(req: any): Promise<any> {
    const httpRequest = {
      method: req.method,
      headers: req.headers,
      json: () => req.json(),
    }

    const result = await handleChargeRequest(httpRequest, options)

    // Try to use NextResponse if available, otherwise create a basic response
    if (typeof globalThis !== 'undefined' && (globalThis as any).NextResponse) {
      return (globalThis as any).NextResponse.json(result.body, { status: result.status })
    }
    
    // Fallback response
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}