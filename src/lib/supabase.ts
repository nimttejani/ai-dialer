import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Lead = {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  status: 'pending' | 'no_answer' | 'scheduled' | 'not_interested';
  call_attempts: number;
  last_called_at: string | null;
  created_at: string;
  updated_at: string;
};

// Create a singleton instance using Next.js auth helpers
export const supabase = createClientComponentClient();

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