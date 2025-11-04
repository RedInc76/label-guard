import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

type ConnectionSpeed = 'fast' | 'slow' | 'offline';

export const ConnectionSpeedIndicator = () => {
  const isOnline = useOnlineStatus();
  const [connectionSpeed, setConnectionSpeed] = useState<ConnectionSpeed>('fast');

  useEffect(() => {
    if (!isOnline) {
      setConnectionSpeed('offline');
      return;
    }

    // Detectar velocidad de conexión si el navegador lo soporta
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
          setConnectionSpeed('slow');
        } else {
          setConnectionSpeed('fast');
        }
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }
  }, [isOnline]);

  // Solo mostrar cuando hay problemas de conexión
  if (connectionSpeed === 'fast') {
    return null;
  }

  if (connectionSpeed === 'offline') {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Sin conexión a internet. Mostrando datos guardados en caché.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <Wifi className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-900 dark:text-orange-200">
        Conexión lenta detectada. La carga de imágenes puede tardar más de lo normal.
      </AlertDescription>
    </Alert>
  );
};
