import { ProductInfo, AnalysisResult, UserProfile } from '@/types/restrictions';

export class AnalysisService {
  static analyzeProduct(product: ProductInfo, profile: UserProfile): AnalysisResult {
    const violations: AnalysisResult['violations'] = [];
    const warnings: string[] = [];

    // Obtener todas las restricciones activas
    const activeRestrictions = profile.restrictions.filter(r => r.enabled);
    const customRestrictions = profile.customRestrictions;

    // Combinar todo el texto para análisis
    const productText = [
      product.ingredients_text,
      product.allergens,
      product.product_name,
      product.brands
    ].join(' ').toLowerCase();

    // Verificar restricciones predefinidas
    activeRestrictions.forEach(restriction => {
      const foundKeywords = restriction.keywords.filter(keyword => 
        productText.includes(keyword.toLowerCase())
      );

      if (foundKeywords.length > 0) {
        violations.push({
          restriction: restriction.name,
          reason: `Contiene: ${foundKeywords.join(', ')}`,
          severity: this.getSeverity(restriction.category)
        });
      }
    });

    // Verificar restricciones personalizadas
    customRestrictions.forEach(customRestriction => {
      if (productText.includes(customRestriction.toLowerCase())) {
        violations.push({
          restriction: customRestriction,
          reason: `Contiene ingrediente restringido: ${customRestriction}`,
          severity: 'medium'
        });
      }
    });

    // Generar advertencias adicionales
    if (product.nutriscore_grade && ['d', 'e'].includes(product.nutriscore_grade.toLowerCase())) {
      warnings.push('Producto con calificación nutricional baja (Nutri-Score D o E)');
    }

    if (product.nova_group && product.nova_group >= 3) {
      warnings.push('Producto altamente procesado (NOVA grupo 3 o 4)');
    }

    // Calcular puntuación de compatibilidad
    const score = this.calculateCompatibilityScore(violations, warnings);

    return {
      isCompatible: violations.length === 0,
      violations,
      warnings,
      score
    };
  }

  private static getSeverity(category: string): 'high' | 'medium' | 'low' {
    switch (category) {
      case 'allergens':
        return 'high';
      case 'religious':
        return 'high';
      case 'health':
        return 'medium';
      case 'dietary':
        return 'medium';
      default:
        return 'low';
    }
  }

  private static calculateCompatibilityScore(
    violations: AnalysisResult['violations'], 
    warnings: string[]
  ): number {
    let score = 100;

    // Penalizar por violaciones
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'high':
          score -= 30;
          break;
        case 'medium':
          score -= 20;
          break;
        case 'low':
          score -= 10;
          break;
      }
    });

    // Penalizar por advertencias
    score -= warnings.length * 5;

    return Math.max(0, score);
  }

  static getScoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  }

  static getScoreLabel(score: number): string {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Aceptable';
    if (score >= 40) return 'Precaución';
    return 'No recomendado';
  }
}