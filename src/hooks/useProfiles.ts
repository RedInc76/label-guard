import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/services/profileService';
import type { Profile } from '@/types/restrictions';

// Hook para obtener todos los perfiles (con cache automático)
export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => ProfileService.getProfiles(),
    staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantener en memoria 10 minutos
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
  });
};

// Hook para obtener solo perfiles activos (con cache)
export const useActiveProfiles = () => {
  return useQuery({
    queryKey: ['profiles', 'active'],
    queryFn: () => ProfileService.getActiveProfiles(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook para toggle profile (con optimistic update)
export const useToggleProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileId: string) => ProfileService.toggleProfileActive(profileId),
    // OPTIMISTIC UPDATE: actualizar UI inmediatamente
    onMutate: async (profileId) => {
      // Cancelar refetch en curso
      await queryClient.cancelQueries({ queryKey: ['profiles'] });
      await queryClient.cancelQueries({ queryKey: ['profiles', 'active'] });
      
      // Snapshot del estado anterior (para rollback)
      const previousProfiles = queryClient.getQueryData(['profiles']);
      const previousActiveProfiles = queryClient.getQueryData(['profiles', 'active']);
      
      // Actualizar UI inmediatamente (ANTES de que responda Supabase)
      queryClient.setQueryData(['profiles'], (old: Profile[] | undefined) => {
        if (!old) return old;
        return old.map(p => 
          p.id === profileId ? { ...p, isActive: !p.isActive } : p
        );
      });

      queryClient.setQueryData(['profiles', 'active'], (old: Profile[] | undefined) => {
        if (!old) return old;
        const profile = old.find(p => p.id === profileId);
        if (profile) {
          // Si estaba activo, quitarlo de la lista
          return old.filter(p => p.id !== profileId);
        }
        return old;
      });
      
      return { previousProfiles, previousActiveProfiles };
    },
    // Si falla, revertir cambios
    onError: (err, profileId, context) => {
      if (context?.previousProfiles) {
        queryClient.setQueryData(['profiles'], context.previousProfiles);
      }
      if (context?.previousActiveProfiles) {
        queryClient.setQueryData(['profiles', 'active'], context.previousActiveProfiles);
      }
    },
    // Siempre refetch después de mutar
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'active'] });
    },
  });
};

// Hook para crear un perfil
export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => ProfileService.createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
};

// Hook para actualizar un perfil
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Profile, 'id' | 'createdAt'>> }) => 
      ProfileService.updateProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'active'] });
    },
  });
};

// Hook para eliminar un perfil
export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => ProfileService.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profiles', 'active'] });
    },
  });
};

// Hook para obtener max profiles permitidos
export const useMaxProfiles = () => {
  return useQuery({
    queryKey: ['profiles', 'max'],
    queryFn: () => ProfileService.getMaxProfiles(),
    staleTime: Infinity, // No cambia durante la sesión
    gcTime: Infinity,
  });
};
