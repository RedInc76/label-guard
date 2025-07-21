import { ProductInfo } from '@/types/restrictions';

export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';

  static async getProduct(barcode: string): Promise<ProductInfo | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/${barcode}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 0 || !data.product) {
        return null; // Producto no encontrado
      }

      const product = data.product;

      return {
        code: barcode,
        product_name: product.product_name || product.product_name_es || product.product_name_en || 'Producto sin nombre',
        brands: product.brands || '',
        ingredients_text: product.ingredients_text || product.ingredients_text_es || product.ingredients_text_en || '',
        allergens: product.allergens || '',
        nutriscore_grade: product.nutriscore_grade,
        nova_group: product.nova_group,
        ecoscore_grade: product.ecoscore_grade,
        image_url: product.image_url || product.image_front_url
      };
    } catch (error) {
      console.error('Error fetching product from OpenFoodFacts:', error);
      throw new Error('Error al obtener información del producto');
    }
  }

  static async searchProducts(query: string, limit: number = 20): Promise<ProductInfo[]> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.products || data.products.length === 0) {
        return [];
      }

      return data.products.map((product: any) => ({
        code: product.code || '',
        product_name: product.product_name || product.product_name_es || product.product_name_en || 'Producto sin nombre',
        brands: product.brands || '',
        ingredients_text: product.ingredients_text || product.ingredients_text_es || product.ingredients_text_en || '',
        allergens: product.allergens || '',
        nutriscore_grade: product.nutriscore_grade,
        nova_group: product.nova_group,
        ecoscore_grade: product.ecoscore_grade,
        image_url: product.image_url || product.image_front_url
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Error al buscar productos');
    }
  }
}