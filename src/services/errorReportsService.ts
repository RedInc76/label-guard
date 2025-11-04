import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { ProductInfo, AnalysisResult, Profile } from '@/types/restrictions';

export type ErrorCategory = 'wrong_product' | 'wrong_ingredients' | 'false_positive' | 'false_negative' | 'other';
export type ReportStatus = 'pending' | 'under_review' | 'requires_verification' | 'resolved' | 'dismissed';

// Use Supabase generated type
type ErrorReportRow = Database['public']['Tables']['error_reports']['Row'];

export interface ErrorReport extends Omit<ErrorReportRow, 'error_category' | 'status' | 'analysis_snapshot' | 'active_profiles_snapshot'> {
  error_category: ErrorCategory;
  status: ReportStatus;
  analysis_snapshot: {
    product?: ProductInfo;
    analysis?: AnalysisResult;
  } | null;
  active_profiles_snapshot: Array<{
    id: string;
    name: string;
    restrictions: any;
  }> | null;
}

export interface CreateReportData {
  error_category: ErrorCategory;
  user_description?: string;
  product: ProductInfo;
  analysis: AnalysisResult;
  activeProfiles: Profile[];
}

export interface UpdateReportData {
  status?: ReportStatus;
  admin_notes?: string;
  admin_id?: string;
  resolved_at?: string;
  cache_cleared_at?: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  category?: ErrorCategory;
  barcode?: string;
  startDate?: string;
  endDate?: string;
}

export const ERROR_CATEGORIES = {
  wrong_product: {
    label: '🔄 Producto Incorrecto',
    description: 'La app identificó un producto diferente al escaneado'
  },
  wrong_ingredients: {
    label: '📝 Ingredientes Incorrectos',
    description: 'Los ingredientes mostrados no coinciden con el empaque'
  },
  false_positive: {
    label: '⚠️ Falso Positivo',
    description: 'Marcó como "no apto" pero sí es compatible'
  },
  false_negative: {
    label: '✅ Falso Negativo',
    description: 'Marcó como "apto" pero no es compatible'
  },
  other: {
    label: '🤔 Otro Error',
    description: 'Otro tipo de error no listado arriba'
  }
} as const;

export const REPORT_STATUSES = {
  pending: {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: '⏳'
  },
  under_review: {
    label: 'En Revisión',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: '👀'
  },
  requires_verification: {
    label: 'Requiere Verificación',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: '🔍'
  },
  resolved: {
    label: 'Resuelto',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: '✅'
  },
  dismissed: {
    label: 'Descartado',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: '🗑️'
  }
} as const;

export class ErrorReportsService {
  // ============= USER METHODS =============
  
  static async createReport(data: CreateReportData): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const reportData: Database['public']['Tables']['error_reports']['Insert'] = {
      user_id: user.id,
      error_category: data.error_category,
      status: 'pending',
      barcode: data.product.code || null,
      product_name: data.product.product_name,
      user_description: data.user_description || null,
      analysis_snapshot: {
        product: data.product,
        analysis: data.analysis
      } as any,
      active_profiles_snapshot: data.activeProfiles.map(p => ({
        id: p.id,
        name: p.name,
        restrictions: p.restrictions
      })) as any
    };

    const { data: report, error } = await supabase
      .from('error_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw new Error('Error al crear el reporte');
    }

    console.log('✅ Error report created:', report.id);
    return report.id;
  }

  static async getUserReports(): Promise<ErrorReport[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('error_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      throw new Error('Error al obtener reportes');
    }

    return (data || []) as unknown as ErrorReport[];
  }

  static async getReportById(id: string): Promise<ErrorReport | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('error_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching report:', error);
      throw new Error('Error al obtener reporte');
    }

    return data as unknown as ErrorReport | null;
  }

  // ============= ADMIN METHODS =============

  static async getAllReports(filters?: ReportFilters): Promise<ErrorReport[]> {
    let query = supabase
      .from('error_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category) {
      query = query.eq('error_category', filters.category);
    }

    if (filters?.barcode) {
      query = query.ilike('barcode', `%${filters.barcode}%`);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all reports:', error);
      throw new Error('Error al obtener reportes');
    }

    return (data || []) as unknown as ErrorReport[];
  }

  static async updateReportStatus(
    reportId: string, 
    updateData: UpdateReportData
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const updates: any = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Si está resolviendo o descartando, agregar timestamp
    if (updateData.status === 'resolved' || updateData.status === 'dismissed') {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('error_reports')
      .update(updates)
      .eq('id', reportId);

    if (error) {
      console.error('Error updating report:', error);
      throw new Error('Error al actualizar reporte');
    }

    console.log(`✅ Report ${reportId} updated to status: ${updateData.status}`);
  }

  static async clearCacheAndVerify(reportId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Obtener el reporte
    const { data: report, error: fetchError } = await supabase
      .from('error_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (fetchError || !report) {
      throw new Error('Reporte no encontrado');
    }

    // 2. Limpiar cache del producto
    if (report.barcode) {
      const { AdminCacheService } = await import('./adminCacheService');
      await AdminCacheService.clearProductByBarcode(report.barcode);
    }

    // 3. Actualizar status del reporte
    await this.updateReportStatus(reportId, {
      status: 'requires_verification',
      admin_id: user.id,
      cache_cleared_at: new Date().toISOString()
    });

    console.log(`✅ Cache cleared and report marked for verification: ${reportId}`);
  }

  static async getReportStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    requiresVerification: number;
    resolved: number;
    dismissed: number;
    byCategory: Record<ErrorCategory, number>;
  }> {
    const { data: reports, error } = await supabase
      .from('error_reports')
      .select('error_category, status');

    if (error) {
      console.error('Error fetching report stats:', error);
      throw new Error('Error al obtener estadísticas');
    }

    const stats = {
      total: reports?.length || 0,
      pending: 0,
      underReview: 0,
      requiresVerification: 0,
      resolved: 0,
      dismissed: 0,
      byCategory: {
        wrong_product: 0,
        wrong_ingredients: 0,
        false_positive: 0,
        false_negative: 0,
        other: 0
      } as Record<ErrorCategory, number>
    };

    reports?.forEach(report => {
      // Count by status
      switch (report.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'under_review':
          stats.underReview++;
          break;
        case 'requires_verification':
          stats.requiresVerification++;
          break;
        case 'resolved':
          stats.resolved++;
          break;
        case 'dismissed':
          stats.dismissed++;
          break;
      }

      // Count by category
      stats.byCategory[report.error_category as ErrorCategory]++;
    });

    return stats;
  }
}
