import { Suspense } from "react";
import { leadsService } from "@/lib/services/leads";
import { settingsService } from "@/lib/services/settings";
import { ClientAutomationControl } from "@/components/client-automation-control";
import { ClientLeadTable } from "@/components/client-lead-table";
import { ClientHeader } from "@/components/client-header";

async function PageData() {
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
      <Suspense fallback={<div>Loading header...</div>}>
        <ClientHeader />
      </Suspense>

      <Suspense fallback={<div>Loading automation control...</div>}>
        <ClientAutomationControl initialSettings={settings} />
      </Suspense>
      
      <Suspense fallback={<div>Loading leads table...</div>}>
        <ClientLeadTable initialLeads={leads} />
      </Suspense>
    </div>
  );
}
