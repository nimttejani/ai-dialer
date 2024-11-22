import { NextResponse } from 'next/server'

// This is a placeholder. In a real application, you'd store and retrieve this state from a database.
let isAutomationEnabled = false

export async function GET() {
  // In a real application, you'd fetch the next run time from Vercel Cron
  const nextRunTime = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now

  return NextResponse.json({ isEnabled: isAutomationEnabled, nextRunTime })
}

