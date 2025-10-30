import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/leaflet-custom.css';
import { HistoryService, ScanHistoryItem } from '@/services/historyService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Map as MapIcon, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';


export const ProductMap = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  
  // Filtros
  const [compatibilityFilter, setCompatibilityFilter] = useState<'all' | 'compatible' | 'incompatible'>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '90'>('all');

  const [mapCenter, setMapCenter] = useState<LatLngExpression>([19.4326, -99.1332]); // CDMX por defecto
  const [mapZoom, setMapZoom] = useState<number>(6);

  useEffect(() => {
    loadScans();
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
      if (data.length > 0 && data[0].latitude && data[0].longitude) {
        setMapCenter([data[0].latitude, data[0].longitude]);
        setMapZoom(10);
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

  const createCustomIcon = (color: string): DivIcon => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

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
                      if (scan.latitude && scan.longitude) {
                        setMapCenter([scan.latitude, scan.longitude]);
                        setMapZoom(14);
                        setSelectedScan(scan);
                      }
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
          <MapContainer
            key={`map-${JSON.stringify(mapCenter)}-${mapZoom}`}
            center={mapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredScans.map((scan) => (
              scan.latitude && scan.longitude && (
                <Marker
                  key={scan.id}
                  position={[scan.latitude, scan.longitude]}
                  icon={createCustomIcon(getMarkerColor(scan.score))}
                  eventHandlers={{
                    click: () => setSelectedScan(scan),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      {scan.image_url && (
                        <img
                          src={scan.image_url}
                          alt={scan.product_name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-sm mb-1">{scan.product_name}</h3>
                      {scan.brands && (
                        <p className="text-xs text-muted-foreground mb-2">{scan.brands}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={scan.is_compatible ? 'default' : 'destructive'} className="text-xs">
                          {scan.is_compatible ? '✓ Apto' : '✗ No apto'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {scan.score}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewDetails(scan)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
