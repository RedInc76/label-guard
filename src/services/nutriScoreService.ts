/**
 * NutriScoreService - Cálculo de Nutri-Score y clasificación NOVA
 * 
 * Nutri-Score: Sistema de etiquetado nutricional francés que clasifica
 * alimentos de A (mejor) a E (peor) basándose en su perfil nutricional.
 * 
 * NOVA: Sistema de clasificación de alimentos según su grado de procesamiento
 * industrial (1 = sin procesar, 4 = ultra-procesado).
 */

export class NutriScoreService {
  
  /**
   * Calcular Nutri-Score basado en nutriments por 100g
   * Algoritmo oficial Nutri-Score 2024 (Francia)
   * 
   * @param nutriments - Valores nutricionales por 100g
   * @returns Letra de A a E (lowercase) o null si datos insuficientes
   */
  static calculateNutriScore(nutriments: {
    energy_kj?: number;
    proteins?: number;
    fiber?: number;
    sodium?: number;
    sugars?: number;
    saturated_fats?: number;
  }): string | null {
    
    // Validar que tengamos datos mínimos
    if (!nutriments.energy_kj && !nutriments.proteins && !nutriments.sugars) {
      console.warn('[NutriScore] Nutriments insuficientes para calcular');
      return null;
    }
    
    let negativePoints = 0;
    let positivePoints = 0;
    
    // === PUNTOS NEGATIVOS ===
    
    // Energía (kJ por 100g)
    const energy = nutriments.energy_kj || 0;
    if (energy <= 335) negativePoints += 0;
    else if (energy <= 670) negativePoints += 1;
    else if (energy <= 1005) negativePoints += 2;
    else if (energy <= 1340) negativePoints += 3;
    else if (energy <= 1675) negativePoints += 4;
    else if (energy <= 2010) negativePoints += 5;
    else if (energy <= 2345) negativePoints += 6;
    else if (energy <= 2680) negativePoints += 7;
    else if (energy <= 3015) negativePoints += 8;
    else if (energy <= 3350) negativePoints += 9;
    else negativePoints += 10;
    
    // Azúcares (g por 100g)
    const sugars = nutriments.sugars || 0;
    if (sugars <= 4.5) negativePoints += 0;
    else if (sugars <= 9) negativePoints += 1;
    else if (sugars <= 13.5) negativePoints += 2;
    else if (sugars <= 18) negativePoints += 3;
    else if (sugars <= 22.5) negativePoints += 4;
    else if (sugars <= 27) negativePoints += 5;
    else if (sugars <= 31) negativePoints += 6;
    else if (sugars <= 36) negativePoints += 7;
    else if (sugars <= 40) negativePoints += 8;
    else if (sugars <= 45) negativePoints += 9;
    else negativePoints += 10;
    
    // Grasas saturadas (g por 100g)
    const saturatedFat = nutriments.saturated_fats || 0;
    if (saturatedFat <= 1) negativePoints += 0;
    else if (saturatedFat <= 2) negativePoints += 1;
    else if (saturatedFat <= 3) negativePoints += 2;
    else if (saturatedFat <= 4) negativePoints += 3;
    else if (saturatedFat <= 5) negativePoints += 4;
    else if (saturatedFat <= 6) negativePoints += 5;
    else if (saturatedFat <= 7) negativePoints += 6;
    else if (saturatedFat <= 8) negativePoints += 7;
    else if (saturatedFat <= 9) negativePoints += 8;
    else if (saturatedFat <= 10) negativePoints += 9;
    else negativePoints += 10;
    
    // Sodio (mg por 100g)
    const sodium = nutriments.sodium || 0;
    if (sodium <= 90) negativePoints += 0;
    else if (sodium <= 180) negativePoints += 1;
    else if (sodium <= 270) negativePoints += 2;
    else if (sodium <= 360) negativePoints += 3;
    else if (sodium <= 450) negativePoints += 4;
    else if (sodium <= 540) negativePoints += 5;
    else if (sodium <= 630) negativePoints += 6;
    else if (sodium <= 720) negativePoints += 7;
    else if (sodium <= 810) negativePoints += 8;
    else if (sodium <= 900) negativePoints += 9;
    else negativePoints += 10;
    
    // === PUNTOS POSITIVOS ===
    
    // Proteínas (g por 100g)
    const proteins = nutriments.proteins || 0;
    if (proteins <= 1.6) positivePoints += 0;
    else if (proteins <= 3.2) positivePoints += 1;
    else if (proteins <= 4.8) positivePoints += 2;
    else if (proteins <= 6.4) positivePoints += 3;
    else if (proteins <= 8.0) positivePoints += 4;
    else positivePoints += 5;
    
    // Fibra (g por 100g)
    const fiber = nutriments.fiber || 0;
    if (fiber <= 0.9) positivePoints += 0;
    else if (fiber <= 1.9) positivePoints += 1;
    else if (fiber <= 2.8) positivePoints += 2;
    else if (fiber <= 3.7) positivePoints += 3;
    else if (fiber <= 4.7) positivePoints += 4;
    else positivePoints += 5;
    
    // === CÁLCULO FINAL ===
    const finalScore = negativePoints - positivePoints;
    
    console.log('[NutriScore] Cálculo:', {
      negative: negativePoints,
      positive: positivePoints,
      final: finalScore,
      energy, sugars, saturatedFat, sodium, proteins, fiber
    });
    
    // Conversión a letra (A-E)
    if (finalScore <= -1) return 'a';
    if (finalScore <= 2) return 'b';
    if (finalScore <= 10) return 'c';
    if (finalScore <= 18) return 'd';
    return 'e';
  }
  
  /**
   * Calcular clasificación NOVA basado en ingredientes
   * 
   * NOVA clasifica alimentos según procesamiento:
   * - Grupo 1: Alimentos sin procesar o mínimamente procesados
   * - Grupo 2: Ingredientes culinarios procesados
   * - Grupo 3: Alimentos procesados
   * - Grupo 4: Productos ultra-procesados
   * 
   * @param ingredients - Lista de ingredientes en texto
   * @returns Número del 1 al 4
   */
  static calculateNovaGroup(ingredients: string): number {
    const ingredientsLower = ingredients.toLowerCase();
    
    // Palabras clave para NOVA 4 (Ultra-procesados)
    const ultraProcessedKeywords = [
      'jarabe de maíz',
      'jarabe de glucosa',
      'aceite hidrogenado',
      'proteína hidrolizada',
      'maltodextrina',
      'dextrosa',
      'fructosa cristalina',
      'emulsionante',
      'estabilizante',
      'colorante',
      'saborizante artificial',
      'potenciador del sabor',
      'e621', 'e951', 'e950', // Códigos E de aditivos
      'glutamato monosódico',
      'aspartamo',
      'sucralosa',
      'acesulfamo',
    ];
    
    // Palabras clave para NOVA 3 (Procesados)
    const processedKeywords = [
      'sal',
      'azúcar añadida',
      'aceite',
      'mantequilla',
      'conservante',
      'antioxidante',
    ];
    
    // Verificar NOVA 4 (prioridad más alta)
    const hasUltraProcessed = ultraProcessedKeywords.some(keyword => 
      ingredientsLower.includes(keyword)
    );
    
    if (hasUltraProcessed) {
      console.log('[NOVA] Clasificado como Grupo 4 (Ultra-procesado)');
      return 4;
    }
    
    // Verificar NOVA 3
    const hasProcessed = processedKeywords.some(keyword => 
      ingredientsLower.includes(keyword)
    );
    
    // Contar número de ingredientes como heurística adicional
    const ingredientCount = ingredients.split(',').length;
    
    if (hasProcessed || ingredientCount > 5) {
      console.log('[NOVA] Clasificado como Grupo 3 (Procesado)');
      return 3;
    }
    
    // Por defecto, asumir NOVA 2 (ingredientes culinarios procesados)
    // NOVA 1 es muy raro (alimentos sin procesar)
    console.log('[NOVA] Clasificado como Grupo 2 (Ingredientes culinarios procesados)');
    return 2;
  }
  
  /**
   * Obtener color para badge de Nutri-Score
   */
  static getNutriScoreColor(grade: string): { bg: string; text: string; border: string } {
    const g = grade.toLowerCase();
    if (g === 'a') return { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-700' };
    if (g === 'b') return { bg: 'bg-lime-100 dark:bg-lime-950', text: 'text-lime-800 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-700' };
    if (g === 'c') return { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' };
    if (g === 'd') return { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' };
    return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-700' };
  }
  
  /**
   * Obtener color para badge de NOVA
   */
  static getNovaColor(group: number): { bg: string; text: string; border: string } {
    if (group === 1) return { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-800 dark:text-green-300', border: 'border-green-300 dark:border-green-700' };
    if (group === 2) return { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' };
    if (group === 3) return { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' };
    return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-300', border: 'border-red-300 dark:border-red-700' };
  }
}
