import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ProductInfo, AnalysisResult, Profile } from '@/types/restrictions';
import { AnalysisService } from '@/services/analysisService';
import { ProfileService } from '@/services/profileService';
import { HistoryService } from '@/services/historyService';
import { FavoritesService } from '@/services/favoritesService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';

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
          const result = location.state?.analysis || await AnalysisService.analyzeProductForActiveProfiles(product);
          setAnalysis(result);

          // Save to history if premium and not from history
          if (isPremium && !location.state?.fromHistory && !location.state?.fromFavorites) {
            const historyId = await HistoryService.saveToHistory(
              product,
              result,
              location.state?.analysisType || 'barcode',
              location.state?.photoUrls
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/scanner')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Análisis del Producto</h1>
        </div>

        {/* CRITICAL: Legal Disclaimer - MUST BE FIRST */}
        <LegalDisclaimer variant="results" compact={false} />

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
            <p className="text-sm text-muted-foreground text-center mb-2">
              {product.brands}
            </p>
          )}

          <div className="flex justify-center gap-2 flex-wrap">
            {product.nutriscore_grade && (
              <Badge variant="outline" className="text-xs">
                Nutri-Score: {product.nutriscore_grade.toUpperCase()}
              </Badge>
            )}
            {product.nova_group && (
              <Badge variant="outline" className="text-xs">
                NOVA: {product.nova_group}
              </Badge>
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
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-foreground">{violation.restriction}</h4>
                    <Badge className={`text-xs ${getSeverityColor(violation.severity)}`}>
                      {violation.severity === 'high' ? 'Alto' : 
                       violation.severity === 'medium' ? 'Medio' : 'Bajo'}
                    </Badge>
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
