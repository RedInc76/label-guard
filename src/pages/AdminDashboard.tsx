import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageAnalyticsService } from '@/services/usageAnalyticsService';
import { Loader2, TrendingUp, Users, DollarSign, Database, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { LogsViewer } from '@/components/LogsViewer';

const COLORS = {
  ai: '#ef4444',
  cache: '#22c55e',
  openfoodfacts: '#3b82f6',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [adminInsights, setAdminInsights] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stats, insights] = await Promise.all([
        UsageAnalyticsService.getGlobalStats(),
        UsageAnalyticsService.getAdminInsights(),
      ]);

      setGlobalStats(stats);
      setAdminInsights(insights);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const pieData = [
    { name: 'OpenFoodFacts', value: globalStats.totalOpenFoodFacts, color: COLORS.openfoodfacts },
    { name: 'Cache', value: globalStats.totalCacheHits, color: COLORS.cache },
    { name: 'IA', value: globalStats.totalAIAnalyses, color: COLORS.ai },
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitoreo de uso de IA, estadísticas globales y logs de aplicación</p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {adminInsights.activeUsersLast30Days} activos (30 días)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${globalStats.totalCostUSD.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">
                Proyección mensual: ${adminInsights.monthlyProjection.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia Cache</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.cacheEfficiency.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Ahorro: ${globalStats.totalSavingsUSD.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminInsights.growthRate > 0 ? '+' : ''}{adminInsights.growthRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Fuentes</CardTitle>
              <CardDescription>De dónde provienen los datos de productos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas Clave</CardTitle>
              <CardDescription>Comparación de fuentes de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Usuarios por Uso de IA</CardTitle>
            <CardDescription>Usuarios con mayor consumo de análisis por IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-right p-2">Análisis IA</th>
                    <th className="text-right p-2">Costo USD</th>
                  </tr>
                </thead>
                <tbody>
                  {adminInsights.topUsersByAIUsage.map((user: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{user.email}</td>
                      <td className="text-right p-2">{user.total_ai_uses}</td>
                      <td className="text-right p-2">${user.cost_usd.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo promedio por usuario:</span>
                  <span className="font-medium">${adminInsights.avgCostPerUser.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total análisis IA:</span>
                  <span className="font-medium">{globalStats.totalAIAnalyses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total cache hits:</span>
                  <span className="font-medium">{globalStats.totalCacheHits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total OpenFoodFacts:</span>
                  <span className="font-medium">{globalStats.totalOpenFoodFacts}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <LogsViewer embedded />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
