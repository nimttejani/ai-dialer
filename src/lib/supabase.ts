import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

export type Lead = {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  status: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested';
  call_attempts: number;
  last_called_at: string | null;
  created_at: string;
  updated_at: string;
};

// Create a singleton instance using Supabase SSR for browser
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Debug auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth State Change:', { 
    event, 
    hasSession: !!session,
    accessToken: session?.access_token ? 'present' : 'missing',
  });
});

// Export a function to check auth state
export const getAuthDebugInfo = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  return {
    session,
    user,
    error,
    hasValidSession: !!session?.access_token,
    accessToken: session?.access_token ? 'present' : 'missing',
  };
};

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