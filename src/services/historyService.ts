import { supabase } from '@/integrations/supabase/client';
import { ProductInfo, AnalysisResult } from '@/types/restrictions';
import { ProfileService } from './profileService';
import { loggingService } from './loggingService';
import { queryClient } from '@/lib/queryClient';

export interface ScanHistoryItem {
  id: string;
  barcode: string | null;
  product_name: string;
  brands: string | null;
  image_url: string | null;
  is_compatible: boolean;
  score: number;
  violations: any;
  warnings: any;
  ingredients_text: string | null;
  allergens: string | null;
  analysis_type: 'openfood_api' | 'ai_photo' | 'ai_cache';
  active_profiles_snapshot: any;
  front_photo_url: string | null;
  back_photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  nutriscore_grade: string | null;
  nova_group: number | null;
  ecoscore_grade: string | null;
}

export class HistoryService {
  static async saveToHistory(
    product: ProductInfo,
    analysis: AnalysisResult,
    analysisType: 'barcode' | 'ai_photo' | 'ai_cache' | 'openfoodfacts' = 'barcode',
    photoUrls?: { front?: string; back?: string },
    location?: { latitude: number; longitude: number } | null
  ): Promise<string | null> {
    try {
      // ✅ LOG NUEVO
      console.log('[HistoryService] 🔄 Iniciando saveToHistory:', {
        productName: product.product_name,
        barcode: product.code,
        analysisType,
        hasPhotoUrls: !!photoUrls,
        hasLocation: !!location
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // ✅ LOG NUEVO
      console.log('[HistoryService] 👤 Usuario:', {
        userId: user?.id,
        hasUser: !!user
      });
      
      if (!user) {
        console.warn('[HistoryService] ⚠️ No hay usuario autenticado, no se guardará historial');
        return null;
      }
      
      const activeProfiles = await ProfileService.getActiveProfiles();
      
      // ✅ LOG NUEVO
      console.log('[HistoryService] 👥 Perfiles activos:', {
        count: activeProfiles.length,
        profiles: activeProfiles.map(p => ({ id: p.id, name: p.name }))
      });
      
      // ✅ LOG NUEVO
      console.log('[HistoryService] 📝 Preparando INSERT en scan_history:', {
        user_id: user.id,
        barcode: product.code || null,
        product_name: product.product_name,
        analysis_type: analysisType,
        is_compatible: analysis.isCompatible,
        score: analysis.score,
        violations_count: analysis.violations.length,
        warnings_count: analysis.warnings.length,
        hasLocation: !!location
      });
      
      const { data, error } = await supabase
        .from('scan_history')
        .insert({
          user_id: user.id,
          barcode: product.code || null,
          product_name: product.product_name,
          brands: product.brands || null,
          image_url: product.image_url || null,
          is_compatible: analysis.isCompatible,
          score: analysis.score,
          violations: analysis.violations,
          warnings: analysis.warnings,
          ingredients_text: product.ingredients_text || null,
          allergens: product.allergens || null,
          analysis_type: analysisType,
          active_profiles_snapshot: activeProfiles.map(p => ({
            id: p.id,
            name: p.name
          })),
        front_photo_url: photoUrls?.front || null,
        back_photo_url: photoUrls?.back || null,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        nutriscore_grade: product.nutriscore_grade || null,
        nova_group: product.nova_group || null,
        ecoscore_grade: product.ecoscore_grade || null,
      })
      .select('id')
      .single();
      
      if (error) {
        // ✅ LOG MEJORADO
        console.error('[HistoryService] ❌ Error en INSERT scan_history:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          productName: product.product_name,
          barcode: product.code
        });
        loggingService.logError('Error saving scan to history', error);
        return null;
      }
      
      loggingService.logAction('scan-saved-to-history', {
        scanId: data?.id,
        productName: product.product_name,
        analysisType,
        hasLocation: !!location
      });
      
      // Invalidar caché para refrescar historial inmediatamente
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['history'] });
        queryClient.invalidateQueries({ queryKey: ['insights'] });
        
        // ✅ LOG NUEVO
        console.log('[HistoryService] ♻️ Cache invalidado para queries:', ['history', 'insights']);
      }
      
      // ✅ LOG NUEVO
      console.log('[HistoryService] ✅ saveToHistory completado exitosamente:', {
        historyId: data?.id,
        productName: product.product_name
      });
      
      return data?.id || null;
    } catch (error) {
      // ✅ LOG MEJORADO
      console.error('[HistoryService] 💥 Exception en saveToHistory:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        productName: product.product_name,
        barcode: product.code,
        analysisType
      });
      loggingService.logError('Exception in saveToHistory', error);
      return null;
    }
  }
  
  static async getHistory(limit = 50): Promise<ScanHistoryItem[]> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from('scan_history')
        .select('id, product_name, brands, image_url, is_compatible, score, violations, warnings, analysis_type, created_at, nutriscore_grade, nova_group, front_photo_url, back_photo_url')
        .gte('created_at', ninetyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      loggingService.logAction('history-fetched', {
        itemsCount: data?.length || 0,
        limit,
        maxAge: '90 days'
      });
      
      return (data as any[]) || [];
    } catch (error) {
      console.error('Error getting history:', error);
      loggingService.logError('Error fetching history', error);
      return [];
    }
  }

  static async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', id);
      
      if (!error) {
        loggingService.logAction('history-item-deleted', { historyId: id });
      } else {
        loggingService.logError('Error deleting history item', error);
      }
      
      return !error;
    } catch (error) {
      console.error('Error deleting history item:', error);
      loggingService.logError('Exception deleting history item', error);
      return false;
    }
  }

  static async getInsightsData(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Obtener todos los escaneos del período
      const { data: scans } = await supabase
        .from('scan_history')
        .select('created_at, is_compatible, score, violations, warnings, nutriscore_grade, nova_group, product_name, analysis_type')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Obtener analytics de uso
      const { data: analytics } = await supabase
        .from('usage_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Calcular métricas
      const totalScans = scans?.length || 0;
      const compatibleScans = scans?.filter(s => s.is_compatible).length || 0;
      const avgScore = totalScans > 0 
        ? scans.reduce((sum, s) => sum + s.score, 0) / totalScans 
        : 0;

      // Top productos escaneados (agrupar por product_name)
      const productCounts: Record<string, { count: number; item: any }> = {};
      scans?.forEach(scan => {
        if (!productCounts[scan.product_name]) {
          productCounts[scan.product_name] = { count: 0, item: scan };
        }
        productCounts[scan.product_name].count++;
      });

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Violaciones más frecuentes
      const violationCounts: Record<string, number> = {};
      scans?.forEach(scan => {
        if (Array.isArray(scan.violations)) {
          scan.violations.forEach((v: any) => {
            violationCounts[v.restriction] = (violationCounts[v.restriction] || 0) + 1;
          });
        }
      });

      const topViolations = Object.entries(violationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Escaneos por día
      const dailyScans: Record<string, number> = {};
      scans?.forEach(scan => {
        const date = new Date(scan.created_at).toISOString().split('T')[0];
        dailyScans[date] = (dailyScans[date] || 0) + 1;
      });

      // Distribución de Nutriscore
      const nutriscoreDistribution: Record<string, number> = {};
      scans?.forEach(scan => {
        if (scan.nutriscore_grade) {
          const grade = scan.nutriscore_grade.toUpperCase();
          nutriscoreDistribution[grade] = (nutriscoreDistribution[grade] || 0) + 1;
        }
      });

      // Distribución de NOVA
      const novaDistribution: Record<string, number> = {};
      scans?.forEach(scan => {
        if (scan.nova_group) {
          const group = `Grupo ${scan.nova_group}`;
          novaDistribution[group] = (novaDistribution[group] || 0) + 1;
        }
      });

      // Estadísticas de uso - contar por tipo de análisis desde scan_history
      const aiPhotoAnalyses = scans?.filter(s => s.analysis_type === 'ai_photo').length || 0;
      const aiCacheAnalyses = scans?.filter(s => s.analysis_type === 'ai_cache').length || 0;
      const barcodeAnalyses = scans?.filter(s => s.analysis_type === 'barcode').length || 0;
      
      // IA + Cache = "Análisis con IA" para el usuario
      const totalAIAnalyses = aiPhotoAnalyses + aiCacheAnalyses;

      return {
        totalScans,
        compatibleScans,
        incompatibleScans: totalScans - compatibleScans,
        compatibilityRate: totalScans > 0 ? (compatibleScans / totalScans) * 100 : 0,
        avgScore,
        topProducts,
        topViolations,
        dailyScans,
        nutriscoreDistribution,
        novaDistribution,
        usageStats: {
          totalAnalyses: totalScans,
          aiAnalyses: totalAIAnalyses,
          openFoodFactsAnalyses: barcodeAnalyses,
        },
      };
    } catch (error) {
      console.error('Error getting insights data:', error);
      loggingService.logError('Error fetching insights', error);
      throw error;
    }
  }

  static async getScansWithLocation(filters?: {
    compatible?: boolean;
    minScore?: number;
    days?: number;
  }): Promise<ScanHistoryItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (filters?.compatible !== undefined) {
        query = query.eq('is_compatible', filters.compatible);
      }

      if (filters?.minScore !== undefined) {
        query = query.gte('score', filters.minScore);
      }

      if (filters?.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - filters.days);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    } catch (error) {
      console.error('Error getting scans with location:', error);
      loggingService.logError('Error fetching location scans', error);
      return [];
    }
  }

  static async getMultipleScans(ids: string[]): Promise<ScanHistoryItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
      return (data as any[]) || [];
    } catch (error) {
      console.error('Error getting multiple scans:', error);
      loggingService.logError('Error fetching multiple scans', error);
      return [];
    }
  }
}
