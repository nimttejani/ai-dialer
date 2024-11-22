import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Check if automation is enabled
  // In a real application, you'd fetch this from a database
  const isAutomationEnabled = true

  if (!isAutomationEnabled) {
    return NextResponse.json({ message: 'Automation is disabled' })
  }

  // Fetch leads to process
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'pending')
    .or('last_called_at.is.null,last_called_at.lt.' + new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
    .lt('call_attempts', 2)
    .order('last_called_at', { ascending: true, nullsFirst: true })
    .limit(5)

  if (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  // Process leads (simulate calling with VAPI)
  for (const lead of leads) {
    // Simulate a call
    const callResult = Math.random() < 0.3 ? 'scheduled' : 'no_answer'

    // Update lead status
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: callResult,
        call_attempts: lead.call_attempts + 1,
        last_called_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('Error updating lead:', updateError)
    }

    // If scheduled, simulate sending a confirmation email
    if (callResult === 'scheduled') {
      console.log(`Sending confirmation email to ${lead.email}`)
      // In a real application, you'd integrate with Resend here
    }

    // If this was the second failed attempt, simulate sending a follow-up email
    if (callResult === 'no_answer' && lead.call_attempts === 1) {
      console.log(`Sending follow-up email to ${lead.email}`)
      // In a real application, you'd integrate with Resend here
    }
  }

  return NextResponse.json({ message: `Processed ${leads.length} leads` })
}

export const config = {
  runtime: 'edge',
}

