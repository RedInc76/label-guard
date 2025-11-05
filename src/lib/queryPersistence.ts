import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { APP_VERSION } from '@/config/app';

/**
 * Crear persister simple usando localStorage
 * LocalStorage es suficiente para Fase 1 (capacidad ~5-10MB)
 * Evita complejidad de IndexedDB y problemas de tipos
 */
const createLocalStoragePersister = () => {
  return {
    persistClient: async (client: any) => {
      try {
        localStorage.setItem('labelguard-cache', JSON.stringify(client));
      } catch (error) {
        console.warn('Error persisting cache:', error);
      }
    },
    restoreClient: async () => {
      try {
        const stored = localStorage.getItem('labelguard-cache');
        return stored ? JSON.parse(stored) : undefined;
      } catch (error) {
        console.warn('Error restoring cache:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        localStorage.removeItem('labelguard-cache');
      } catch (error) {
        console.warn('Error removing cache:', error);
      }
    },
  };
};

/**
 * Configurar persistencia automática de cache de React Query
 * Características:
 * - Cache de 2 horas para balancear frescura vs disponibilidad offline
 * - Invalidación automática al cambiar versión de app (via buster)
 * - Solo persiste queries relevantes del usuario (perfiles, historial, favoritos, insights)
 * 
 * @param queryClient - Cliente de React Query a configurar
 */
export const setupPersistence = (queryClient: any) => {
  persistQueryClient({
    queryClient,
    persister: createLocalStoragePersister(),
    maxAge: 30 * 60 * 1000, // 30 minutos - datos más frescos
    buster: APP_VERSION, // Invalida cache automáticamente al actualizar app
    dehydrateOptions: {
      shouldDehydrateQuery: (query: any) => {
        // Solo persistir queries específicas (no admin, no logs)
        const keysToCache = ['profiles', 'history', 'favorites', 'insights', 'scans-location'];
        const queryKey = query.queryKey[0] as string;
        return keysToCache.includes(queryKey);
      },
    },
  });
};
