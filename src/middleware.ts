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

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // If there's no valid user and the request is to an API route, return 401
    if ((!user || error) && req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (error) {
      console.error('Auth error:', error.message)
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    // For API routes, return 500 on error
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    return res
  }
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
