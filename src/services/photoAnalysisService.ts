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
  
  static async analyzeNutritionPhoto(imageBase64: string): Promise<{
    energy_kj: number;
    proteins: number;
    carbohydrates: number;
    sugars: number;
    fats: number;
    saturated_fats: number;
    fiber: number;
    sodium: number;
    salt: number;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-product-photo', {
        body: { image: imageBase64, type: 'nutrition' }
      });
      
      if (error) throw error;
      
      return {
        energy_kj: data.energy_kj || 0,
        proteins: data.proteins || 0,
        carbohydrates: data.carbohydrates || 0,
        sugars: data.sugars || 0,
        fats: data.fats || 0,
        saturated_fats: data.saturated_fats || 0,
        fiber: data.fiber || 0,
        sodium: data.sodium || 0,
        salt: data.salt || 0,
      };
    } catch (error) {
      console.error('Error analyzing nutrition photo:', error);
      throw error;
    }
  }
  
  static async uploadPhoto(
    photo: Blob, 
    type: 'front' | 'back' | 'nutrition'
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const fileName = `${user.id}/${Date.now()}_${type}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, photo);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
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
