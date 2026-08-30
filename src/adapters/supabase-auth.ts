import { createClient } from "@supabase/supabase-js"
import type { AuthProvider, AuthUser, HttpRequestLike } from "../types/index.js"

interface JWTPayload {
  sub: string
  email?: string
  app_metadata?: {
    role?: string
    provider?: string
    providers?: string[]
    [key: string]: unknown
  }
  user_metadata?: Record<string, unknown>
  aud?: string
  exp?: number
  iat?: number
}

function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3 || !parts[1]) return null
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())
    return payload as JWTPayload
  } catch {
    return null
  }
}

function extractAdminFromJWT(payload: JWTPayload): boolean {
  const role = payload.app_metadata?.role
  if (role === "admin") return true
  const roles = payload.app_metadata?.roles
  if (Array.isArray(roles) && roles.includes("admin")) return true
  return false
}

export interface CreateSupabaseAuthProviderOptions {
  supabaseUrl: string
  serviceRoleKey: string
  jwtSecret?: string
  /** Custom function to check if user is admin. Receives user ID and Supabase admin client. */
  isAdminCheck?: (userId: string, supabaseAdmin: ReturnType<typeof createClient<any, any, any>>) => Promise<boolean>
}

export function createSupabaseAuthProvider(
  options: CreateSupabaseAuthProviderOptions,
): AuthProvider {
  const { supabaseUrl, serviceRoleKey, jwtSecret, isAdminCheck } = options

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  async function verifyUser(req: HttpRequestLike): Promise<AuthUser> {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error(
        "Missing or invalid authorization header",
      ) as Error & { status: number }
      error.status = 401
      throw error
    }

    const token = authHeader.substring(7)

    if (jwtSecret) {
      try {
        const payload = parseJWT(token)
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          // If custom admin check provided, use it
          let isAdmin = extractAdminFromJWT(payload)
          if (isAdminCheck && !isAdmin) {
            isAdmin = await isAdminCheck(payload.sub, supabaseAdmin)
          }
          return {
            id: payload.sub,
            email: payload.email,
            isAdmin,
          }
        }
      } catch {}
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      const authError = new Error("Invalid or expired token") as Error & {
        status: number
      }
      authError.status = 401
      throw authError
    }

    // Check admin status - use custom check if provided
    let isAdmin = extractAdminFromJWT({
      sub: user.id,
      email: user.email,
      app_metadata: user.app_metadata as JWTPayload["app_metadata"],
    })
    
    if (isAdminCheck && !isAdmin) {
      isAdmin = await isAdminCheck(user.id, supabaseAdmin)
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin,
    }
  }

  async function verifyAdmin(req: HttpRequestLike): Promise<AuthUser> {
    const user = await verifyUser(req)
    if (!user.isAdmin) {
      const forbiddenError = new Error("Admin access required") as Error & {
        status: number
      }
      forbiddenError.status = 403
      throw forbiddenError
    }
    return user
  }

  return { verifyUser, verifyAdmin }
}
