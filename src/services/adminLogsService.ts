import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ApplicationLog = Database['public']['Tables']['application_logs']['Row'];

export interface LogFilters {
  logType?: string;
  userId?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface LogsResponse {
  logs: ApplicationLog[];
  total: number;
  hasMore: boolean;
}

export interface LogStats {
  totalLogs: number;
  logsByType: { log_type: string; count: number }[];
  activeLoggers: number;
  logsLast24h: number;
  logsLast7d: number;
  recentErrors: number;
}

export class AdminLogsService {
  /**
   * Obtener logs con filtros y paginación
   */
  static async getLogs(filters: LogFilters = {}): Promise<LogsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Verificar que sea admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (!isAdmin) throw new Error('No autorizado');

    let query = supabase
      .from('application_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.logType && filters.logType !== 'all') {
      query = query.eq('log_type', filters.logType);
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.searchTerm) {
      query = query.or(`message.ilike.%${filters.searchTerm}%,metadata::text.ilike.%${filters.searchTerm}%`);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) throw error;

    return {
      logs: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    };
  }

  /**
   * Obtener estadísticas de logging
   */
  static async getLogStats(): Promise<LogStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (!isAdmin) throw new Error('No autorizado');

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalLogs },
      logsByType,
      { data: activeLoggers },
      { count: logsLast24h },
      { count: logsLast7d },
      { count: recentErrors }
    ] = await Promise.all([
      supabase.from('application_logs').select('*', { count: 'exact', head: true }),
      supabase.from('application_logs')
        .select('log_type')
        .then(res => {
          if (!res.data) return [];
          const counts = res.data.reduce((acc, log) => {
            acc[log.log_type] = (acc[log.log_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return Object.entries(counts).map(([log_type, count]) => ({ log_type, count }));
        }),
      supabase.from('user_logging_config')
        .select('user_id')
        .eq('logging_enabled', true),
      supabase.from('application_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24h),
      supabase.from('application_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last7d),
      supabase.from('application_logs')
        .select('*', { count: 'exact', head: true })
        .eq('log_type', 'error')
        .gte('created_at', last24h)
    ]);

    return {
      totalLogs: totalLogs || 0,
      logsByType: logsByType || [],
      activeLoggers: activeLoggers?.length || 0,
      logsLast24h: logsLast24h || 0,
      logsLast7d: logsLast7d || 0,
      recentErrors: recentErrors || 0
    };
  }

  /**
   * Obtener un log específico por ID
   */
  static async getLogById(id: string): Promise<ApplicationLog | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (!isAdmin) throw new Error('No autorizado');

    const { data, error } = await supabase
      .from('application_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Obtener usuarios con logging habilitado
   */
  static async getUsersWithLogging(): Promise<Array<{ user_id: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    if (!isAdmin) throw new Error('No autorizado');

    const { data, error } = await supabase
      .from('user_logging_config')
      .select('user_id')
      .eq('logging_enabled', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Exportar logs a CSV
   */
  static async exportToCsv(filters: LogFilters = {}): Promise<Blob> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 });
    
    const headers = ['Fecha', 'Tipo', 'Usuario ID', 'Mensaje', 'Metadata'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.log_type,
      log.user_id,
      (log.message || '').replace(/"/g, '""'),
      JSON.stringify(log.metadata || {}).replace(/"/g, '""')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}
