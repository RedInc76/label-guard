import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera as CameraService } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PhotoAnalysisService } from '@/services/photoAnalysisService';
import { AnalysisService } from '@/services/analysisService';
import { ProductInfo } from '@/types/restrictions';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

type Step = 'front' | 'validate' | 'back' | 'analyzing';

export const PhotoAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('front');
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);

  const takeFrontPhoto = async () => {
    try {
      setLoading(true);
      const image = await CameraService.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setFrontPhoto(image.dataUrl);
        
        // Analyze front photo with AI
        const name = await PhotoAnalysisService.analyzeFrontPhoto(image.dataUrl);
        setProductName(name);
        setStep('validate');
      }
    } catch (error: any) {
      console.error('Error taking front photo:', error);
      toast({
        title: "Error",
        description: "No se pudo tomar la foto. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmName = () => {
    if (!productName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa el nombre del producto",
        variant: "destructive",
      });
      return;
    }
    setStep('back');
  };

  const takeBackPhoto = async () => {
    try {
      setLoading(true);
      const image = await CameraService.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setBackPhoto(image.dataUrl);
        setStep('analyzing');
        
        // Analyze back photo with AI
        const analysis = await PhotoAnalysisService.analyzeBackPhoto(image.dataUrl);
        
        // Upload photos to storage
        const frontBlob = await fetch(frontPhoto).then(r => r.blob());
        const backBlob = await fetch(image.dataUrl).then(r => r.blob());
        
        const frontUrl = await PhotoAnalysisService.uploadPhoto(frontBlob, 'front');
        const backUrl = await PhotoAnalysisService.uploadPhoto(backBlob, 'back');
        
        // Obtener barcode del state si viene del Scanner
        const barcode = (location.state as any)?.barcode || '';
        
        // Create product info from AI analysis
        const product: ProductInfo = {
          code: barcode,
          product_name: productName,
          brands: '',
          ingredients_text: analysis.ingredients,
          allergens: analysis.allergens,
          image_url: frontUrl,
        };

        // Guardar en cache ANTES de analizar si tiene barcode
        if (barcode) {
          const { AIProductCacheService } = await import('@/services/aiProductCacheService');
          await AIProductCacheService.saveAnalyzedProduct(
            product,
            { front: frontUrl, back: backUrl },
            barcode
          );
          console.log('✅ Producto guardado en cache para futuras búsquedas');
        }
        
        // Track AI analysis
        const { UsageAnalyticsService } = await import('@/services/usageAnalyticsService');
        await UsageAnalyticsService.trackAIAnalysis(productName, barcode || undefined);
        
        // Log successful photo scan
        const { loggingService } = await import('@/services/loggingService');
        loggingService.logScan('photo', productName, barcode || undefined);
        
        // Analyze product against restrictions
        const result = await AnalysisService.analyzeProductForActiveProfiles(product);
        
        // Navigate to results
        navigate('/results', {
          state: {
            product,
            analysis: result,
            analysisType: 'ai_photo',
            photoUrls: { front: frontUrl, back: backUrl }
          }
        });
      }
    } catch (error: any) {
      console.error('Error in photo analysis:', error);
      toast({
        title: "Error en el análisis",
        description: error.message || "No se pudo analizar el producto",
        variant: "destructive",
      });
      setStep('back');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/scanner')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Análisis por Foto</h1>
          <p className="text-sm text-muted-foreground">
            Analiza productos con inteligencia artificial
          </p>
        </div>
      </div>

      {/* AI Disclaimer */}
      <LegalDisclaimer variant="photo-analysis" compact={false} />

      {step === 'front' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Foto del Frente</CardTitle>
            <CardDescription>
              Toma una foto clara del frente del producto para identificar su nombre
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={takeFrontPhoto}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Tomar Foto del Frente
                </>
              )}
            </Button>
            {frontPhoto && (
              <img 
                src={frontPhoto} 
                alt="Frente del producto" 
                className="w-full rounded-lg border"
              />
            )}
          </CardContent>
        </Card>
      )}

      {step === 'validate' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Confirma el Nombre</CardTitle>
            <CardDescription>
              La IA detectó este nombre. Corrígelo si es necesario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {frontPhoto && (
              <img 
                src={frontPhoto} 
                alt="Frente del producto" 
                className="w-full rounded-lg border mb-4"
              />
            )}
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre del Producto</Label>
              <Input
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>
            <Button onClick={confirmName} className="w-full" size="lg">
              <Check className="mr-2 h-5 w-5" />
              Confirmar y Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'back' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Foto de Ingredientes</CardTitle>
            <CardDescription>
              Ahora toma una foto de la parte trasera donde están los ingredientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={takeBackPhoto}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Tomar Foto de Ingredientes
                </>
              )}
            </Button>
            {backPhoto && (
              <img 
                src={backPhoto} 
                alt="Ingredientes" 
                className="w-full rounded-lg border"
              />
            )}
          </CardContent>
        </Card>
      )}

      {step === 'analyzing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Analizando ingredientes con IA...
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Esto puede tomar unos segundos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
