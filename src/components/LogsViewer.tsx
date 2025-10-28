import { useState, useEffect } from 'react';
import { AdminLogsService, type LogFilters, type LogStats } from '@/services/adminLogsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Eye, Activity, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ApplicationLog = Database['public']['Tables']['application_logs']['Row'];

interface LogsViewerProps {
  embedded?: boolean;
}

function getLogTypeBadgeVariant(logType: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (logType) {
    case 'error': return 'destructive';
    case 'action': return 'default';
    case 'navigation': return 'secondary';
    case 'scan': return 'outline';
    case 'analysis': return 'outline';
    default: return 'secondary';
  }
}

export function LogsViewer({ embedded = false }: LogsViewerProps) {
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({});
  const [selectedLog, setSelectedLog] = useState<ApplicationLog | null>(null);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  useEffect(() => {
    // Realtime subscription
    const channel = supabase
      .channel('application_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_logs'
        },
        (payload) => {
          const newLog = payload.new as ApplicationLog;
          setLogs(prev => [newLog, ...prev.slice(0, pageSize - 1)]);
          
          toast({
            title: 'Nuevo log',
            description: `${newLog.log_type}: ${newLog.message}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        AdminLogsService.getLogs({ ...filters, limit: pageSize, offset: page * pageSize }),
        AdminLogsService.getLogStats()
      ]);

      setLogs(logsData.logs);
      setTotal(logsData.total);
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar los logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleSearch = () => {
    handleFilterChange('searchTerm', searchInput);
  };

  const handleExport = async () => {
    try {
      const blob = await AdminLogsService.exportToCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Éxito',
        description: 'Logs exportados correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron exportar los logs',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todos los logs del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.logsLast24h || 0}</div>
            <p className="text-xs text-muted-foreground">
              Logs generados ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLoggers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Con logging habilitado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores Recientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.recentErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Errores en 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Tipo de log</Label>
              <Select onValueChange={(v) => handleFilterChange('logType', v)} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de log" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="action">Acción</SelectItem>
                  <SelectItem value="navigation">Navegación</SelectItem>
                  <SelectItem value="scan">Escaneo</SelectItem>
                  <SelectItem value="analysis">Análisis</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="profile">Perfil</SelectItem>
                  <SelectItem value="favorite">Favorito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Buscar</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Buscar..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div>
              <Label>Fecha inicio</Label>
              <Input 
                type="date" 
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label>Fecha fin</Label>
              <Input 
                type="date" 
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Aplicación</CardTitle>
          <CardDescription>
            Mostrando {logs.length} de {total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay logs que mostrar</p>
              <p className="text-sm">Intenta ajustar los filtros</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Mensaje</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLogTypeBadgeVariant(log.log_type)}>
                            {log.log_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {log.message}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <Button 
                  variant="outline" 
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page + 1} de {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedLog.id}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <div className="mt-1">
                    <Badge variant={getLogTypeBadgeVariant(selectedLog.log_type)}>
                      {selectedLog.log_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Usuario ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedLog.user_id}</p>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Mensaje</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedLog.message}</p>
              </div>
              
              <div>
                <Label>Metadata (JSON)</Label>
                <ScrollArea className="h-64 w-full rounded-md border p-4 mt-2 bg-muted">
                  <pre className="text-xs">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
