import { supabase } from '@/integrations/supabase/client';

export class AdminCacheService {
  static async clearProductByBarcode(barcode: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin-clear-cache', {
      body: { barcode }
    });

    if (error) {
      console.error('Error clearing cache:', error);
      throw new Error(`Error al borrar del cache: ${error.message}`);
    }

    console.log('✅ Cache cleared for barcode:', barcode, data);
  }

  static async clearProductById(productId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin-clear-cache', {
      body: { productId }
    });

    if (error) {
      console.error('Error clearing cache:', error);
      throw new Error(`Error al borrar del cache: ${error.message}`);
    }

    console.log('✅ Cache cleared for product ID:', productId, data);
  }
}
