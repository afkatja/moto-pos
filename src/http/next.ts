import type { HandleChargeOptions } from './handleChargeRequest.ts'
import { handleChargeRequest } from './handleChargeRequest.ts'

// Type declarations for Next.js server (virtual module)
// These types are declared in src/types/next-server.d.ts

export function createNextRouteHandler(options: HandleChargeOptions) {
  return async function POST(req: any): Promise<any> {
    try {
      // Next.js 15+ App Router: headers() returns Promise<Headers>
      // Pages Router: req.headers is already Headers object
      const headers = typeof req.headers === 'function' 
        ? await req.headers() 
        : req.headers
      
      const httpRequest = {
        method: req.method,
        headers: headers instanceof Headers ? headers : new Headers(headers),
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
    } catch (error: unknown) {
      console.error('Charge handler error:', error)
      
      // Sanitize error message for client
      const sanitizedError = sanitizeError(error)
      
      if (typeof globalThis !== 'undefined' && (globalThis as any).NextResponse) {
        return (globalThis as any).NextResponse.json(
          { error: sanitizedError.message },
          { status: sanitizedError.status }
        )
      }
      
      return new Response(JSON.stringify({ error: sanitizedError.message }), {
        status: sanitizedError.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}

function sanitizeError(error: unknown): { status: number; message: string } {
  const err = error as { status?: number; message?: string }
  
  // Handle authentication errors
  if (err.status === 401 || err.message?.includes('unauthorized') || err.message?.includes('Authentication')) {
    return {
      status: 401,
      message: 'Authentication required. Please log in to process payments.',
    }
  }
  
  // Handle missing env/config errors (500)
  if (err.status === 500 || err.message?.includes('env') || err.message?.includes('config')) {
    return {
      status: 500,
      message: 'Server configuration error. Please contact support.',
    }
  }
  
  // Default to generic 500
  return {
    status: 500,
    message: 'An unexpected error occurred. Please try again later.',
  }
}