import { useState, useEffect } from 'react';
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

type Step = 'front' | 'validate' | 'back' | 'nutrition' | 'analyzing';

export const PhotoAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('front');
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');
  const [nutritionPhoto, setNutritionPhoto] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);

  // Intentar recuperar del caché si viene con barcode
  useEffect(() => {
    const barcode = (location.state as any)?.barcode;
    if (barcode) {
      checkCacheFirst(barcode);
    }
  }, []);

  const checkCacheFirst = async (barcode: string) => {
    try {
      setLoading(true);
      const { AIProductCacheService } = await import('@/services/aiProductCacheService');
      const cachedProduct = await AIProductCacheService.getByBarcode(barcode);
      
      if (cachedProduct) {
        // Verificar si el caché es válido (no hubo cambios de perfil después)
        const isValid = await AIProductCacheService.isCacheValid(
          cachedProduct.created_at || new Date().toISOString()
        );
        
        if (!isValid) {
          console.log('⚠️ Caché invalidado por cambios en perfil, re-analizando contra nuevas restricciones');
          
          // ✅ Incrementar contador de accesos
          await AIProductCacheService.incrementAccessCount(cachedProduct.cache_id);
          
          // ✅ Re-analizar SOLO contra restricciones actuales (sin consumir créditos IA)
          const result = await AnalysisService.analyzeProductForActiveProfiles(cachedProduct);
          
          // ✅ Navegar directo a resultados con datos del cache
          navigate('/results', {
            state: {
              product: cachedProduct,
              analysis: result,
              analysisType: 'ai_photo',
              fromCache: true,
              cacheInvalidated: true // 🆕 Flag para mostrar mensaje diferente
            }
          });
          
          // ✅ Mostrar toast informativo
          toast({
            title: "Perfiles actualizados",
            description: "Producto re-analizado con tus restricciones actuales",
          });
          
          return; // ✅ Salir porque ya navegamos a resultados
        }
        
        console.log('✅ Producto recuperado del caché válido');
        
        // Incrementar contador de accesos
        await AIProductCacheService.incrementAccessCount(cachedProduct.cache_id);
        
        // Analizar contra restricciones actuales del usuario
        const result = await AnalysisService.analyzeProductForActiveProfiles(cachedProduct);
        
        // Navegar directo a resultados
        navigate('/results', {
          state: {
            product: cachedProduct,
            analysis: result,
            analysisType: 'ai_photo',
            fromCache: true
          }
        });
      } else {
        console.log('ℹ️ Producto no encontrado en caché, proceder con análisis AI');
      }
    } catch (error) {
      console.error('Error checking cache:', error);
      // Si falla, continuar con el flujo normal
    } finally {
      setLoading(false);
    }
  };

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
        setStep('nutrition');
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

  const takeNutritionPhoto = async () => {
    try {
      setLoading(true);
      const image = await CameraService.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setNutritionPhoto(image.dataUrl);
        setStep('analyzing');
        
        // Analizar ambas fotos en paralelo
        const [backAnalysis, nutritionAnalysis] = await Promise.all([
          PhotoAnalysisService.analyzeBackPhoto(backPhoto),
          PhotoAnalysisService.analyzeNutritionPhoto(image.dataUrl)
        ]);
        
        // Upload las 3 fotos a storage
        const [frontBlob, backBlob, nutritionBlob] = await Promise.all([
          fetch(frontPhoto).then(r => r.blob()),
          fetch(backPhoto).then(r => r.blob()),
          fetch(image.dataUrl).then(r => r.blob())
        ]);
        
        const [frontUrl, backUrl, nutritionUrl] = await Promise.all([
          PhotoAnalysisService.uploadPhoto(frontBlob, 'front'),
          PhotoAnalysisService.uploadPhoto(backBlob, 'back'),
          PhotoAnalysisService.uploadPhoto(nutritionBlob, 'nutrition')
        ]);
        
        const barcode = (location.state as any)?.barcode || '';
        
        // Crear ProductInfo con nutrientes
        const product: ProductInfo = {
          code: barcode,
          product_name: productName,
          brands: '',
          ingredients_text: backAnalysis.ingredients,
          allergens: [backAnalysis.allergens, ...backAnalysis.warnings]
            .filter(Boolean)
            .join('. '),
          image_url: frontUrl,
          nutriments: {
            energy_100g: nutritionAnalysis.energy_kj,
            proteins_100g: nutritionAnalysis.proteins,
            carbohydrates_100g: nutritionAnalysis.carbohydrates,
            sugars_100g: nutritionAnalysis.sugars,
            fat_100g: nutritionAnalysis.fats,
            'saturated-fat_100g': nutritionAnalysis.saturated_fats,
            fiber_100g: nutritionAnalysis.fiber,
            sodium_100g: nutritionAnalysis.sodium
          }
        };

        // Guardar en cache con las 3 URLs
        if (barcode) {
          const { AIProductCacheService } = await import('@/services/aiProductCacheService');
          await AIProductCacheService.saveAnalyzedProduct(
            product,
            { front: frontUrl, back: backUrl, nutrition: nutritionUrl },
            barcode
          );
          console.log('✅ Producto guardado en cache con 3 fotos');
        }
        
        // Track y log
        const { UsageAnalyticsService } = await import('@/services/usageAnalyticsService');
        await UsageAnalyticsService.trackAIAnalysis(productName, barcode || undefined);
        
        const { loggingService } = await import('@/services/loggingService');
        loggingService.logScan('ai_photo', productName, barcode || undefined);
        
        // Analizar restricciones
        const result = await AnalysisService.analyzeProductForActiveProfiles(product);
        
        // Navegar a resultados
        navigate('/results', {
          state: {
            product,
            analysis: result,
            analysisType: 'ai_photo',
            photoUrls: { front: frontUrl, back: backUrl, nutrition: nutritionUrl }
          }
        });
      }
    } catch (error: any) {
      console.error('Error in nutrition photo analysis:', error);
      toast({
        title: "Error en el análisis nutricional",
        description: error.message || "No se pudo analizar la tabla nutricional",
        variant: "destructive",
      });
      setStep('nutrition');
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
              Toma una foto clara de la lista de ingredientes Y cualquier advertencia o precaución (ej: "puede contener", "trazas de", etc.)
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
                  Capturando...
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

      {step === 'nutrition' && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 4: Tabla Nutricional</CardTitle>
            <CardDescription>
              Toma una foto clara de la tabla de información nutricional. 
              Asegúrate de que se vean bien los valores por 100g.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                📊 ¿Qué buscamos?
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Energía (kJ o kcal)</li>
                <li>• Proteínas, carbohidratos, azúcares</li>
                <li>• Grasas totales y saturadas</li>
                <li>• Fibra y sodio/sal</li>
              </ul>
            </div>
            
            <Button
              onClick={takeNutritionPhoto}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Capturando...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Tomar Foto de Tabla Nutricional
                </>
              )}
            </Button>
            
            {nutritionPhoto && (
              <img 
                src={nutritionPhoto} 
                alt="Tabla nutricional" 
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
              Analizando producto completo con IA...
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Procesando ingredientes y tabla nutricional. Esto puede tomar unos segundos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
