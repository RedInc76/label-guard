import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UpgradeBanner = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  
  if (!isGuest) return null;
  
  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Sparkles className="h-5 w-5 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm">
          <strong>¿Quieres más perfiles, historial y análisis por IA?</strong>
          <br />
          Regístrate gratis y desbloquea todas las funciones premium.
        </span>
        <Button 
          onClick={() => navigate('/auth')}
          size="sm"
          className="flex-shrink-0"
        >
          Registrarse gratis 🚀
        </Button>
      </AlertDescription>
    </Alert>
  );
};
