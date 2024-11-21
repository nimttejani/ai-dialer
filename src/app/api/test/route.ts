import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);
    
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json({ data });
}