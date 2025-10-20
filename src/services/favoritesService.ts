import { supabase } from '@/integrations/supabase/client';

export interface FavoriteItem {
  id: string;
  scan_history_id: string;
  product_name: string;
  brands: string | null;
  image_url: string | null;
  barcode: string | null;
  created_at: string;
}

export class FavoritesService {
  static async addToFavorites(scanHistoryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Get scan data
      const { data: scan } = await supabase
        .from('scan_history')
        .select('*')
        .eq('id', scanHistoryId)
        .single();
      
      if (!scan) return false;
      
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        scan_history_id: scanHistoryId,
        product_name: scan.product_name,
        brands: scan.brands,
        image_url: scan.image_url,
        barcode: scan.barcode,
      });
      
      // Ignore duplicate error
      if (error && error.code !== '23505') {
        console.error('Error adding to favorites:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      return false;
    }
  }
  
  static async removeFromFavorites(scanHistoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('scan_history_id', scanHistoryId);
      
      return !error;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }
  
  static async isFavorite(scanHistoryId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('scan_history_id', scanHistoryId)
        .maybeSingle();
      
      return !!data;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }
  
  static async getFavorites(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('favorites')
        .select(`
          *,
          scan_history:scan_history_id (*)
        `)
        .order('created_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }
}
