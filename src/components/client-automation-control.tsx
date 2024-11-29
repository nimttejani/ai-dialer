'use client';

import { useCallback } from 'react';
import { AutomationControl } from './automation-control';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { settingsService } from '@/lib/services/settings';
import type { AutomationSettings } from '@/lib/services/settings';

export function ClientAutomationControl({ 
  initialSettings 
}: { 
  initialSettings: AutomationSettings | null 
}) {
  const queryClient = useQueryClient();

  // Use React Query for settings management
  const { data: settings, isLoading } = useQuery({
    queryKey: ['automation-settings'],
    queryFn: settingsService.getAutomationSettings,
    initialData: initialSettings,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
  });

  // Mutation for updating settings
  const { mutate: updateSettings } = useMutation({
    mutationFn: settingsService.updateAutomationEnabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
    },
  });

  // Memoized callback for handling settings updates
  const handleSettingsUpdate = useCallback((enabled: boolean) => {
    updateSettings(enabled);
  }, [updateSettings]);

  return (
    <AutomationControl 
      initialSettings={settings} 
      onSettingsUpdate={handleSettingsUpdate}
    />
  );
}
