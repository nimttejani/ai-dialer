"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

export default function AutomationControl() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [nextRunTime, setNextRunTime] = useState<string>("");

  useEffect(() => {
    // Only set the time once the component mounts
    const futureDate = new Date(Date.now() + 5 * 60 * 1000);
    setNextRunTime(formatDateTime(futureDate));
  }, []);

  const handleToggle = () => {
    setIsAutomationEnabled(!isAutomationEnabled);
  };

  return (
    <div className="flex items-center space-x-4 mb-4">
      <Switch
        id="automation-toggle"
        checked={isAutomationEnabled}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="automation-toggle">
        Automation is {isAutomationEnabled ? "enabled" : "disabled"}
      </Label>
      {nextRunTime && (
        <span className="text-sm text-gray-500">Next run: {nextRunTime}</span>
      )}
    </div>
  );
}
