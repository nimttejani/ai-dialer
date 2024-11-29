import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Creates a Supabase client for server-side API routes.
 * This is specifically for route handlers, not middleware.
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value,
        })),
        setAll: () => {
          // In Next.js app route handlers, we don't need to set cookies
          // They are handled by the middleware
        }
      }
    }
  )
}
