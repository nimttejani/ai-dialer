import { supabase } from '../supabase'
import type { Lead } from '../supabase'

export const leadsService = {
  async getLeads(): Promise<{ data: Lead[] | null; error: any }> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    return { data, error }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; error?: any }> {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)

    return { success: !error, error }
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
  }
}
