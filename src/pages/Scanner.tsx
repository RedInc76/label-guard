import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Keyboard, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CameraService } from '@/services/cameraService';
import { OpenFoodFactsService } from '@/services/openFoodFactsService';
import { ProfileService } from '@/services/profileService';
import { ActiveProfilesBadge } from '@/components/ActiveProfilesBadge';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import type { ProductInfo, Profile } from '@/types/restrictions';
import { Capacitor } from '@capacitor/core';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

export const Scanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPremium } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<string>('');
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const loadActiveProfiles = async () => {
      const profiles = await ProfileService.getActiveProfiles();
      setActiveProfiles(profiles);
    };
    loadActiveProfiles();
  }, []);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      
      // Solo verificar si tenemos permisos (ya fueron solicitados en el onboarding)
      const hasPermission = await CameraService.checkPermissions();
      
      if (!hasPermission) {
        toast({
          title: "Permiso de cámara requerido",
          description: "Ve a Configuración → Permisos para habilitar la cámara",
          variant: "destructive",
          action: (
            <Button 
              size="sm" 
              onClick={() => navigate('/permissions')}
              variant="outline"
            >
              Ir a Permisos
            </Button>
          ),
        });
        return;
      }

      // Escanear código de barras (ahora es real con ML Kit!)
      const barcode = await CameraService.scanBarcode((progress) => {
        setIsInstalling(true);
        
        if (progress.state === 'DOWNLOADING') {
          setInstallProgress(`Descargando módulo... ${progress.progress || 0}%`);
        } else if (progress.state === 'INSTALLING') {
          setInstallProgress('Instalando módulo...');
        } else if (progress.state === 'COMPLETED') {
          setInstallProgress('Instalación completada');
          setIsInstalling(false);
        }
      });
      
      if (barcode) {
        await searchProduct(barcode);
      } else {
        toast({
          title: "No se detectó código",
          description: "Intenta de nuevo con mejor iluminación",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scanning:', error);
      
      // Mensaje de error más específico
      let errorMessage = "Error al escanear";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error al escanear",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setIsInstalling(false);
      setInstallProgress('');
    }
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Ingresa un código de barras válido",
        variant: "destructive",
      });
      return;
    }

    await searchProduct(manualCode.trim());
  };

  const searchProduct = async (barcode: string) => {
    // Validar que haya perfiles activos
    if (activeProfiles.length === 0) {
      toast({
        title: "Sin perfiles activos",
        description: "Activa al menos un perfil para escanear productos",
        variant: "destructive",
      });
      navigate('/profile');
      return;
    }

    try {
      setIsSearching(true);
      
      // PASO 1: Buscar en OpenFoodFacts API
      const product = await OpenFoodFactsService.getProduct(barcode);
      
      if (product) {
        // Track OpenFoodFacts usage
        const { UsageAnalyticsService } = await import('@/services/usageAnalyticsService');
        await UsageAnalyticsService.trackOpenFoodFacts(product.product_name, barcode);
        
        navigate('/results', { state: { product } });
        return;
      }

      // PASO 2: NO encontrado en OpenFoodFacts → Buscar en cache local
      const { AIProductCacheService } = await import('@/services/aiProductCacheService');
      const cachedProduct = await AIProductCacheService.getByBarcode(barcode);
      
      if (cachedProduct) {
        // Incrementar contador de accesos
        await AIProductCacheService.incrementAccessCount(cachedProduct.cache_id);
        
        // Track cache hit
        const { UsageAnalyticsService } = await import('@/services/usageAnalyticsService');
        await UsageAnalyticsService.trackCacheHit(cachedProduct.product_name, barcode);
        
        toast({
          title: "💾 Producto encontrado en cache",
          description: "Analizado previamente por IA (sin costo adicional)",
        });
        
        navigate('/results', { 
          state: { 
            product: cachedProduct,
            analysisType: 'ai_cache',
            fromCache: true 
          } 
        });
        return;
      }

      // PASO 3: NO encontrado en ningún lado → Análisis por IA
      if (isPremium) {
        toast({
          title: "Producto no encontrado",
          description: "Analizaremos este producto con IA",
        });
        // Pasar el barcode al análisis por foto
        navigate('/photo-analysis', { state: { barcode } });
      } else {
        toast({
          title: "Producto no encontrado",
          description: "Regístrate Premium para analizar productos con IA",
        });
      }
    } catch (error) {
      console.error('Error searching product:', error);
      toast({
        title: "Error de búsqueda",
        description: "No se pudo obtener información del producto",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Escanear Producto</h1>
          <p className="text-muted-foreground">
            Escanea o ingresa el código de barras del producto
          </p>
        </div>

        {/* Legal Disclaimer */}
        <LegalDisclaimer variant="general" compact={true} />

        {/* Upgrade Banner for FREE users */}
        <UpgradeBanner />


        {/* Active Profiles Badge */}
            <ActiveProfilesBadge 
              profiles={activeProfiles}
              onNavigateToProfiles={() => navigate('/profile')}
            />

        {/* Warning if no active profiles */}
        {activeProfiles.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay perfiles activos. Ve a Perfiles y activa al menos uno para poder escanear.
            </AlertDescription>
          </Alert>
        )}

        {/* Scan Button */}
        <Card className="p-6 text-center shadow-sm">
          <div className="mb-4">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
              <Camera className={`w-8 h-8 ${isScanning ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
          
          <Button 
            onClick={handleScan}
            disabled={!Capacitor.isNativePlatform() || isScanning || isSearching || activeProfiles.length === 0}
            size="lg"
            className="w-full mb-4"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {installProgress || 'Instalando módulo...'}
              </>
            ) : isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Escaneando...
              </>
            ) : !Capacitor.isNativePlatform() ? (
              'Escaneo solo disponible en móvil'
            ) : (
              'Escanear Código de Barras'
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Apunta la cámara al código de barras del producto
          </p>
        </Card>

        {/* Manual Input */}
        <Card className="p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Ingreso Manual
          </h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="Ej: 1234567890123"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              disabled={isScanning || isSearching}
            />
            <Button 
              onClick={handleManualSearch}
              disabled={isScanning || isSearching || !manualCode.trim() || activeProfiles.length === 0}
              size="icon"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Test Codes */}
        <Card className="p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Códigos de Prueba</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Prueba con estos productos reales:
          </p>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 hover:border-primary/50 transition-all"
              onClick={() => {
                setManualCode("7501055914821");
                searchProduct("7501055914821");
              }}
              disabled={isScanning || isSearching || activeProfiles.length === 0}
            >
              <div className="flex flex-col w-full">
                <span className="font-mono font-semibold text-primary">7501055914821</span>
                <span className="text-xs text-muted-foreground">Yogurth Alpura Bebible Manzana</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 hover:border-primary/50 transition-all"
              onClick={() => {
                setManualCode("7501055900039");
                searchProduct("7501055900039");
              }}
              disabled={isScanning || isSearching || activeProfiles.length === 0}
            >
              <div className="flex flex-col w-full">
                <span className="font-mono font-semibold text-primary">7501055900039</span>
                <span className="text-xs text-muted-foreground">Leche Ultra Pasteurizada Entera Alpura</span>
              </div>
            </Button>
          </div>
        </Card>

        {/* Help */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-2">💡 Consejos para escanear</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Primera vez:</strong> Acepta la instalación del módulo de Google</li>
            <li>• Asegúrate de tener buena iluminación</li>
            <li>• Mantén el código de barras dentro del marco</li>
            <li>• Espera a que el escáner detecte automáticamente</li>
            <li>• Si no funciona, usa ingreso manual</li>
            {!Capacitor.isNativePlatform() && (
              <li className="text-warning">⚠️ El escaneo solo funciona en dispositivo móvil</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};