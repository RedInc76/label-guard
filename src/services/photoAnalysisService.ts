import { supabase } from '@/integrations/supabase/client';

export class PhotoAnalysisService {
  static async analyzeFrontPhoto(imageBase64: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-product-photo', {
        body: { image: imageBase64, type: 'front' }
      });
      
      if (error) throw error;
      return data.product_name || 'Producto sin nombre';
    } catch (error) {
      console.error('Error analyzing front photo:', error);
      throw error;
    }
  }
  
  static async analyzeBackPhoto(imageBase64: string): Promise<{
    ingredients: string;
    allergens: string;
    warnings: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-product-photo', {
        body: { image: imageBase64, type: 'back' }
      });
      
      if (error) throw error;
      
      return {
        ingredients: data.ingredients || '',
        allergens: data.allergens || '',
        warnings: data.warnings || '',
      };
    } catch (error) {
      console.error('Error analyzing back photo:', error);
      throw error;
    }
  }
  
  static async uploadPhoto(
    photo: Blob, 
    type: 'front' | 'back'
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const fileName = `${user.id}/${Date.now()}_${type}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, photo);
      
      if (uploadError) throw uploadError;
      
      const { data, error: signedUrlError } = await supabase.storage
        .from('product-photos')
        .createSignedUrl(fileName, 3600); // 1 hour expiry
      
      if (signedUrlError) throw signedUrlError;
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }
  
  static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
