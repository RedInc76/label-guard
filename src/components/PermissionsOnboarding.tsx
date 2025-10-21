import { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PermissionsService, PermissionsStatus } from '@/services/permissionsService';
import { Capacitor } from '@capacitor/core';

type OnboardingState = 'initial' | 'requesting' | 'success' | 'partial' | 'denied';

export const PermissionsOnboarding = () => {
  const [state, setState] = useState<OnboardingState>('initial');
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    camera: false,
    location: false
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar si no se ha completado el onboarding y estamos en mobile
    const shouldShow = !PermissionsService.hasCompletedOnboarding() && Capacitor.isNativePlatform();
    setIsVisible(shouldShow);
  }, []);

  const handleRequestPermissions = async () => {
    setState('requesting');
    
    try {
      const result = await PermissionsService.requestAllPermissions();
      setPermissions(result);
      
      if (result.camera && result.location) {
        setState('success');
      } else if (result.camera) {
        setState('partial');
      } else {
        setState('denied');
      }
    } catch (error) {
      console.error('[PermissionsOnboarding] Error requesting permissions:', error);
      setState('denied');
    }
  };

  const handleSkip = () => {
    PermissionsService.markOnboardingComplete();
    setIsVisible(false);
  };

  const handleContinue = () => {
    PermissionsService.markOnboardingComplete();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-300">
        {state === 'initial' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ¡Bienvenido a LabelGuard!
              </h2>
              <p className="text-muted-foreground">
                Para ofrecerte la mejor experiencia, necesitamos acceso a:
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Camera className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Cámara</h3>
                  <p className="text-sm text-muted-foreground">
                    Para escanear códigos de barras de productos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Ubicación</h3>
                  <p className="text-sm text-muted-foreground">
                    Para recordar dónde compraste cada producto <span className="italic">(opcional)</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={handleRequestPermissions} className="w-full" size="lg">
                Permitir accesos
              </Button>
              <Button onClick={handleSkip} variant="ghost" className="w-full">
                Omitir por ahora
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Puedes cambiar estos permisos en cualquier momento desde la configuración de la app
            </p>
          </>
        )}

        {state === 'requesting' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 animate-spin border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Solicitando permisos...</p>
          </div>
        )}

        {state === 'success' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                ¡Todo listo!
              </h2>
              <p className="text-muted-foreground mb-6">
                Todos los permisos han sido otorgados. Ya puedes usar la app sin restricciones.
              </p>
            </div>

            <Button onClick={handleContinue} className="w-full" size="lg">
              Comenzar a usar LabelGuard
            </Button>
          </>
        )}

        {state === 'partial' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Permisos parciales
              </h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm">Cámara: Otorgado</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm">Ubicación: Denegado</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No te preocupes</AlertTitle>
              <AlertDescription>
                Puedes usar la app sin el permiso de ubicación. Solo no se guardará dónde compraste cada producto.
              </AlertDescription>
            </Alert>

            <Button onClick={handleContinue} className="w-full">
              Continuar
            </Button>
          </>
        )}

        {state === 'denied' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Permisos denegados
              </h2>
              <p className="text-muted-foreground mb-4">
                Para usar la cámara, necesitas habilitar los permisos en la configuración.
              </p>
            </div>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>¿Cómo habilitar permisos?</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p><strong>iPhone:</strong></p>
                <p className="text-xs">Ajustes → LabelGuard → Cámara → Permitir</p>
                <p className="mt-2"><strong>Android:</strong></p>
                <p className="text-xs">Configuración → Apps → LabelGuard → Permisos → Cámara → Permitir</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={() => PermissionsService.openSystemSettings()} className="w-full">
                Abrir Ajustes
              </Button>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Continuar sin permisos
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
