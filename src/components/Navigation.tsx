import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ScanLine, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Capacitor } from '@capacitor/core';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPremium, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/', showAlways: true },
    { icon: ScanLine, label: 'Escanear', path: '/scanner', showAlways: true },
    { icon: Settings, label: 'Configuración', path: '/settings', showAlways: true },
  ];

  const visibleItems = navItems.filter(item => item.showAlways || isPremium);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-sm z-50">
      <div className="flex justify-between items-center py-2 px-2">
        <div className="flex justify-around items-center flex-1">
          {visibleItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                location.pathname === path
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
        {isPremium && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              await signOut();
              navigate('/auth');
            }} 
            className="h-12 mr-1"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  );
};
