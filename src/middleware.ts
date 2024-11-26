import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create supabase server client with enhanced cookie security
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => Array.from(req.cookies.getAll()).map(({ name, value }) => ({
          name,
          value,
        })),
        setAll: (cookiesList) => {
          cookiesList.forEach(({ name, value, ...options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true
            })
          })
        }
      },
    }
  )

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
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Refresh session for authenticated users
    if (user) {
      const { error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
    }

    if ((!user || userError) && req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      )
    }

    if (!user || userError) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Add security headers
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      )
    }

    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
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
