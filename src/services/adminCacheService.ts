import { supabase } from '@/integrations/supabase/client';
import type { ErrorReport } from './errorReportsService';

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

  static async clearCacheFromReport(report: ErrorReport): Promise<void> {
    if (!report.barcode) {
      throw new Error('El reporte no tiene código de barras');
    }

    await this.clearProductByBarcode(report.barcode);
    console.log('✅ Cache cleared from error report:', report.id);
  }
}
