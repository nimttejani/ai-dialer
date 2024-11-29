import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

// Create a Supabase client with the service role key to bypass RLS
export const createServiceClient = () => createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Update call status in the database
export async function updateCallStatus(phoneNumber: string, status: Database['public']['Tables']['leads']['Row']['status']) {
  const supabase = createServiceClient()
  
  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status,
        last_called_at: new Date().toISOString()
      })
      .eq('phone', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating call status:', error)
    return { success: false, error }
  }
}
