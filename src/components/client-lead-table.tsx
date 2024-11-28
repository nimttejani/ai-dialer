'use client';

import { LeadTable } from './lead-table';
import type { Lead } from '@/lib/supabase/client';

export function ClientLeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  return <LeadTable initialLeads={initialLeads} />;
}
