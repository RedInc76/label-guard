import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HistoryService } from '@/services/historyService';

export const useHistory = (limit = 50) => {
  return useQuery({
    queryKey: ['history', limit],
    queryFn: () => HistoryService.getHistory(limit),
    staleTime: 2 * 60 * 1000, // Cache 2 minutos
    gcTime: 5 * 60 * 1000,
  });
};

export const useInsights = (days = 30) => {
  return useQuery({
    queryKey: ['insights', days],
    queryFn: () => HistoryService.getInsightsData(days),
    staleTime: 5 * 60 * 1000, // Cache 5 minutos (insights cambian menos)
    gcTime: 10 * 60 * 1000,
  });
};

export const useDeleteHistoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => HistoryService.deleteHistoryItem(id),
    onSuccess: () => {
      // Invalidar tanto history como insights
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

export const useScansWithLocation = (filters?: { compatible?: boolean; minScore?: number; days?: number }) => {
  return useQuery({
    queryKey: ['scans-location', filters],
    queryFn: () => HistoryService.getScansWithLocation(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
