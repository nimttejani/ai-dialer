'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { settingsService } from '@/lib/services/settings'
import { useToast } from '@/hooks/use-toast'

export function OutboundCallControl() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await settingsService.getAutomationSettings()
      setEnabled(settings.automation_enabled)
      setLoading(false)
    }

    fetchSettings()
  }, [])

  const handleToggle = async (newState: boolean) => {
    setLoading(true)
    const result = await settingsService.updateAutomationEnabled(newState)
    
    if (result.success) {
      setEnabled(newState)
      toast({
        title: newState ? "Outbound Calling Enabled" : "Outbound Calling Disabled",
        description: newState 
          ? "System is now making calls to leads" 
          : "Outbound calling has been paused",
      })
    } else {
      toast({
        title: "Error",
        description: `Failed to update settings: ${result.error}`,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm mb-4">
      <div className="space-y-0.5">
        <div className="text-lg font-semibold">Outbound Call System</div>
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : enabled ? 'System is actively making calls' : 'System is paused'}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          aria-label="Toggle outbound calling"
        />
        <span className="text-sm font-medium">
          {loading ? 'Loading...' : enabled ? 'Active' : 'Paused'}
        </span>
      </div>
    </div>
  )
}
