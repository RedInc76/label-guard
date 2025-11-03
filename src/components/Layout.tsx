import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { InitialDisclaimerDialog } from './InitialDisclaimerDialog';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-subtle to-background">
      <InitialDisclaimerDialog />
      
      {/* Banner de estado offline */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Modo offline:</strong> Mostrando datos guardados. 
              Las nuevas acciones se sincronizarán al reconectar.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className={isOnline ? "pb-28" : "pb-28 pt-20"}>
        {children}
      </main>
      <Navigation />
    </div>
  );
};