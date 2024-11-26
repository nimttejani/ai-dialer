import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Allow these endpoints to bypass session check
  if (
    req.nextUrl.pathname === '/api/cron' ||
    req.nextUrl.pathname === '/api/integrations/vapi'
  ) {
    return res
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If there's no session and the request is to an API route, return 401
  if (!session && req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
