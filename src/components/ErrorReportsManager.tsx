import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  ErrorReportsService,
  ERROR_CATEGORIES,
  REPORT_STATUSES,
  type ErrorReport,
  type ErrorCategory,
  type ReportStatus,
} from '@/services/errorReportsService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ErrorReportsManager = () => {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ErrorCategory | 'all'>('all');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [updatingReports, setUpdatingReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReports();
  }, [filterStatus, filterCategory, searchBarcode]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const filters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        barcode: searchBarcode || undefined,
      };
      const data = await ErrorReportsService.getAllReports(filters);
      setReports(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar los reportes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
    try {
      setUpdatingReports(prev => new Set(prev).add(reportId));
      
      await ErrorReportsService.updateReportStatus(reportId, {
        status,
        admin_notes: adminNotes[reportId] || undefined,
      });

      toast({
        title: '✅ Estado actualizado',
        description: `Reporte marcado como: ${REPORT_STATUSES[status].label}`,
      });

      await loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } finally {
      setUpdatingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleClearCacheAndVerify = async (reportId: string) => {
    try {
      setUpdatingReports(prev => new Set(prev).add(reportId));
      
      await ErrorReportsService.clearCacheAndVerify(reportId);

      toast({
        title: '✅ Cache limpiado',
        description: 'Producto marcado para re-verificación. Cache eliminado exitosamente.',
      });

      await loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo limpiar el cache',
        variant: 'destructive',
      });
    } finally {
      setUpdatingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleSaveNotes = async (reportId: string) => {
    const notes = adminNotes[reportId];
    
    if (!notes || notes.trim() === '') {
      toast({
        title: 'Advertencia',
        description: 'No hay notas para guardar',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdatingReports(prev => new Set(prev).add(reportId));
      
      // Obtener el reporte actual para mantener su estado
      const currentReport = reports.find(r => r.id === reportId);
      if (!currentReport) throw new Error('Reporte no encontrado');
      
      await ErrorReportsService.updateReportStatus(reportId, {
        status: currentReport.status, // Mantener el estado actual
        admin_notes: notes,
      });

      toast({
        title: '✅ Notas guardadas',
        description: 'Las notas del admin se guardaron correctamente',
      });

      await loadReports();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron guardar las notas',
        variant: 'destructive',
      });
    } finally {
      setUpdatingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getQuickActions = (report: ErrorReport) => {
    const isUpdating = updatingReports.has(report.id);

    switch (report.status) {
      case 'pending':
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(report.id, 'under_review')}
              disabled={isUpdating}
            >
              👀 Revisar
            </Button>
          </div>
        );
      
      case 'under_review':
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClearCacheAndVerify(report.id)}
              disabled={isUpdating || !report.barcode}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpiar Cache + Verificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(report.id, 'resolved')}
              disabled={isUpdating}
            >
              ✅ Resolver
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleUpdateStatus(report.id, 'dismissed')}
              disabled={isUpdating}
            >
              🗑️ Descartar
            </Button>
          </div>
        );
      
      case 'requires_verification':
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateStatus(report.id, 'resolved')}
              disabled={isUpdating}
            >
              ✅ Resolver
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleUpdateStatus(report.id, 'dismissed')}
              disabled={isUpdating}
            >
              🗑️ Descartar
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ReportStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(REPORT_STATUSES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.icon} {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ErrorCategory | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(ERROR_CATEGORIES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buscar por código de barras</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Código de barras"
                  value={searchBarcode}
                  onChange={(e) => setSearchBarcode(e.target.value)}
                />
                <Button variant="outline" size="icon" onClick={loadReports}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No se encontraron reportes con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <Collapsible
                open={expandedReports.has(report.id)}
                onOpenChange={() => toggleExpanded(report.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={REPORT_STATUSES[report.status].color}>
                          {REPORT_STATUSES[report.status].icon} {REPORT_STATUSES[report.status].label}
                        </Badge>
                        <Badge variant="outline">
                          {ERROR_CATEGORIES[report.error_category].label}
                        </Badge>
                        {report.barcode && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {report.barcode}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm">{report.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>

                      {report.user_description && (
                        <p className="text-sm text-muted-foreground italic">
                          "{report.user_description}"
                        </p>
                      )}
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {expandedReports.has(report.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Product Preview */}
                    {report.analysis_snapshot?.product && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          {report.analysis_snapshot.product.image_url && (
                            <img
                              src={report.analysis_snapshot.product.image_url}
                              alt={report.product_name}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0 text-sm">
                            <p className="font-medium">{report.analysis_snapshot.product.product_name}</p>
                            {report.analysis_snapshot.product.brands && (
                              <p className="text-xs text-muted-foreground">
                                {report.analysis_snapshot.product.brands}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analysis Snapshot */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Snapshot del Análisis</Label>
                      <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        <pre>{JSON.stringify(report.analysis_snapshot, null, 2)}</pre>
                      </div>
                    </div>

                    {/* Active Profiles */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Perfiles Activos</Label>
                      <div className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        <pre>{JSON.stringify(report.active_profiles_snapshot, null, 2)}</pre>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${report.id}`} className="text-xs font-semibold">
                        Notas del Admin
                      </Label>
                      <Textarea
                        id={`notes-${report.id}`}
                        placeholder="Agregar notas internas sobre este reporte..."
                        value={adminNotes[report.id] || report.admin_notes || ''}
                        onChange={(e) => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                        rows={3}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSaveNotes(report.id)}
                        disabled={updatingReports.has(report.id) || !adminNotes[report.id]?.trim()}
                        className="w-full"
                      >
                        {updatingReports.has(report.id) ? (
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                          '💾 '
                        )}
                        Guardar Notas
                      </Button>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Acciones Rápidas</Label>
                      {getQuickActions(report)}
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                      {report.cache_cleared_at && (
                        <p>🗑️ Cache limpiado: {format(new Date(report.cache_cleared_at), "d/MM/yyyy HH:mm", { locale: es })}</p>
                      )}
                      {report.resolved_at && (
                        <p>✅ Resuelto: {format(new Date(report.resolved_at), "d/MM/yyyy HH:mm", { locale: es })}</p>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
