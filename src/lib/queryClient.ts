import { QueryClient } from '@tanstack/react-query';

/**
 * Singleton de QueryClient para usar en servicios y componentes
 * Permite invalidar caché desde servicios (ej: después de guardar historial)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      networkMode: 'online',
    },
  },
});
