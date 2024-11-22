import { NextResponse } from 'next/server'

// This is a placeholder. In a real application, you'd store and retrieve this state from a database.
let isAutomationEnabled = false

export async function POST(request: Request) {
  const { isEnabled } = await request.json()
  isAutomationEnabled = isEnabled
  return NextResponse.json({ isEnabled: isAutomationEnabled })
}

