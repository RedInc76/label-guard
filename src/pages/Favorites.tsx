import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesService } from '@/services/favoritesService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Camera, Barcode, Scale } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

export const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    const data = await FavoritesService.getFavorites();
    setFavorites(data);
    setLoading(false);
  };

  const handleRemoveFavorite = async (scanHistoryId: string) => {
    await FavoritesService.removeFromFavorites(scanHistoryId);
    setFavorites(prev => prev.filter(f => f.scan_history_id !== scanHistoryId));
    toast({
      title: "Eliminado de favoritos",
    });
  };

  const handleViewDetails = (item: any) => {
    const scan = item.scan_history;
    if (!scan) return;

    const product = {
      code: scan.barcode || '',
      product_name: scan.product_name,
      brands: scan.brands || '',
      ingredients_text: scan.ingredients_text || '',
      allergens: scan.allergens || '',
      image_url: scan.image_url || undefined,
    };

    const analysis = {
      isCompatible: scan.is_compatible,
      score: scan.score,
      violations: Array.isArray(scan.violations) ? scan.violations : [],
      warnings: Array.isArray(scan.warnings) ? scan.warnings : [],
    };

    navigate('/results', {
      state: {
        product,
        analysis,
        analysisType: scan.analysis_type,
        photoUrls: scan.front_photo_url && scan.back_photo_url 
          ? { front: scan.front_photo_url, back: scan.back_photo_url }
          : undefined,
        fromFavorites: true,
      }
    });
  };

  if (loading) {
    return <div className="container max-w-4xl mx-auto px-4 py-6">Cargando...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Productos Favoritos</h1>
            <p className="text-sm text-muted-foreground">
              {favorites.length} producto{favorites.length !== 1 ? 's' : ''} favorito{favorites.length !== 1 ? 's' : ''}
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
          <Button variant="outline" onClick={() => setCompareMode(true)}>
            <Scale className="mr-2 h-4 w-4" />
            Comparar
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No tienes productos favoritos aún
            </p>
            <Button
              onClick={() => navigate('/history')}
              className="mt-4"
            >
              Ver historial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favorites.map((item) => {
            const scan = item.scan_history;
            return (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow relative"
                onClick={() => !compareMode && handleViewDetails(item)}
              >
                <CardContent className="p-4">
                  {compareMode && (
                    <div className="absolute top-2 right-2 z-10">
                      <Checkbox
                        checked={selectedForCompare.has(item.scan_history_id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedForCompare);
                          if (checked && selectedForCompare.size < 3) {
                            newSet.add(item.scan_history_id);
                          } else {
                            newSet.delete(item.scan_history_id);
                          }
                          setSelectedForCompare(newSet);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {item.image_url || scan?.front_photo_url ? (
                        <img
                          src={item.image_url || scan?.front_photo_url || ''}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold truncate">
                        {item.product_name}
                      </h3>
                      {item.brands && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.brands}
                        </p>
                      )}
                    </div>

                    {scan && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={scan.is_compatible ? 'default' : 'destructive'} className="text-xs">
                          {scan.is_compatible ? '✓' : '✗'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {scan.score}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          {scan.analysis_type === 'ai_photo' ? (
                            <>
                              <Camera className="h-3 w-3" />
                              IA
                            </>
                          ) : (
                            <>
                              <Barcode className="h-3 w-3" />
                              Código
                            </>
                          )}
                        </Badge>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item.scan_history_id);
                      }}
                      className="w-full"
                    >
                      <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                      Quitar de favoritos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
