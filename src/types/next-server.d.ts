// Type declarations for next/server (virtual module)
// These types are based on Next.js 14's next/server module

export interface NextRequest {
  method: string;
  headers: Headers;
  url: string;
  nextUrl: URL;
  cookies: {
    get(name: string): string | undefined;
    getAll(name: string): string[];
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string, options?: CookieOptions): void;
    has(name: string): boolean;
    clear(): void;
  };
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  formData(): Promise<FormData>;
  clone(): NextRequest;
  signal: AbortSignal;
  redirect: string;
  credentials: RequestCredentials;
  destination: RequestDestination;
  integrity: string;
  mode: RequestMode;
  priority: RequestPriority;
  referrer: string;
  referrerPolicy: ReferrerPolicy;
  cache: RequestCache;
  mode: RequestMode;
  credentials: RequestCredentials;
  destination: RequestDestination;
  headers: Headers;
  integrity: string;
  keepalive: boolean;
  method: string;
  redirect: RequestRedirect;
  signal: AbortSignal;
}

export interface NextResponse {
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  redirected: boolean;
  type: ResponseType;
  url: string;
  body: ReadableStream | null;
  bodyUsed: boolean;
  clone(): NextResponse;
  json(): Promise<any>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  formData(): Promise<FormData>;
  static json(data: any, init?: ResponseInit): NextResponse;
  static redirect(url: string, status?: number): NextResponse;
  static error(): NextResponse;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

declare global {
  interface Global {
    NextRequest: typeof NextRequest;
    NextResponse: typeof NextResponse;
  }
}