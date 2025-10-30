import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PermissionsService, PermissionsStatus } from '@/services/permissionsService';
import { Capacitor } from '@capacitor/core';

export const Permissions = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<PermissionsStatus>({
    camera: false,
    location: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    setIsLoading(true);
    const status = await PermissionsService.checkAllPermissions();
    setPermissions(status);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleRequestPermissions = async () => {
    await PermissionsService.requestAllPermissions();
    await loadPermissions();
  };

  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4 pt-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Permisos</h1>
          </div>

          <Alert>
            <AlertTitle>Solo disponible en móvil</AlertTitle>
            <AlertDescription>
              Los permisos solo son necesarios en la versión móvil de la app.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Permisos</h1>
        </div>

        <p className="text-muted-foreground">
          Gestiona los permisos que LabelGuard necesita para funcionar correctamente.
        </p>

        {/* Permission Status */}
        <div className="space-y-3">
          {/* Camera Permission */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Camera className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">Cámara</h3>
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : permissions.camera ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Necesario para escanear códigos de barras de productos
                </p>
                <p className={`text-xs font-medium ${permissions.camera ? 'text-success' : 'text-destructive'}`}>
                  {permissions.camera ? '✓ Otorgado' : '✗ Denegado'}
                </p>
              </div>
            </div>
          </Card>

          {/* Location Permission */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">Ubicación</h3>
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : permissions.location ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Para recordar dónde compraste cada producto <span className="italic">(opcional)</span>
                </p>
                <p className={`text-xs font-medium ${permissions.location ? 'text-success' : 'text-muted-foreground'}`}>
                  {permissions.location ? '✓ Otorgado' : '○ No otorgado'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        {!permissions.camera && (
          <Alert variant="destructive">
            <AlertTitle>⚠️ Permiso de cámara requerido</AlertTitle>
            <AlertDescription>
              Sin el permiso de cámara no podrás escanear productos. Por favor, habilítalo para usar la app.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button onClick={handleRequestPermissions} className="w-full" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Solicitar permisos nuevamente
          </Button>
          
          <Button 
            onClick={() => PermissionsService.openSystemSettings()} 
            variant="outline" 
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Abrir Ajustes del Sistema
          </Button>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-3">
            💡 ¿Cómo habilitar permisos manualmente?
          </h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">iPhone (iOS):</p>
              <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
                <li>Abre <strong>Ajustes</strong> de tu iPhone</li>
                <li>Busca y selecciona <strong>LabelGuard</strong></li>
                <li>Activa <strong>Cámara</strong> y <strong>Ubicación</strong></li>
              </ol>
            </div>

            <div>
              <p className="font-medium text-foreground mb-1">Android:</p>
              <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
                <li>Abre <strong>Configuración</strong> de tu teléfono</li>
                <li>Ve a <strong>Apps</strong> → <strong>LabelGuard</strong></li>
                <li>Selecciona <strong>Permisos</strong></li>
                <li>Activa <strong>Cámara</strong> y <strong>Ubicación</strong></li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Note */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Nota:</strong> El permiso de ubicación es opcional. La app funcionará correctamente sin él, 
            solo que no se guardará dónde compraste cada producto en tu historial.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
