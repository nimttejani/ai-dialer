"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export function AutomationControl() {
  const [isEnabled, setIsEnabled] = useState(false)
  const nextRunTime = "23:23:29" // This would come from your API in production

  return (
    <div className="flex items-center space-x-4 mb-8">
      <Switch
        id="automation"
        checked={isEnabled}
        onCheckedChange={setIsEnabled}
      />
      <Label htmlFor="automation" className="text-base">
        Automation is {isEnabled ? "enabled" : "disabled"}
      </Label>
      <span className="text-muted-foreground">
        Next run: {nextRunTime}
      </span>
    </div>
  )
}

