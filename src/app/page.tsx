import { AutomationControl } from "@/components/automation-control"
import { LeadTable } from "@/components/lead-table"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <AutomationControl />
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Lead Management</h2>
        <LeadTable />
      </div>
    </div>
  )
}

