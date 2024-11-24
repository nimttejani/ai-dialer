import { NextResponse, Request } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SettingsService } from '@/lib/services/settings'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
if (!process.env.VAPI_API_KEY) throw new Error('VAPI_API_KEY is required')
if (!process.env.VAPI_ASSISTANT_ID) throw new Error('VAPI_ASSISTANT_ID is required')
if (!process.env.VAPI_PHONE_NUMBER_ID) throw new Error('VAPI_PHONE_NUMBER_ID is required')
if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET is required')

// Create a Supabase client with the service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create a settings service instance with the service role client
const settingsService = new SettingsService(supabase)

// Fetch automation settings from Supabase
async function getAutomationSettings() {
  console.log('Fetching automation settings...');
  try {
    const settings = await settingsService.getAutomationSettings();
    console.log('Settings retrieved:', settings);
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      automation_enabled: false,
      max_calls_batch: 5,
      retry_interval: 4,
      max_attempts: 3
    }
  }
}

// Initiate a VAPI call
async function initiateVapiCall(lead: any) {
  console.log(`Initiating VAPI call for lead:`, lead);
  
  const payload = {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    customer: {
      number: lead.phone
    }
  };
  console.log('VAPI request payload:', payload);

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })

  const responseData = await response.text();
  console.log(`VAPI API response (${response.status}):`, responseData);

  if (!response.ok) {
    throw new Error(`Failed to initiate VAPI call: ${response.status} ${response.statusText} - ${responseData}`)
  }

  return JSON.parse(responseData);
}

export async function GET(request: Request) {
  try {
    console.log('Cron job started');
    
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get automation settings
    const settings = await getAutomationSettings()
    console.log('Automation settings:', settings);

    if (!settings.automation_enabled) {
      console.log('Automation is disabled, exiting');
      return NextResponse.json({ message: 'Automation is disabled' })
    }

    // Fetch leads to process
    console.log('Fetching pending leads...');
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'pending')
      .or(`last_called_at.is.null,last_called_at.lt.${new Date(Date.now() - settings.retry_interval * 60 * 60 * 1000).toISOString()}`)
      .lt('call_attempts', settings.max_attempts)
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(settings.max_calls_batch)

    if (fetchError) {
      console.log('Error fetching leads:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    console.log(`Found ${leads?.length || 0} leads to process`);
    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to process' })
    }

    // Initiate calls for each lead
    console.log('Processing leads...');
    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          // Start VAPI call
          const callResult = await initiateVapiCall(lead)

          // Update lead with call attempt (status will be updated by webhook)
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              call_attempts: lead.call_attempts + 1,
              last_called_at: new Date().toISOString(),
              status: 'calling'
            })
            .eq('id', lead.id)

          if (updateError) {
            console.log('Error updating lead:', updateError)
            return { lead, success: false, error: updateError }
          }

          return { lead, success: true, callId: callResult.id }
        } catch (error) {
          console.log(`Error processing lead ${lead.id}:`, error)
          return { lead, success: false, error }
        }
      })
    )

    // Prepare summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }

    return NextResponse.json({
      message: 'Calls initiated',
      summary,
      details: results
    })
  } catch (error) {
    console.log('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
