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
          <Skeleton className="h-[36px] w-[200px]" />
          <Skeleton className="h-[36px] w-[80px]" />
        </div>
        {/* Automation Control Skeleton */}
        <Skeleton className="h-[32px] w-full" />
        {/* Lead Table Skeleton */}
        <div>
          {/* Table Actions */}
          <div className="mb-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-[90px]" />
              <Skeleton className="h-9 w-[90px]" />
            </div>
            <Skeleton className="h-9 w-[90px]" />
          </div>
          {/* Table Header */}
          <div className="rounded-md border">
            <div className="border-b">
              <div className="flex items-center h-10 px-2">
                <Skeleton className="h-4 w-4 mr-4" />
                {[200, 150, 120, 120, 120, 100].map((width, i) => (
                  <div key={i} className="flex-1">
                    <Skeleton className={`h-4 w-[${width}px]`} />
                  </div>
                ))}
              </div>
            </div>
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b last:border-none">
                <div className="flex items-center h-12 px-2">
                  <Skeleton className="h-4 w-4 mr-4" />
                  {[200, 150, 120, 120, 120, 100].map((width, j) => (
                    <div key={j} className="flex-1">
                      <Skeleton className={`h-4 w-[${width}px]`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
