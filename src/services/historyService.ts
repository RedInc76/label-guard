import { supabase } from '@/integrations/supabase/client';
import { ProductInfo, AnalysisResult } from '@/types/restrictions';
import { ProfileService } from './profileService';
import { loggingService } from './loggingService';

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
  analysis_type: 'barcode' | 'ai_photo' | 'ai_cache';
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
    analysisType: 'barcode' | 'ai_photo' | 'ai_cache' = 'barcode',
    photoUrls?: { front?: string; back?: string },
    location?: { latitude: number; longitude: number } | null
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null; // Solo PREMIUM guarda historial
      
      const activeProfiles = await ProfileService.getActiveProfiles();
      
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
      .select()
      .single();
      
      if (error) {
        console.error('Error saving to history:', error);
        loggingService.logError('Error saving scan to history', error);
        return null;
      }
      
      loggingService.logAction('scan-saved-to-history', {
        scanId: data?.id,
        productName: product.product_name,
        analysisType,
        hasLocation: !!location
      });
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in saveToHistory:', error);
      loggingService.logError('Exception in saveToHistory', error);
      return null;
    }
  }
  
  static async getHistory(limit = 50): Promise<ScanHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      loggingService.logAction('history-fetched', {
        itemsCount: data?.length || 0,
        limit
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
        .select('*')
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

      // Estadísticas de uso
      const aiAnalyses = analytics?.filter(a => a.event_type === 'ai_analysis').length || 0;
      const cacheAnalyses = analytics?.filter(a => a.event_type === 'cache_hit').length || 0;
      const openFoodFactsAnalyses = analytics?.filter(a => a.event_type === 'openfoodfacts_search').length || 0;
      const estimatedCost = analytics?.reduce((sum, a) => sum + (a.cost_usd || 0), 0) || 0;
      const cacheSavings = cacheAnalyses * 0.01; // Estimación
      const totalAnalyses = aiAnalyses + cacheAnalyses + openFoodFactsAnalyses;
      const cacheEfficiency = totalAnalyses > 0 ? (cacheAnalyses / totalAnalyses) * 100 : 0;

      return {
        totalScans,
        compatibleScans,
        incompatibleScans: totalScans - compatibleScans,
        compatibilityRate: totalScans > 0 ? (compatibleScans / totalScans) * 100 : 0,
        avgScore,
        topProducts,
        topViolations,
        dailyScans,
        usageStats: {
          totalAnalyses,
          aiAnalyses,
          cacheAnalyses,
          openFoodFactsAnalyses,
          estimatedCost,
          cacheSavings,
          cacheEfficiency,
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
