import { supabase } from '@/integrations/supabase/client';
import { ProductInfo } from '@/types/restrictions';
import { loggingService } from './loggingService';

interface CachedProduct {
  id: string;
  barcode: string | null;
  product_name: string;
  brands: string | null;
  ingredients_text: string | null;
  allergens: string | null;
  front_photo_url: string | null;
  back_photo_url: string | null;
  image_url: string | null;
  times_accessed: number;
  last_accessed_at: string;
  created_at: string;
}

export class AIProductCacheService {
  /**
   * Buscar producto por código de barras en cache local
   */
  static async getByBarcode(barcode: string): Promise<(ProductInfo & { cache_id: string; created_at: string }) | null> {
    try {
      const { data, error } = await supabase
        .from('ai_analyzed_products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching from cache:', error);
        await loggingService.logError('cache_fetch_error', error);
        return null;
      }

      if (!data) {
        console.log('Product not found in cache:', barcode);
        return null;
      }

      console.log('✅ Product found in cache:', data.product_name);
      await loggingService.logAction('cache_hit', {
        barcode,
        product_name: data.product_name,
      });

      // Convertir a ProductInfo
      return {
        cache_id: data.id,
        created_at: data.created_at,
        code: data.barcode || '',
        product_name: data.product_name,
        brands: data.brands || '',
        ingredients_text: data.ingredients_text || '',
        allergens: data.allergens || '',
        image_url: data.image_url || data.front_photo_url || '',
      };
    } catch (error) {
      console.error('Error in getByBarcode:', error);
      await loggingService.logError('Unexpected error in cache', error);
      return null;
    }
  }

  /**
   * Verificar si el caché es válido comparando con la última modificación de perfiles
   * @param cacheCreatedAt - Fecha de creación del registro en caché (ISO string)
   * @returns true si el caché es válido, false si debe re-analizarse
   */
  static async isCacheValid(cacheCreatedAt: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Obtener la fecha de la última modificación en profiles
      const { data: latestProfile } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestProfile) return true; // Si no hay perfiles, caché es válido

      const latestProfileUpdate = new Date(latestProfile.updated_at);
      const cacheDate = new Date(cacheCreatedAt);

      // Caché es válido si fue creado DESPUÉS de la última modificación de perfil
      const isValid = cacheDate >= latestProfileUpdate;
      
      if (!isValid) {
        console.log('⚠️ Caché invalidado: perfil modificado en', latestProfile.updated_at);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false; // En caso de error, no usar caché (más seguro)
    }
  }

  /**
   * Guardar producto analizado por IA en cache
   */
  static async saveAnalyzedProduct(
    product: ProductInfo,
    photoUrls: { front?: string; back?: string },
    barcode?: string
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      const cacheData = {
        barcode: barcode || null,
        product_name: product.product_name,
        brands: product.brands || null,
        ingredients_text: product.ingredients_text || null,
        allergens: product.allergens || null,
        front_photo_url: photoUrls.front || null,
        back_photo_url: photoUrls.back || null,
        image_url: product.image_url || photoUrls.front || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('ai_analyzed_products')
        .insert(cacheData)
        .select('id')
        .single();

      if (error) {
        // Si el error es por barcode duplicado, no es crítico
        if (error.code === '23505') {
          console.log('Product already exists in cache:', barcode);
          await loggingService.logAction('cache_duplicate', {
            barcode,
            product_name: product.product_name,
          });
          return null;
        }
        console.error('Error saving to cache:', error);
        await loggingService.logError('cache_save_error', error);
        return null;
      }

      console.log('✅ Product saved to cache:', product.product_name);
      await loggingService.logAction('cache_save', {
        cache_id: data.id,
        barcode,
        product_name: product.product_name,
      });

      return data.id;
    } catch (error) {
      console.error('Error in saveAnalyzedProduct:', error);
      await loggingService.logError('Unexpected error saving to cache', error);
      return null;
    }
  }

  /**
   * Incrementar contador de accesos (para estadísticas)
   */
  static async incrementAccessCount(cacheId: string): Promise<void> {
    try {
      // Obtener el valor actual y sumarle 1
      const { data: current } = await supabase
        .from('ai_analyzed_products')
        .select('times_accessed')
        .eq('id', cacheId)
        .single();

      if (current) {
        const { error } = await supabase
          .from('ai_analyzed_products')
          .update({
            times_accessed: (current.times_accessed || 0) + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('id', cacheId);

        if (error) {
          console.error('Error incrementing access count:', error);
        }
      }
    } catch (error) {
      console.error('Error in incrementAccessCount:', error);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  static async getCacheStats(): Promise<{
    totalProducts: number;
    withBarcode: number;
    withoutBarcode: number;
    mostAccessed: Array<{ product_name: string; times_accessed: number }>;
  }> {
    try {
      // Total de productos
      const { count: totalProducts } = await supabase
        .from('ai_analyzed_products')
        .select('*', { count: 'exact', head: true });

      // Productos con código de barras
      const { count: withBarcode } = await supabase
        .from('ai_analyzed_products')
        .select('*', { count: 'exact', head: true })
        .not('barcode', 'is', null);

      // Productos más accedidos
      const { data: mostAccessed } = await supabase
        .from('ai_analyzed_products')
        .select('product_name, times_accessed')
        .order('times_accessed', { ascending: false })
        .limit(10);

      return {
        totalProducts: totalProducts || 0,
        withBarcode: withBarcode || 0,
        withoutBarcode: (totalProducts || 0) - (withBarcode || 0),
        mostAccessed: mostAccessed || [],
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalProducts: 0,
        withBarcode: 0,
        withoutBarcode: 0,
        mostAccessed: [],
      };
    }
  }
}
