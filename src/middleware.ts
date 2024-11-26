import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Define public routes that bypass auth
  const PUBLIC_ROUTES = [
    '/api/cron',
    '/api/integrations/vapi',
    '/login'
  ]
  
  if (PUBLIC_ROUTES.includes(req.nextUrl.pathname)) {
    return res
  }

  try {
    const { 
      data: { user }, 
      error: userError 
    } = await supabase.auth.getUser()

    if ((!user || userError) && req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer'
          }
        }
      )
    }

    if (userError) {
      console.error('Auth error:', userError.message)
      // Redirect non-API routes to login on auth error
      if (!req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      )
    }
    
    // Redirect non-API routes to login on error
    return NextResponse.redirect(new URL('/login', req.url))
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
