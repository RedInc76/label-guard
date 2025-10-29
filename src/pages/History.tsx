import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryService, ScanHistoryItem } from '@/services/historyService';
import { FavoritesService } from '@/services/favoritesService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Star, Trash2, Camera, Barcode, MapPin, Filter, BarChart3, Map, Scale, HelpCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { GeolocationService } from '@/services/geolocationService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

export const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [compatibilityFilter, setCompatibilityFilter] = useState<'all' | 'compatible' | 'incompatible'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'barcode' | 'ai_photo'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await HistoryService.getHistory();
    setHistory(data);
    
    // Load favorites
    const favs = await FavoritesService.getFavorites();
    const favSet = new Set(favs.map(f => f.scan_history_id));
    setFavorites(favSet);
    
    setLoading(false);
  };

  const handleToggleFavorite = async (item: ScanHistoryItem) => {
    const isFav = favorites.has(item.id);
    
    if (isFav) {
      await FavoritesService.removeFromFavorites(item.id);
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      toast({
        title: "Eliminado de favoritos",
      });
    } else {
      await FavoritesService.addToFavorites(item.id);
      setFavorites(prev => new Set(prev).add(item.id));
      toast({
        title: "Agregado a favoritos ⭐",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await HistoryService.deleteHistoryItem(id);
    if (success) {
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Eliminado del historial",
      });
    }
  };

  const handleOpenLocation = (item: ScanHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!item.latitude || !item.longitude) {
      toast({
        title: "Ubicación no disponible",
        description: "Este escaneo no tiene datos de ubicación",
        variant: "destructive",
      });
      return;
    }
    
    GeolocationService.openInMaps(
      item.latitude,
      item.longitude,
      item.product_name
    );
  };

  const handleViewDetails = (item: ScanHistoryItem) => {
    const product = {
      code: item.barcode || '',
      product_name: item.product_name,
      brands: item.brands || '',
      ingredients_text: item.ingredients_text || '',
      allergens: item.allergens || '',
      image_url: item.image_url || undefined,
      nutriscore_grade: item.nutriscore_grade,
      nova_group: item.nova_group,
      ecoscore_grade: item.ecoscore_grade,
    };

    const analysis = {
      isCompatible: item.is_compatible,
      score: item.score,
      violations: Array.isArray(item.violations) ? item.violations : [],
      warnings: Array.isArray(item.warnings) ? item.warnings : [],
    };

    navigate('/results', {
      state: {
        product,
        analysis,
        analysisType: item.analysis_type,
        photoUrls: item.front_photo_url && item.back_photo_url 
          ? { front: item.front_photo_url, back: item.back_photo_url }
          : undefined,
        fromHistory: true
      }
    });
  };

  const getFilteredHistory = () => {
    let filtered = [...history];
    
    // Filtro de compatibilidad
    if (compatibilityFilter === 'compatible') {
      filtered = filtered.filter(item => item.is_compatible);
    } else if (compatibilityFilter === 'incompatible') {
      filtered = filtered.filter(item => !item.is_compatible);
    }
    
    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.analysis_type === typeFilter);
    }
    
    // Filtro de fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = dateFilter === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= cutoffDate
      );
    }
    
    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  if (loading) {
    return <div className="container max-w-4xl mx-auto px-4 py-6">Cargando...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/scanner')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historial de Escaneos</h1>
            <p className="text-sm text-muted-foreground">
              {filteredHistory.length} de {history.length} producto{history.length !== 1 ? 's' : ''}
              {filteredHistory.length !== history.length && ' (filtrados)'}
            </p>
          </div>
        </div>

        {compareMode ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCompareMode(false);
                setSelectedForCompare(new Set());
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={selectedForCompare.size < 2 || selectedForCompare.size > 3}
              onClick={() => {
                navigate('/compare', {
                  state: { productIds: Array.from(selectedForCompare) }
                });
              }}
            >
              Comparar ({selectedForCompare.size})
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/insights')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Insights
            </Button>
            <Button variant="outline" onClick={() => navigate('/map')}>
              <Map className="mr-2 h-4 w-4" />
              Mapa
            </Button>
            <Button variant="outline" onClick={() => setCompareMode(true)}>
              <Scale className="mr-2 h-4 w-4" />
              Comparar
            </Button>
          </div>
        )}
      </div>

      {/* Sección de filtros */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h2 className="font-semibold">Filtros</h2>
          </div>
          
          <div>
            <Label className="text-sm mb-2 block">Compatibilidad</Label>
            <Tabs value={compatibilityFilter} onValueChange={(value: any) => setCompatibilityFilter(value)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="compatible">✓ Aptos</TabsTrigger>
                <TabsTrigger value="incompatible">✗ No Aptos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Tipo</Label>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="barcode">🔍 Escaneo</SelectItem>
                  <SelectItem value="ai_photo">📸 IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm mb-2 block">Fecha</Label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7days">Últimos 7 días</SelectItem>
                  <SelectItem value="30days">Últimos 30 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredHistory.length} de {history.length} productos
            </p>
            {(compatibilityFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCompatibilityFilter('all');
                  setTypeFilter('all');
                  setDateFilter('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {filteredHistory.length === 0 && history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              No hay escaneos en tu historial
            </p>
            <Button
              onClick={() => navigate('/scanner')}
              className="mt-4"
            >
              Escanear producto
            </Button>
          </CardContent>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-2">
              No se encontraron productos con los filtros seleccionados
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setCompatibilityFilter('all');
                setTypeFilter('all');
                setDateFilter('all');
              }}
              className="mt-4"
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewDetails(item)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {compareMode && (
                    <div className="flex items-center mr-2">
                      <Checkbox
                        checked={selectedForCompare.has(item.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedForCompare);
                          if (checked && selectedForCompare.size < 3) {
                            newSet.add(item.id);
                          } else {
                            newSet.delete(item.id);
                          }
                          setSelectedForCompare(newSet);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {item.image_url || item.front_photo_url ? (
                      <img
                        src={item.image_url || item.front_photo_url || ''}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', item.image_url || item.front_photo_url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold truncate">
                          {item.product_name}
                        </h3>
                        {item.brands && (
                          <p className="text-sm text-muted-foreground truncate">
                            {item.brands}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            favorites.has(item.id)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={item.is_compatible ? 'default' : 'destructive'}>
                        {item.is_compatible ? '✓ Compatible' : '✗ No compatible'}
                      </Badge>
                      <Badge variant="outline">
                        Score: {item.score}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {item.analysis_type === 'ai_photo' ? (
                          <>
                            <Camera className="h-3 w-3" />
                            IA
                          </>
                        ) : item.analysis_type === 'ai_cache' ? (
                          <>
                            💾 Cache IA
                          </>
                        ) : (
                          <>
                            <Barcode className="h-3 w-3" />
                            Escaneo
                          </>
                        )}
                      </Badge>
                      
                      {/* Nutriscore con color y popover */}
                      {item.nutriscore_grade && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80"
                              style={{
                                backgroundColor: getNutriscoreColor(item.nutriscore_grade).bg,
                                color: getNutriscoreColor(item.nutriscore_grade).text,
                                borderColor: getNutriscoreColor(item.nutriscore_grade).border,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Nutri: {item.nutriscore_grade.toUpperCase()}
                              <HelpCircle className="w-3 h-3 ml-0.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
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
                      {item.nova_group && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button 
                              className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              NOVA: {item.nova_group}
                              <HelpCircle className="w-3 h-3 ml-0.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                        </p>
                        
                        {/* Botón de ubicación */}
                          {item.latitude && item.longitude && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              title="Ver ubicación en mapa"
                              className="h-7 w-7 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Ver ubicación en Google Maps"
                              >
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </a>
                            </Button>
                          )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
