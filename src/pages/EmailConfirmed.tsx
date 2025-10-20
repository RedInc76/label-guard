import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const EmailConfirmed = () => {
  const navigate = useNavigate();
  const { isPremium, loading } = useAuth();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // If user is premium (confirmed), redirect after countdown
    if (isPremium) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/scanner');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPremium, navigate, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⏳</span>
            </div>
            <CardTitle>Procesando confirmación</CardTitle>
            <CardDescription>
              Si ya confirmaste tu email, inicia sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Ir a iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Email confirmado! 🎉</CardTitle>
          <CardDescription>
            Tu cuenta ha sido verificada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirigiendo en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
          <Button 
            onClick={() => navigate('/scanner')} 
            className="w-full"
          >
            Ir al escáner ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
