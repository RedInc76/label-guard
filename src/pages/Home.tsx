import { useNavigate } from 'react-router-dom';
import { ScanLine, User, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Múltiples Perfiles',
      description: 'Crea perfiles para cada miembro de tu familia'
    },
    {
      icon: ScanLine,
      title: 'Escaneo Rápido',
      description: 'Escanea códigos de barras al instante'
    },
    {
      icon: Zap,
      title: 'Análisis Combinado',
      description: 'Verifica productos para todos tus perfiles activos'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center pt-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-strong">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            LabelGuard
          </h1>
          <p className="text-muted-foreground text-lg">
            Interpreta ingredientes según tus restricciones
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            size="lg" 
            className="h-20 flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-soft"
            onClick={() => navigate('/scanner')}
          >
            <ScanLine className="w-6 h-6" />
            <span>Escanear</span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-20 flex-col gap-2 border-2 border-primary/20 hover:bg-primary/5"
            onClick={() => navigate('/profile')}
          >
            <User className="w-6 h-6" />
            <span>Perfiles</span>
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-foreground">
            ¿Cómo funciona?
          </h2>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <Card key={index} className="p-4 border border-border/50 shadow-soft hover:shadow-strong transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
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
        </div>

        {/* CTA */}
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-2">
              ¡Comienza ahora!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea perfiles para tu familia y comienza a escanear productos
            </p>
            <Button 
              onClick={() => navigate('/profile')}
              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
            >
              Configurar Perfiles
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};