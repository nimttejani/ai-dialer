"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { settingsService } from "@/lib/services/settings";
import { useToast } from "@/hooks/use-toast";
import type { AutomationSettings } from "@/lib/services/settings";

interface AutomationControlProps {
  initialSettings: AutomationSettings | null;
}

export function AutomationControl({ initialSettings }: AutomationControlProps) {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(initialSettings?.automation_enabled ?? false);
  const [nextRunTime, setNextRunTime] = useState("");
  const { toast } = useToast();

  // Update next run time
  useEffect(() => {
    const updateNextRunTime = () => {
      const now = new Date();
      if (isAutomationEnabled) {
        const nextRun = new Date(now.getTime() + (initialSettings?.retry_interval ?? 300) * 1000);
        setNextRunTime(nextRun.toLocaleTimeString());
      } else {
        setNextRunTime("");
      }
    };

    updateNextRunTime();
    const interval = setInterval(updateNextRunTime, 1000);

    return () => clearInterval(interval);
  }, [isAutomationEnabled, initialSettings?.retry_interval]);

  const handleToggle = async () => {
    try {
      const { success, error } = await settingsService.updateAutomationEnabled(!isAutomationEnabled);
      
      if (!success) {
        throw new Error(error);
      }

      setIsAutomationEnabled(!isAutomationEnabled);
      toast({
        title: "Success",
        description: `Automation ${!isAutomationEnabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast({
        title: "Error",
        description: "Failed to toggle automation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-8">
      <Switch
        id="automation"
        checked={isAutomationEnabled}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="automation">
        {isAutomationEnabled
          ? `Automation enabled (next run at ${nextRunTime})`
          : "Automation disabled"}
      </Label>
    </div>
  );
}
