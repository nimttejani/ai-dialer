import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
if (!process.env.VAPI_API_KEY) throw new Error('VAPI_API_KEY is required')
if (!process.env.VAPI_AGENT_ID) throw new Error('VAPI_AGENT_ID is required')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Fetch automation settings from Supabase
async function getAutomationSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching settings:', error)
    return {
      isAutomationEnabled: false,
      maxCallsPerBatch: 5,
      retryIntervalHours: 4,
      maxAttempts: 3
    }
  }

  return {
    isAutomationEnabled: data.automation_enabled ?? false,
    maxCallsPerBatch: data.max_calls_batch ?? 5,
    retryIntervalHours: data.retry_interval ?? 4,
    maxAttempts: data.max_attempts ?? 3
  }
}

// Initiate a VAPI call
async function initiateVapiCall(lead: any) {
  const response = await fetch('https://api.vapi.ai/call/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: process.env.VAPI_AGENT_ID,
      caller_id: process.env.VAPI_CALLER_ID,
      customer: {
        phone_number: lead.phone,
        company_name: lead.company_name,
      },
      // Add any other data needed by your VAPI agent
      metadata: {
        lead_id: lead.id,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to initiate VAPI call: ${response.statusText}`)
  }

  return response.json()
}

export async function GET() {
  try {
    // Get automation settings
    const settings = await getAutomationSettings()

    if (!settings.isAutomationEnabled) {
      return NextResponse.json({ message: 'Automation is disabled' })
    }

    // Fetch leads to process
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'pending')
      .or(`last_called_at.is.null,last_called_at.lt.${new Date(Date.now() - settings.retryIntervalHours * 60 * 60 * 1000).toISOString()}`)
      .lt('call_attempts', settings.maxAttempts)
      .order('last_called_at', { ascending: true, nullsFirst: true })
      .limit(settings.maxCallsPerBatch)

    if (fetchError) {
      console.error('Error fetching leads:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: 'No leads to process' })
    }

    // Initiate calls for each lead
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
            })
            .eq('id', lead.id)

          if (updateError) {
            console.error('Error updating lead:', updateError)
            return { lead, success: false, error: updateError }
          }

          return { lead, success: true, callId: callResult.call_id }
        } catch (error) {
          console.error(`Error processing lead ${lead.id}:`, error)
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
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  runtime: 'edge'
}
