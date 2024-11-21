import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient<{ leads: Lead }>(supabaseUrl, supabaseKey);