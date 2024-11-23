"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AutomationSettings {
  automation_enabled: boolean;
  max_calls_batch: number;
  retry_interval: number;
  max_attempts: number;
}

export function AutomationControl() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [nextRunTime, setNextRunTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch automation settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("*")
          .single();

        if (error) throw error;
        setIsAutomationEnabled(data.automation_enabled);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching automation settings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch automation settings",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  // Update next run time
  useEffect(() => {
    const updateNextRunTime = () => {
      const now = new Date();
      const minutesToNext = 5 - (now.getMinutes() % 5);
      const nextRun = new Date(now.getTime() + minutesToNext * 60000);
      nextRun.setSeconds(0);
      setNextRunTime(nextRun.toLocaleTimeString());
    };

    updateNextRunTime();
    const interval = setInterval(updateNextRunTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    try {
      const newState = !isAutomationEnabled;
      const { error } = await supabase
        .from("settings")
        .update({ automation_enabled: newState })
        .eq("id", (await supabase.from("settings").select("id").single()).data?.id);

      if (error) throw error;

      setIsAutomationEnabled(newState);
      toast({
        title: "Success",
        description: `Automation ${newState ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error updating automation settings:", error);
      toast({
        title: "Error",
        description: "Failed to update automation settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center space-x-4 mb-8">Loading...</div>;
  }

  return (
    <div className="flex items-center space-x-4 mb-8">
      <Switch
        id="automation"
        checked={isAutomationEnabled}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="automation" className="text-base">
        Automation is {isAutomationEnabled ? "enabled" : "disabled"}
      </Label>
      {isAutomationEnabled && nextRunTime && (
        <span className="text-muted-foreground">Next run: {nextRunTime}</span>
      )}
    </div>
  );
}
