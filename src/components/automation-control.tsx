"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export function AutomationControl() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [nextRunTime, setNextRunTime] = useState("");

  useEffect(() => {
    const time = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString();
    setNextRunTime(time);
  }, []);

  return (
    <div className="flex items-center space-x-4 mb-8">
      <Switch
        id="automation"
        checked={isAutomationEnabled}
        onCheckedChange={setIsAutomationEnabled}
      />
      <Label htmlFor="automation" className="text-base">
        Automation is {isAutomationEnabled ? "enabled" : "disabled"}
      </Label>
      <span className="text-muted-foreground">Next run: {nextRunTime}</span>
    </div>
  );
}
