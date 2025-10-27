import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryService, ScanHistoryItem } from '@/services/historyService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Map as MapIcon, Filter, Settings2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export const ProductMap = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  
  // Filtros
  const [compatibilityFilter, setCompatibilityFilter] = useState<'all' | 'compatible' | 'incompatible'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '90'>('all');

  const [viewport, setViewport] = useState({
    latitude: 40.4168,
    longitude: -3.7038,
    zoom: 6,
  });

  useEffect(() => {
    // Intentar cargar token de localStorage
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      loadScans();
    } else {
      setShowTokenInput(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scans, compatibilityFilter, minScore, dateFilter]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (dateFilter !== 'all') {
        filters.days = Number(dateFilter);
      }
      const data = await HistoryService.getScansWithLocation(filters);
      setScans(data);
      
      // Centrar mapa en el primer escaneo
      if (data.length > 0) {
        setViewport(prev => ({
          ...prev,
          latitude: data[0].latitude!,
          longitude: data[0].longitude!,
          zoom: 10,
        }));
      }
    } catch (error) {
      console.error('Error loading scans:', error);
      toast({
        title: 'Error al cargar escaneos',
        description: 'No se pudieron cargar los datos del mapa',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...scans];

    if (compatibilityFilter === 'compatible') {
      filtered = filtered.filter(s => s.is_compatible);
    } else if (compatibilityFilter === 'incompatible') {
      filtered = filtered.filter(s => !s.is_compatible);
    }

    if (minScore > 0) {
      filtered = filtered.filter(s => s.score >= minScore);
    }

    setFilteredScans(filtered);
  };

  const handleSaveToken = () => {
    if (!mapboxToken.trim()) {
      toast({
        title: 'Token requerido',
        description: 'Por favor ingresa tu token de Mapbox',
        variant: 'destructive',
      });
      return;
    }
    localStorage.setItem('mapbox_token', mapboxToken);
    setShowTokenInput(false);
    loadScans();
  };

  const handleViewDetails = (scan: ScanHistoryItem) => {
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
        fromMap: true
      }
    });
  };

  const getMarkerColor = (score: number) => {
    if (score >= 70) return '#22c55e'; // green
    if (score >= 50) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  if (showTokenInput) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <MapIcon className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold">Configurar Mapbox</h2>
                <p className="text-sm text-muted-foreground">
                  Necesitas un token de Mapbox para usar el mapa
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Token de Mapbox</Label>
              <input
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1IjoiZXhhbXBsZS..."
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground">
                Obtén tu token gratuito en{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveToken} className="flex-1">
                Guardar y Continuar
              </Button>
              <Button variant="outline" onClick={() => navigate('/scanner')}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="container max-w-6xl mx-auto px-4 py-6">Cargando mapa...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/scanner')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                Mapa de Productos
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredScans.length} productos con ubicación
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTokenInput(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar con filtros */}
        <div className="w-80 border-r p-4 overflow-y-auto bg-background">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h2 className="font-semibold">Filtros</h2>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Compatibilidad</Label>
              <Tabs value={compatibilityFilter} onValueChange={(value: any) => setCompatibilityFilter(value)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="compatible">✓</TabsTrigger>
                  <TabsTrigger value="incompatible">✗</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Score Mínimo: {minScore}</Label>
              <Slider
                value={[minScore]}
                onValueChange={(values) => setMinScore(values[0])}
                max={100}
                step={10}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Período</Label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de productos */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Productos ({filteredScans.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredScans.map((scan) => (
                  <Card
                    key={scan.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setViewport(prev => ({
                        ...prev,
                        latitude: scan.latitude!,
                        longitude: scan.longitude!,
                        zoom: 14,
                      }));
                      setSelectedScan(scan);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getMarkerColor(scan.score) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{scan.product_name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {scan.score}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          {mapboxToken && (
            <Map
              {...viewport}
              onMove={(evt) => setViewport(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={mapboxToken}
            >
              <NavigationControl position="top-right" />

              {filteredScans.map((scan) => (
                <Marker
                  key={scan.id}
                  latitude={scan.latitude!}
                  longitude={scan.longitude!}
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedScan(scan);
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white cursor-pointer shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: getMarkerColor(scan.score) }}
                  />
                </Marker>
              ))}

              {selectedScan && (
                <Popup
                  latitude={selectedScan.latitude!}
                  longitude={selectedScan.longitude!}
                  onClose={() => setSelectedScan(null)}
                  closeButton={true}
                  closeOnClick={false}
                  anchor="bottom"
                >
                  <div className="p-2 min-w-[200px]">
                    {selectedScan.image_url && (
                      <img
                        src={selectedScan.image_url}
                        alt={selectedScan.product_name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">{selectedScan.product_name}</h3>
                    {selectedScan.brands && (
                      <p className="text-xs text-muted-foreground mb-2">{selectedScan.brands}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={selectedScan.is_compatible ? 'default' : 'destructive'} className="text-xs">
                        {selectedScan.is_compatible ? '✓ Apto' : '✗ No apto'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedScan.score}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewDetails(selectedScan)}
                    >
                      Ver detalles
                    </Button>
                  </div>
                </Popup>
              )}
            </Map>
          )}
        </div>
      </div>
    </div>
  );
};
