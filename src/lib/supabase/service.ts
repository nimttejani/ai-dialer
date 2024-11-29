import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

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

// Fetch pending leads that need to be called
export async function fetchPendingLeads(maxCallsBatch: number, retryInterval: number, maxAttempts: number) {
  const supabase = createServiceClient()
  
  try {
    const query = supabase
      .from('leads')
      .select('*')
      .eq('status', 'pending')
      .or(`last_called_at.is.null,last_called_at.lt.${new Date(Date.now() - retryInterval * 60 * 1000).toISOString()}`)
      .lt('call_attempts', maxAttempts)
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(maxCallsBatch);

    console.log('Fetching pending leads with conditions:', {
      status: 'pending',
      retryIntervalMinutes: retryInterval,
      maxAttempts,
      maxCallsBatch,
      retryTime: new Date(Date.now() - retryInterval * 60 * 1000).toISOString()
    });

    const { data: leads, error } = await query;

    if (error) throw error
    return { success: true, leads }
  } catch (error) {
    console.error('Error fetching pending leads:', error)
    return { success: false, error }
  }
}

// Update lead with new call attempt
export async function updateLeadWithCallAttempt(leadId: string, currentAttempts: number) {
  const supabase = createServiceClient()
  
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        call_attempts: currentAttempts + 1,
        last_called_at: new Date().toISOString(),
        status: 'calling'
      })
      .eq('id', leadId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating lead with call attempt:', error)
    return { success: false, error }
  }
}
