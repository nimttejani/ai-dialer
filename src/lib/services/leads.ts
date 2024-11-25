import { supabase } from '../supabase'
import type { Lead } from '../supabase'

export type LeadStatus = "pending" | "calling" | "no_answer" | "scheduled" | "not_interested";

export const leadsService = {
  async getLeads(sortBy?: { column: keyof Lead; ascending: boolean }): Promise<{ data: Lead[] | null; error: any }> {
    let query = supabase
      .from('leads')
      .select('*')

    if (sortBy) {
      query = query.order(sortBy.column, { ascending: sortBy.ascending })
    }

    const { data, error } = await query
    return { data, error }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; data?: Lead | null; error?: any }> {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { success: !error, data, error }
  },

  async deleteLead(id: string): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    return { success: !error, error }
  },

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Lead | null; error?: any }> {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()
      .single()

    return { data, error }
  },

  async createLeads(leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from('leads')
      .insert(leads)

    return { success: !error, error }
  },

  async updateLeadStatus(ids: string[], status: Lead['status']) {
    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    return {
      success: !error && !!data,
      data,
      error,
    };
  },
}
