import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryService } from '@/services/historyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, TrendingUp, Star, AlertTriangle, DollarSign, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const Insights = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    loadInsights();
  }, [period]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await HistoryService.getInsightsData(Number(period));
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="container max-w-6xl mx-auto px-4 py-6">Cargando insights...</div>;
  }

  if (!insights) {
    return <div className="container max-w-6xl mx-auto px-4 py-6">No se pudieron cargar los datos</div>;
  }

  // Preparar datos para gráficos
  const dailyData = Object.entries(insights.dailyScans)
    .map(([date, count]) => ({
      date: format(new Date(date), 'd MMM', { locale: es }),
      escaneos: count,
    }))
    .slice(-14); // Últimos 14 días

  const compatibilityData = [
    { name: 'Compatibles', value: insights.compatibleScans, color: 'hsl(var(--primary))' },
    { name: 'No Compatibles', value: insights.incompatibleScans, color: 'hsl(var(--destructive))' },
  ];

  const analysisTypeData = [
    { name: 'IA', value: insights.usageStats.aiAnalyses, color: 'hsl(var(--accent))' },
    { name: 'Cache', value: insights.usageStats.cacheAnalyses, color: 'hsl(var(--primary))' },
    { name: 'OpenFoodFacts', value: insights.usageStats.openFoodFactsAnalyses, color: 'hsl(var(--muted))' },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden">
      {/* Header */}
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
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Insights Personales
            </h1>
            <p className="text-sm text-muted-foreground">
              Análisis de tus hábitos de escaneo
            </p>
          </div>
        </div>

        <Tabs value={period} onValueChange={(v: any) => setPeriod(v)}>
          <TabsList>
            <TabsTrigger value="7">7 días</TabsTrigger>
            <TabsTrigger value="30">30 días</TabsTrigger>
            <TabsTrigger value="90">90 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Escaneos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{insights.totalScans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              en los últimos {period} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Compatibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {insights.compatibilityRate.toFixed(1)}%
            </div>
            <Progress value={insights.compatibilityRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {insights.avgScore.toFixed(0)}/100
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                Calidad general
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eficiencia Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {insights.usageStats.cacheEfficiency.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ahorro: ${insights.usageStats.cacheSavings.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de escaneos */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Escaneos</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="escaneos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de compatibilidad */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibilidad de Productos</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={compatibilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {compatibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top productos y violaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Productos Más Escaneados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topProducts.slice(0, 10).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.item.product_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.item.brands}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{product.count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Violaciones frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Restricciones Más Violadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights.topViolations.length > 0 ? (
              <div className="space-y-3">
                {insights.topViolations.map((violation: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{violation.name}</span>
                      <span className="text-sm text-muted-foreground">{violation.count} veces</span>
                    </div>
                    <Progress 
                      value={(violation.count / insights.topViolations[0].count) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                ¡Sin violaciones! Todos tus productos son compatibles 🎉
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de uso de IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Estadísticas de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analysisTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {analysisTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Análisis con IA</p>
                  <p className="text-2xl font-bold">{insights.usageStats.aiAnalyses}</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Desde Cache</p>
                  <p className="text-2xl font-bold">{insights.usageStats.cacheAnalyses}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">OpenFoodFacts</p>
                  <p className="text-2xl font-bold">{insights.usageStats.openFoodFactsAnalyses}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Ahorro Cache
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${insights.usageStats.cacheSavings.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
