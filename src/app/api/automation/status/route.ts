import { NextResponse } from 'next/server'
import { formatDateTime } from '@/lib/utils'

// This is a placeholder. In a real application, you'd store and retrieve this state from a database.
let isAutomationEnabled = false

export async function GET() {
  const nextRunTime = formatDateTime(new Date(Date.now() + 5 * 60 * 1000))
  return NextResponse.json({ isEnabled: isAutomationEnabled, nextRunTime })
}

