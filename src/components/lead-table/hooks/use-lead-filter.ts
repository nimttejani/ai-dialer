import { useState, useEffect } from "react";
import { Lead } from "@/lib/supabase";
import { FilterCriterion } from "@/lib/types";

export function useLeadFilter(rawLeads: Lead[]) {
  const [filterConfig, setFilterConfig] = useState<FilterCriterion[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  useEffect(() => {
    setFilteredLeads(rawLeads);
  }, [rawLeads]);

  useEffect(() => {
    let processedLeads = [...rawLeads];

    // Apply filters
    if (filterConfig.length > 0) {
      processedLeads = processedLeads.filter((lead) => {
        return filterConfig.every((filter) => {
          const value = lead[filter.column as keyof Lead];
          if (value === null) return false;
          
          const stringValue = String(value).toLowerCase();
          const filterValue = filter.value.toLowerCase();
          
          return filter.type === "contains"
            ? stringValue.includes(filterValue)
            : stringValue === filterValue;
        });
      });
    }

    setFilteredLeads(processedLeads);
  }, [rawLeads, filterConfig]);

  const addFilter = (filter: FilterCriterion) => {
    setFilterConfig(prev => [...prev, filter]);
  };

  const removeFilter = (index: number) => {
    setFilterConfig(prev => prev.filter((_, i) => i !== index));
  };

  const clearFilters = () => {
    setFilterConfig([]);
  };

  return {
    filterConfig,
    filteredLeads,
    addFilter,
    removeFilter,
    clearFilters
  };
}
