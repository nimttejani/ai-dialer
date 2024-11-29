import { supabase } from '@/lib/supabase/client';
import type { Lead } from '@/lib/supabase/types';

export type LeadStatus = "pending" | "calling" | "no_answer" | "scheduled" | "not_interested";

export const leadsService = {
  async getLeads(
    options: {
      sortBy?: { column: keyof Lead | null; ascending: boolean };
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: Lead[] | null; error: any; count: number }> {
    const { sortBy, page, pageSize } = options;
    
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Only apply sorting if we have a valid column
      if (sortBy?.column) {
        query = query.order(sortBy.column, {
          ascending: sortBy.ascending,
        });
      } else {
        // Default sort by created_at desc if no sort specified
        query = query.order('created_at', { ascending: false });
      }

      // Only apply pagination if both page and pageSize are provided
      if (typeof page === 'number' && typeof pageSize === 'number') {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        return { 
          data: null, 
          error: { 
            message: 'Failed to fetch leads',
            details: error 
          }, 
          count: 0 
        };
      }

      return {
        data,
        error: null,
        count: count || 0,
      };
    } catch (error) {
      console.error('Unexpected error in getLeads:', error);
      return { 
        data: null, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        }, 
        count: 0 
      };
    }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; data?: Lead | null; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating lead:', error);
        return { 
          success: false, 
          error: { 
            message: 'Failed to update lead',
            details: error 
          } 
        };
      }

      return { success: true, data }
    } catch (error) {
      console.error('Unexpected error in updateLead:', error);
      return { 
        success: false, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        } 
      };
    }
  },

  async deleteLead(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting lead:', error);
        return { 
          success: false, 
          error: { 
            message: 'Failed to delete lead',
            details: error 
          } 
        };
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in deleteLead:', error);
      return { 
        success: false, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        } 
      };
    }
  },

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Lead | null; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error);
        return { 
          data: null, 
          error: { 
            message: 'Failed to create lead',
            details: error 
          } 
        };
      }

      return { data }
    } catch (error) {
      console.error('Unexpected error in createLead:', error);
      return { 
        data: null, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        } 
      };
    }
  },

  async createLeads(leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('leads')
        .insert(leads)

      if (error) {
        console.error('Error creating leads:', error);
        return { 
          success: false, 
          error: { 
            message: 'Failed to create leads',
            details: error 
          } 
        };
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error in createLeads:', error);
      return { 
        success: false, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        } 
      };
    }
  },

  async updateLeadStatus(ids: string[], status: Lead['status']) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select();

      if (error) {
        console.error('Error updating lead status:', error);
        return { 
          success: false, 
          error: { 
            message: 'Failed to update lead status',
            details: error 
          } 
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Unexpected error in updateLeadStatus:', error);
      return { 
        success: false, 
        error: { 
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        } 
      };
    }
  },
}
