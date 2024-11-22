'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function AutomationControl() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false)
  const nextRunTime = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString() // 5 minutes from now

  const handleToggle = () => {
    setIsAutomationEnabled(!isAutomationEnabled)
  }

  return (
    <div className="flex items-center space-x-4 mb-4">
      <Switch id="automation-toggle" checked={isAutomationEnabled} onCheckedChange={handleToggle} />
      <Label htmlFor="automation-toggle">
        Automation is {isAutomationEnabled ? 'enabled' : 'disabled'}
      </Label>
      <span className="text-sm text-gray-500">Next run: {nextRunTime}</span>
    </div>
  )
}

