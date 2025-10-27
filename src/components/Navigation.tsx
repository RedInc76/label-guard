import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ScanLine, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Logout button en esquina superior derecha */}
      {isPremium && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }} 
          className="fixed top-4 right-4 z-50 h-10 w-10 p-0"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}

      {/* Barra de navegación con glassmorphism */}
      <nav className="nav-bar">
        <div className="nav-container">
          {/* Botón Inicio - Izquierda */}
          <button
            onClick={() => navigate('/')}
            className={cn(
              "nav-item",
              isActive('/') && "nav-item-active"
            )}
          >
            <Home size={24} />
            {isActive('/') && <div className="nav-indicator" />}
          </button>

          {/* Botón Central Flotante - Escanear */}
          <button
            onClick={() => navigate('/scanner')}
            className="scan-button"
          >
            <ScanLine size={28} className="text-white" />
          </button>

          {/* Botón Settings - Derecha */}
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              "nav-item",
              isActive('/settings') && "nav-item-active"
            )}
          >
            <Settings size={24} />
            {isActive('/settings') && <div className="nav-indicator" />}
          </button>
        </div>
      </nav>
    </>
  );
};
