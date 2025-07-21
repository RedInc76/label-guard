import { useNavigate, useLocation } from 'react-router-dom';
import { User, ScanLine, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: ScanLine, label: 'Escanear', path: '/scanner' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-strong">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200",
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
    </nav>
  );
};