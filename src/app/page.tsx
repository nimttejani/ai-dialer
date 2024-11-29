import { Suspense } from "react";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { SettingsService } from "@/lib/services/settings";
import { LeadsService } from "@/lib/services/leads";
import { ClientAutomationControl } from "@/components/client-automation-control";
import { ClientLeadTable } from "@/components/client-lead-table";
import { ClientHeader } from "@/components/client-header";
import { Skeleton } from "@/components/ui/skeleton";

// Loading skeletons for each component
function HeaderSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <Skeleton className="h-9 w-48" /> {/* For "Lead Management" text */}
      <Skeleton className="h-9 w-24" /> {/* For "Sign Out" button */}
    </div>
  );
}

function AutomationControlSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" /> {/* For "Outbound Calling" text */}
        <Skeleton className="h-4 w-64" /> {/* For status text */}
      </div>
      <Skeleton className="h-6 w-11" /> {/* For the switch */}
    </div>
  );
}

function LeadTableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="border-b px-4 py-3">
        <Skeleton className="h-8 w-full" /> {/* Table header */}
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-4 py-3 border-b last:border-0">
          <Skeleton className="h-12 w-full" /> {/* Table rows */}
        </div>
      ))}
    </div>
  );
}

async function PageData() {
  const supabase = await createRouteHandlerClient();
  const settingsService = new SettingsService(supabase);
  const leadsService = new LeadsService(supabase);
  
  const [leadsResult, settingsResult] = await Promise.all([
    leadsService.getLeads(),
    settingsService.getAutomationSettings(),
  ]);

  if (leadsResult.error) {
    throw new Error(leadsResult.error.message);
  }

  return {
    leads: leadsResult.data || [],
    settings: settingsResult,
  };
}

export default async function DashboardPage() {
  const { leads, settings } = await PageData();
  
  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <ClientHeader />
      </Suspense>

      <Suspense fallback={<AutomationControlSkeleton />}>
        <ClientAutomationControl initialSettings={settings} />
      </Suspense>
      
      <Suspense fallback={<LeadTableSkeleton />}>
        <ClientLeadTable initialLeads={leads} />
      </Suspense>
    </div>
  );
}
