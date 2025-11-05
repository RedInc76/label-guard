import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HistoryService, ScanHistoryItem } from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Camera, Trophy, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const Compare = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const productIds = location.state?.productIds as string[];
    
    if (!productIds || productIds.length < 2) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos 2 productos para comparar',
        variant: 'destructive',
      });
      navigate('/history');
      return;
    }

    try {
      const data = await HistoryService.getMultipleScans(productIds);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error al cargar productos',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="container max-w-6xl mx-auto px-4 py-6">Cargando comparación...</div>;
  }

  if (products.length < 2) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              No se pudieron cargar los productos para comparar
            </p>
            <Button onClick={() => navigate('/history')}>
              Volver al historial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Análisis de diferencias
  const bestScore = products.reduce((best, p) => p.score > best.score ? p : best);
  const worstScore = products.reduce((worst, p) => p.score < worst.score ? p : worst);
  const compatibleProducts = products.filter(p => p.is_compatible);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/history')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Comparador de Productos</h1>
          <p className="text-sm text-muted-foreground">
            Comparando {products.length} productos
          </p>
        </div>
      </div>

      {/* Vista de productos (header con imágenes) */}
      <div className={`grid grid-cols-${Math.min(products.length, 3)} gap-4`}>
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {product.image_url || product.front_photo_url ? (
                    <img
                      src={product.image_url || product.front_photo_url || ''}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm truncate">
                    {product.product_name}
                  </h3>
                  {product.brands && (
                    <p className="text-xs text-muted-foreground truncate">
                      {product.brands}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.is_compatible ? 'default' : 'destructive'}>
                    {product.is_compatible ? '✓' : '✗'}
                  </Badge>
                  <Badge variant="outline">
                    {product.score}
                  </Badge>
                  {product === bestScore && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diferencias destacadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Diferencias Clave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
            <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Mejor Score</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{bestScore.product_name}</span> con {bestScore.score} puntos
              </p>
            </div>
          </div>

          {worstScore !== bestScore && (
            <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Score Más Bajo</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{worstScore.product_name}</span> con {worstScore.score} puntos
                </p>
              </div>
            </div>
          )}

          {compatibleProducts.length > 0 && compatibleProducts.length < products.length && (
            <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Productos Compatibles</p>
                <p className="text-sm text-muted-foreground">
                  {compatibleProducts.map(p => p.product_name).join(', ')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Característica</TableHead>
                  {products.map((product) => (
                    <TableHead key={product.id}>
                      <span className="text-xs truncate block max-w-[150px]">
                        {product.product_name}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Score</TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id}>
                      <Badge 
                        variant={product === bestScore ? 'default' : 'secondary'}
                        className="font-bold"
                      >
                        {product.score}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Compatibilidad</TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id}>
                      <Badge variant={product.is_compatible ? 'default' : 'destructive'}>
                        {product.is_compatible ? '✓ Apto' : '✗ No apto'}
                      </Badge>
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Violaciones</TableCell>
                  {products.map((product) => {
                    const violations = Array.isArray(product.violations) ? product.violations : [];
                    return (
                      <TableCell key={product.id}>
                        {violations.length === 0 ? (
                          <span className="text-green-600 font-medium">Ninguna</span>
                        ) : (
                          <Badge variant="destructive">{violations.length}</Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Advertencias</TableCell>
                  {products.map((product) => {
                    const warnings = Array.isArray(product.warnings) ? product.warnings : [];
                    return (
                      <TableCell key={product.id}>
                        {warnings.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Badge variant="outline">{warnings.length}</Badge>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Tipo de Análisis</TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id} className="text-xs">
                      {product.analysis_type === 'ai_photo' && '📸 IA'}
                      {product.analysis_type === 'ai_cache' && '💾 Cache IA'}
                      {product.analysis_type === 'openfood_api' && '🔍 Escaneo'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Restricciones violadas */}
      <Card>
        <CardHeader>
          <CardTitle>Restricciones Violadas por Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => {
              const violations = Array.isArray(product.violations) ? product.violations : [];
              return (
                <div key={product.id} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-semibold text-sm mb-2">{product.product_name}</h4>
                  {violations.length === 0 ? (
                    <p className="text-sm text-green-600">✓ Sin violaciones</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {violations.map((violation: any, idx: number) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {violation.restriction}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recomendación */}
      {compatibleProducts.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Recomendación</h3>
                <p className="text-sm text-muted-foreground">
                  Basado en tus restricciones, recomendamos:{' '}
                  <span className="font-semibold text-foreground">
                    {bestScore.product_name}
                  </span>
                  {' '}con un score de {bestScore.score}/100 y{' '}
                  {Array.isArray(bestScore.violations) ? bestScore.violations.length : 0} violaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
