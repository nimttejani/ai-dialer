'use client';

import { useMemo } from 'react';
import { LeadTable } from './lead-table';
import { useQuery } from '@tanstack/react-query';
import { leadsService } from '@/lib/services/leads';
import type { Lead } from '@/lib/supabase';

export function ClientLeadTable({ initialLeads }: { initialLeads: Lead[] }) {
  // Use React Query for data fetching and caching
  const { data: leads = initialLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const result = await leadsService.getLeads();
      if (result.error) throw result.error;
      return result.data || [];
    },
    initialData: initialLeads,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Memoize the LeadTable component to prevent unnecessary re-renders
  const MemoizedLeadTable = useMemo(() => (
    <LeadTable initialLeads={leads} />
  ), [leads]);

  return MemoizedLeadTable;
}
