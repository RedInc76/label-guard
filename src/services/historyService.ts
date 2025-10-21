import { supabase } from '@/integrations/supabase/client';
import { ProductInfo, AnalysisResult } from '@/types/restrictions';
import { ProfileService } from './profileService';

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
  analysis_type: 'barcode' | 'ai_photo';
  active_profiles_snapshot: any;
  front_photo_url: string | null;
  back_photo_url: string | null;
  created_at: string;
}

export class HistoryService {
  static async saveToHistory(
    product: ProductInfo,
    analysis: AnalysisResult,
    analysisType: 'barcode' | 'ai_photo' = 'barcode',
    photoUrls?: { front?: string; back?: string }
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
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving to history:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in saveToHistory:', error);
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
      return (data as any[]) || [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  static async deleteHistoryItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error deleting history item:', error);
      return false;
    }
  }
}
