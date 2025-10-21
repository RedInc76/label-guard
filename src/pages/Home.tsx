import { useNavigate } from 'react-router-dom';
import { ScanLine, Sparkles, History, Star, Brain, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

export const Home = () => {
  const navigate = useNavigate();
  const { isPremium, isGuest } = useAuth();

  const premiumFeatures = [
    {
      icon: Sparkles,
      title: 'Hasta 5 perfiles personalizados',
      description: 'Crea perfiles para cada miembro de tu familia'
    },
    {
      icon: History,
      title: 'Historial completo',
      description: 'Revisa todos tus escaneos anteriores'
    },
    {
      icon: Star,
      title: 'Favoritos',
      description: 'Guarda tus productos de confianza'
    },
    {
      icon: Brain,
      title: 'Análisis con IA',
      description: 'Escanea productos sin código con inteligencia artificial'
    }
  ];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-8">
          <div className="w-32 h-32 mx-auto mb-6">
            <img src="/logo-192.png" alt="LabelGuard" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            LabelGuard
          </h1>
          <p className="text-muted-foreground text-lg">
            Interpreta ingredientes según tus restricciones
          </p>
        </div>

        {/* Auth Buttons - Solo si es guest */}
        {isGuest && (
          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              onClick={() => navigate('/auth?mode=signup')}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Crear cuenta gratis
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-12 border"
              onClick={() => navigate('/auth?mode=login')}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar sesión
            </Button>
          </div>
        )}

        {/* Quick Scan Button */}
        <Card className="p-6 border border-border hover:border-primary/30 transition-all shadow-sm">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg mb-1">
                {isGuest ? '¡Prueba sin registrarte!' : '¡Listo para escanear!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGuest 
                  ? 'Escanea productos con restricciones básicas'
                  : 'Analiza productos con todos tus perfiles'
                }
              </p>
            </div>
            <Button 
              onClick={() => navigate('/scanner')}
              size="lg"
              className="w-full"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              Escanear ahora
            </Button>
          </div>
        </Card>

        {/* Premium Benefits - Solo si es guest */}
        {isGuest && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge className="mb-3 px-4 py-1.5 bg-primary text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Funciones Premium
              </Badge>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ¿Por qué registrarte?
              </h2>
              <p className="text-muted-foreground">
                Desbloquea el máximo potencial de LabelGuard
              </p>
            </div>

            <div className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-4 border border-border hover:border-primary/20 hover:shadow-sm transition-all bg-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Final CTA */}
            <Card className="p-6 bg-primary text-white shadow-sm">
              <div className="text-center space-y-4">
                <h3 className="font-bold text-xl">
                  ¡Es gratis y toma solo 30 segundos!
                </h3>
                <p className="text-white/90 text-sm">
                  Únete a miles de personas que cuidan su alimentación con LabelGuard
                </p>
                <Button 
                  onClick={() => navigate('/auth?mode=signup')}
                  size="lg"
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Crear mi cuenta gratis
                </Button>
              </div>
            </Card>
            
            {/* Legal Disclaimer */}
            <div className="mt-8">
              <LegalDisclaimer variant="general" compact={true} />
            </div>
          </div>
        )}

        {/* Si ya está logueado, mostrar acceso directo a perfiles */}
        {isPremium && (
          <>
            <Card className="p-6 bg-muted/50 border-primary/20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center p-2">
                  <img src="/logo-192.png" alt="Premium" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    Cuenta Premium activa
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Administra tus perfiles y restricciones
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Ver mis perfiles
                </Button>
              </div>
            </Card>
            
            {/* Legal Disclaimer for premium users too */}
            <div className="mt-6">
              <LegalDisclaimer variant="general" compact={true} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
