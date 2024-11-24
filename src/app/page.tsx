"use client";

import { LeadTable } from "@/components/lead-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { AutomationControl } from "@/components/automation-control";
import { useState, useEffect } from "react";
import { leadsService } from "@/lib/services/leads";
import { settingsService } from "@/lib/services/settings";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead } from "@/lib/supabase";
import type { AutomationSettings } from "@/lib/services/settings";

function usePageData() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [leadsResult, settingsResult] = await Promise.all([
          leadsService.getLeads(),
          settingsService.getAutomationSettings(),
        ]);

        if (leadsResult.error) {
          throw new Error(leadsResult.error.message);
        }

        setLeads(leadsResult.data || []);
        setSettings(settingsResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  return { loading, leads, settings, error };
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading, leads, settings } = usePageData();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Management</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>
      <AutomationControl initialSettings={settings} />
      <LeadTable initialLeads={leads} />
    </div>
  );
}
