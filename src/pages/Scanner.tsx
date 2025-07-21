import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CameraService } from '@/services/cameraService';
import { OpenFoodFactsService } from '@/services/openFoodFactsService';
import { ProductInfo } from '@/types/restrictions';

export const Scanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      
      // Verificar permisos de cámara
      const hasPermission = await CameraService.requestPermissions();
      if (!hasPermission) {
        toast({
          title: "Permisos requeridos",
          description: "Se necesita acceso a la cámara para escanear códigos",
          variant: "destructive",
        });
        return;
      }

      // Escanear código de barras
      const barcode = await CameraService.scanBarcode();
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
      toast({
        title: "Error al escanear",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
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
    try {
      setIsSearching(true);
      
      const product = await OpenFoodFactsService.getProduct(barcode);
      
      if (product) {
        // Navegar a resultados con la información del producto
        navigate('/results', { state: { product } });
      } else {
        toast({
          title: "Producto no encontrado",
          description: "No se encontró información para este código",
          variant: "destructive",
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

  const testCodes = [
    { code: '3017620422003', name: 'Nutella' },
    { code: '8901030835708', name: 'Producto de prueba 1' },
    { code: '7622210992741', name: 'Producto de prueba 2' }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Escanear Producto</h1>
          <p className="text-muted-foreground">
            Escanea o ingresa el código de barras del producto
          </p>
        </div>

        {/* Scan Button */}
        <Card className="p-6 text-center shadow-soft">
          <div className="mb-4">
            <div className="w-24 h-24 mx-auto mb-4 border-2 border-dashed border-accent rounded-lg flex items-center justify-center">
              <Camera className={`w-8 h-8 ${isScanning ? 'animate-pulse text-accent' : 'text-muted-foreground'}`} />
            </div>
          </div>
          
          <Button 
            onClick={handleScan}
            disabled={isScanning || isSearching}
            size="lg"
            className="w-full mb-4 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
          >
            {isScanning ? 'Escaneando...' : 'Escanear Código de Barras'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Apunta la cámara al código de barras del producto
          </p>
        </Card>

        {/* Manual Input */}
        <Card className="p-4 shadow-soft">
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
              disabled={isScanning || isSearching || !manualCode.trim()}
              size="icon"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Test Codes */}
        <Card className="p-4 shadow-soft">
          <h3 className="font-semibold text-foreground mb-3">Códigos de Prueba</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Usa estos códigos para probar la aplicación
          </p>
          
          <div className="space-y-2">
            {testCodes.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-between text-left"
                onClick={() => {
                  setManualCode(item.code);
                  searchProduct(item.code);
                }}
                disabled={isScanning || isSearching}
              >
                <span className="font-mono text-xs">{item.code}</span>
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Help */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-2">💡 Consejos</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Asegúrate de tener buena iluminación</li>
            <li>• Mantén el código de barras centrado</li>
            <li>• Si no funciona el escáner, usa ingreso manual</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};