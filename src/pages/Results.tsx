import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Info, Star, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ProductInfo, AnalysisResult, Profile, SeverityLevel } from '@/types/restrictions';
import { SEVERITY_LEVELS } from '@/types/restrictions';
import { AnalysisService } from '@/services/analysisService';
import { ProfileService } from '@/services/profileService';
import { HistoryService } from '@/services/historyService';
import { FavoritesService } from '@/services/favoritesService';
import { GeolocationService } from '@/services/geolocationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

// Helper para obtener color de fondo y texto del Nutriscore
const getNutriscoreColor = (grade: string): { bg: string; text: string; border: string } => {
  const upperGrade = grade.toUpperCase();
  switch (upperGrade) {
    case 'A':
      return { bg: '#038141', text: 'white', border: '#026835' };
    case 'B':
      return { bg: '#85BB2F', text: 'white', border: '#6FA022' };
    case 'C':
      return { bg: '#FECB02', text: '#1a1a1a', border: '#E5B602' };
    case 'D':
      return { bg: '#EE8100', text: 'white', border: '#D67300' };
    case 'E':
      return { bg: '#E63E11', text: 'white', border: '#CE360F' };
    default:
      return { bg: 'hsl(var(--muted))', text: 'hsl(var(--foreground))', border: 'hsl(var(--border))' };
  }
};

export const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scanHistoryId, setScanHistoryId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);

  const product = location.state?.product as ProductInfo;

  useEffect(() => {
    const loadData = async () => {
      if (!product) {
        navigate('/scanner');
        return;
      }

      const profiles = await ProfileService.getActiveProfiles();
      if (profiles.length === 0) {
        navigate('/profile');
        return;
      }
      
      setActiveProfiles(profiles);

      const performAnalysis = async () => {
        try {
          // Solo reutilizar análisis si viene de historial/favoritos (vista previa)
          // SIEMPRE hacer análisis nuevo para escaneos frescos (cache, OpenFoodFacts, IA)
          const result = (location.state?.fromHistory || location.state?.fromFavorites) 
            ? location.state?.analysis
            : await AnalysisService.analyzeProductForActiveProfiles(product);
          
          // Logging para debugging
          console.log('[Results] Analysis source:', {
            fromCache: location.state?.fromCache,
            fromHistory: location.state?.fromHistory,
            fromFavorites: location.state?.fromFavorites,
            hadPreAnalysis: !!location.state?.analysis,
            didNewAnalysis: !location.state?.fromHistory && !location.state?.fromFavorites,
            activeProfiles: profiles.length,
            result: { isCompatible: result.isCompatible, score: result.score, violations: result.violations.length }
          });
          
          setAnalysis(result);

          // Save to history if premium and not from history
          if (isPremium && !location.state?.fromHistory && !location.state?.fromFavorites) {
            // Intentar capturar ubicación silenciosamente
            const locationResult = await GeolocationService.getCurrentLocation();
            
            // Log para debugging (sin toast, para no molestar al usuario)
            if (!locationResult.success) {
              console.warn('[Results] Ubicación no capturada:', locationResult.error);
            } else {
              console.log('[Results] Ubicación capturada:', locationResult.location);
            }
            
            const historyId = await HistoryService.saveToHistory(
              product,
              result,
              location.state?.analysisType || 'barcode',
              location.state?.photoUrls,
              locationResult.location || null
            );
            if (historyId) {
              setScanHistoryId(historyId);
              const fav = await FavoritesService.isFavorite(historyId);
              setIsFavorite(fav);
            }
          }
        } catch (error: any) {
          console.error('Error analyzing product:', error);
          navigate('/profile');
        }
      };

      performAnalysis();
    };
    
    loadData();
  }, [product, navigate, isPremium, location.state]);

  const handleToggleFavorite = async () => {
    if (!scanHistoryId) return;
    
    if (isFavorite) {
      await FavoritesService.removeFromFavorites(scanHistoryId);
      setIsFavorite(false);
      toast({ title: "Eliminado de favoritos" });
    } else {
      await FavoritesService.addToFavorites(scanHistoryId);
      setIsFavorite(true);
      toast({ title: "Agregado a favoritos ⭐" });
    }
  };

  if (!product || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analizando producto...</p>
        </div>
      </div>
    );
  }

  const getResultIcon = () => {
    if (analysis.isCompatible) {
      return <CheckCircle className="w-8 h-8 text-success" />;
    } else {
      return <XCircle className="w-8 h-8 text-destructive" />;
    }
  };

  const getResultColor = () => {
    if (analysis.isCompatible) {
      return 'from-success/20 to-success/10 border-success/30';
    } else {
      return 'from-destructive/20 to-destructive/10 border-destructive/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityLevelBadge = (severityLevel?: SeverityLevel) => {
    if (!severityLevel) return null;
    
    const info = SEVERITY_LEVELS[severityLevel];
    let colorClass = '';
    
    switch (severityLevel) {
      case 'severo':
        colorClass = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300';
        break;
      case 'moderado':
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300';
        break;
      case 'leve':
        colorClass = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300';
        break;
    }
    
    return (
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        {info.icon} {info.label}
      </Badge>
    );
  };

  const backDestination = location.state?.fromHistory 
    ? '/history' 
    : location.state?.fromFavorites 
      ? '/favorites' 
      : '/scanner';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backDestination)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Análisis del Producto</h1>
        </div>

        {/* CRITICAL: Legal Disclaimer - MUST BE FIRST */}
        <LegalDisclaimer variant="results" compact={false} />

        {/* Cache invalidated badge */}
        {location.state?.cacheInvalidated && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 justify-center">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ♻️ Re-analizado con perfiles actualizados
              </p>
            </div>
          </Card>
        )}

        {/* Active profiles info */}
        <Card className="p-3 bg-muted/30 border-border">
          <p className="text-sm text-center text-muted-foreground">
            Analizando para <span className="font-semibold text-foreground">
              {activeProfiles.length} perfil{activeProfiles.length > 1 ? 'es' : ''}
            </span>
          </p>
        </Card>

        {/* Product Info */}
        <Card className="p-4 shadow-sm border">
          {product.image_url && (
            <div className="w-20 h-20 mx-auto mb-4 rounded-lg overflow-hidden bg-muted">
              <img 
                src={product.image_url} 
                alt={product.product_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          
          <h2 className="font-semibold text-foreground text-center mb-2">
            {product.product_name}
          </h2>
          
          {product.brands && (
            <p className="text-sm text-muted-foreground text-center mb-1">
              {product.brands}
            </p>
          )}

          {product.code && (
            <p className="text-xs text-muted-foreground text-center mb-2 font-mono">
              Código: {product.code}
            </p>
          )}

          <div className="flex justify-center gap-2 flex-wrap">
            {/* Nutriscore con color y popover */}
            {product.nutriscore_grade && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: getNutriscoreColor(product.nutriscore_grade).bg,
                      color: getNutriscoreColor(product.nutriscore_grade).text,
                      borderColor: getNutriscoreColor(product.nutriscore_grade).border,
                    }}
                  >
                    Nutri-Score: {product.nutriscore_grade.toUpperCase()}
                    <HelpCircle className="w-3 h-3 ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">¿Qué es Nutri-Score?</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema de etiquetado nutricional que clasifica los alimentos de la A (mejor calidad nutricional) a la E (peor calidad).
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: '#038141' }}></span>
                        <span><strong>A</strong> - Excelente calidad nutricional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: '#85BB2F' }}></span>
                        <span><strong>B</strong> - Buena calidad nutricional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: '#FECB02' }}></span>
                        <span><strong>C</strong> - Calidad nutricional aceptable</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: '#EE8100' }}></span>
                        <span><strong>D</strong> - Baja calidad nutricional</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-6 h-6 rounded" style={{ backgroundColor: '#E63E11' }}></span>
                        <span><strong>E</strong> - Muy baja calidad nutricional</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* NOVA con popover explicativo (sin colores) */}
            {product.nova_group && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-accent">
                    NOVA: {product.nova_group}
                    <HelpCircle className="w-3 h-3 ml-0.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">¿Qué es NOVA?</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema de clasificación que agrupa los alimentos según su grado de procesamiento industrial.
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <strong>Grupo 1:</strong> Alimentos sin procesar o mínimamente procesados (frutas, verduras, legumbres, carnes frescas)
                      </div>
                      <div>
                        <strong>Grupo 2:</strong> Ingredientes culinarios procesados (aceites, mantequilla, azúcar, sal)
                      </div>
                      <div>
                        <strong>Grupo 3:</strong> Alimentos procesados (conservas, quesos, panes artesanales)
                      </div>
                      <div>
                        <strong>Grupo 4:</strong> Alimentos ultraprocesados (snacks, refrescos, comidas preparadas)
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </Card>

        {/* Analysis Result */}
        <Card className={`p-6 shadow-sm border-2 ${
          analysis.isCompatible 
            ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
            : 'border-red-200 bg-red-50 dark:bg-red-950/20'
        }`}>
          <div className="text-center">
            <div className="mb-4">{getResultIcon()}</div>
            
            <h2 className="text-xl font-bold text-foreground mb-2">
              {analysis.isCompatible ? '✅ PRODUCTO APTO' : '❌ PRODUCTO NO APTO'}
            </h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Puntuación de Compatibilidad</span>
                <span className={`text-sm font-bold ${AnalysisService.getScoreColor(analysis.score)}`}>
                  {analysis.score}/100
                </span>
              </div>
              <Progress value={analysis.score} className="mb-2" />
              <p className={`text-sm font-medium ${AnalysisService.getScoreColor(analysis.score)}`}>
                {AnalysisService.getScoreLabel(analysis.score)}
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {analysis.isCompatible 
                ? 'Este producto cumple con todas las restricciones de tus perfiles activos'
                : 'Este producto contiene ingredientes que no son compatibles con tus perfiles activos'
              }
            </p>
          </div>
        </Card>

        {/* Disclaimer de verificación manual */}
        <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Verifica todos los lados del empaque
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Este análisis se basa en las fotos proporcionadas. Por tu seguridad, revisa físicamente todo el empaque para detectar advertencias adicionales.
              </p>
            </div>
          </div>
        </Card>

        {/* Violations */}
        {analysis.violations.length > 0 && (
          <Card className="p-4 shadow-sm border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Restricciones Violadas
            </h3>
            
            <div className="space-y-3">
              {analysis.violations.map((violation, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-foreground flex-1">{violation.restriction}</h4>
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {/* Mostrar nivel de severidad real del perfil */}
                      {getSeverityLevelBadge(violation.severityLevel)}
                      {/* Mantener severidad de categoría para contexto */}
                      <Badge className={`text-xs ${getSeverityColor(violation.severity)}`}>
                        {violation.severity === 'high' ? 'Alto' : 
                         violation.severity === 'medium' ? 'Medio' : 'Bajo'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{violation.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Warnings */}
        {analysis.warnings.length > 0 && (
          <Card className="p-4 shadow-sm border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-warning" />
              Advertencias Adicionales
            </h3>
            
            <div className="space-y-2">
              {analysis.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-2 rounded bg-warning/10">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">{warning}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Ingredients */}
        {product.ingredients_text && (
          <Card className="p-4 shadow-sm border">
            <h3 className="font-semibold text-foreground mb-3">Ingredientes</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.ingredients_text}
            </p>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isPremium && scanHistoryId && (
            <Button onClick={handleToggleFavorite} variant="outline" className="w-full">
              <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/scanner')}
              className="w-full"
            >
              Escanear Otro
            </Button>
            <Button 
              onClick={() => navigate('/profile')}
              className="w-full"
            >
              Ver Perfiles
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
