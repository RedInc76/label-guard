import { ProductInfo, AnalysisResult, UserProfile, Profile, DietaryRestriction, SeverityLevel, SEVERITY_LEVELS } from '@/types/restrictions';
import { ProfileService } from './profileService';
import { loggingService } from './loggingService';

interface IngredientContext {
  text: string;
  type: 'direct' | 'trace' | 'may_contain' | 'cross_contamination' | 'ambiguous';
  confidence: 'high' | 'medium' | 'low';
}

export class AnalysisService {
  // Nuevo método principal para análisis con múltiples perfiles (ahora async)
  static async analyzeProductForActiveProfiles(product: ProductInfo): Promise<AnalysisResult> {
    try {
      const activeProfiles = await ProfileService.getActiveProfiles();
      
      if (activeProfiles.length === 0) {
        const error = new Error('No hay perfiles activos. Activa al menos un perfil para escanear.');
        loggingService.logError('No active profiles for analysis', error);
        throw error;
      }

      // Combinar restricciones de todos los perfiles activos
      const combined = this.combineAllRestrictions(activeProfiles);
      
      const result = this.analyzeProduct(product, combined);
      
      // Log successful analysis
      loggingService.logAnalysis('product-analysis', {
        productName: product.product_name,
        barcode: product.code,
        isCompatible: result.isCompatible,
        violationsCount: result.violations.length,
        score: result.score,
        activeProfilesCount: activeProfiles.length
      });
      
      return result;
    } catch (error) {
      loggingService.logError('Error analyzing product', error);
      throw error;
    }
  }

  // Método helper: combinar restricciones de múltiples perfiles
  private static combineAllRestrictions(profiles: Profile[]): UserProfile {
    const allRestrictions: DietaryRestriction[] = [];
    const allCustom: Array<{ text: string; severityLevel: SeverityLevel }> = [];
    const restrictionMap = new Map<string, DietaryRestriction>();
    
    profiles.forEach(profile => {
      // Agregar restricciones activas
      profile.restrictions
        .filter(r => r.enabled)
        .forEach(r => {
          if (!restrictionMap.has(r.id)) {
            restrictionMap.set(r.id, r);
          } else {
            // Si ya existe, usar el nivel de severidad más alto
            const existing = restrictionMap.get(r.id)!;
            const existingSeverity = existing.severityLevel || 'moderado';
            const newSeverity = r.severityLevel || 'moderado';
            const severityOrder = { leve: 1, moderado: 2, severo: 3 };
            
            if (severityOrder[newSeverity] > severityOrder[existingSeverity]) {
              restrictionMap.set(r.id, { ...r, severityLevel: newSeverity });
            }
          }
        });
      
      // Agregar restricciones personalizadas únicas
      profile.customRestrictions.forEach(custom => {
        const normalized = custom.text.toLowerCase().trim();
        const existingIndex = allCustom.findIndex(existing => existing.text.toLowerCase() === normalized);
        
        if (existingIndex === -1) {
          allCustom.push(custom);
        } else {
          // Si ya existe, usar el nivel de severidad más alto
          const existing = allCustom[existingIndex];
          const severityOrder = { leve: 1, moderado: 2, severo: 3 };
          
          if (severityOrder[custom.severityLevel] > severityOrder[existing.severityLevel]) {
            allCustom[existingIndex] = custom;
          }
        }
      });
    });
    
    return {
      restrictions: Array.from(restrictionMap.values()),
      customRestrictions: allCustom
    };
  }

  // Detectar contexto de ingrediente en el texto del producto
  private static detectIngredientContext(
    productText: string, 
    keyword: string
  ): IngredientContext {
    const lowerText = productText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    const index = lowerText.indexOf(lowerKeyword);
    if (index === -1) {
      return { text: '', type: 'ambiguous', confidence: 'low' };
    }
    
    // Extraer contexto (50 caracteres antes y después)
    const start = Math.max(0, index - 50);
    const end = Math.min(lowerText.length, index + keyword.length + 50);
    const context = lowerText.substring(start, end);
    
    // Patrones de detección
    const tracePatterns = ['trazas de', 'traces of', 'contiene trazas', 'may contain traces'];
    const mayContainPatterns = ['puede contener', 'may contain', 'podría contener', 'posible presencia'];
    const crossContaminationPatterns = [
      'elaborado en', 'fabricado en', 'procesado en instalaciones', 
      'manufactured in a facility', 'processed in a facility'
    ];
    
    // Verificar patrones
    if (tracePatterns.some(p => context.includes(p))) {
      return { text: context, type: 'trace', confidence: 'high' };
    }
    
    if (mayContainPatterns.some(p => context.includes(p))) {
      return { text: context, type: 'may_contain', confidence: 'medium' };
    }
    
    if (crossContaminationPatterns.some(p => context.includes(p))) {
      return { text: context, type: 'cross_contamination', confidence: 'medium' };
    }
    
    // Si está en la lista de ingredientes directamente
    if (lowerText.includes('ingredientes:') && index > lowerText.indexOf('ingredientes:')) {
      return { text: context, type: 'direct', confidence: 'high' };
    }
    
    // Por defecto, asumir directo si no hay contexto claro
    return { text: context, type: 'direct', confidence: 'medium' };
  }
  
  // Determinar si una restricción viola según severidad
  private static shouldReject(
    context: IngredientContext,
    severityLevel: SeverityLevel
  ): boolean {
    switch (severityLevel) {
      case 'severo':
        // Rechazar TODO: directo, trazas, puede contener, contaminación cruzada
        return true;
        
      case 'moderado':
        // Rechazar: directo y trazas explícitas
        // Tolerar: "puede contener" y contaminación cruzada de bajo riesgo
        return context.type === 'direct' || context.type === 'trace';
        
      case 'leve':
        // Rechazar solo: ingredientes directos
        // Tolerar: trazas, puede contener, contaminación cruzada
        return context.type === 'direct';
        
      default:
        // Por seguridad, en caso ambiguo rechazar
        return context.confidence === 'low' ? true : context.type === 'direct';
    }
  }

  // Helper para etiquetas de contexto
  private static getContextLabel(type: IngredientContext['type']): string {
    switch (type) {
      case 'direct':
        return 'Contiene';
      case 'trace':
        return 'Trazas de';
      case 'may_contain':
        return 'Puede contener';
      case 'cross_contamination':
        return 'Procesado en instalaciones con';
      case 'ambiguous':
        return 'Posible mención de';
      default:
        return 'Contiene';
    }
  }

  // Método original para compatibilidad
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

    // Verificar restricciones predefinidas CON SEVERIDAD
    activeRestrictions.forEach(restriction => {
      const severityLevel = restriction.severityLevel || 'moderado';
      
      restriction.keywords.forEach(keyword => {
        const context = this.detectIngredientContext(productText, keyword);
        
        if (context.text && this.shouldReject(context, severityLevel)) {
          const contextLabel = this.getContextLabel(context.type);
          
          violations.push({
            restriction: restriction.name,
            reason: `${contextLabel}: ${keyword}`,
            severity: this.getSeverity(restriction.category)
          });
        } else if (context.text && context.type !== 'direct') {
          // Si no se rechaza pero hay mención indirecta, agregar warning
          const contextLabel = this.getContextLabel(context.type);
          warnings.push(
            `⚠️ ${restriction.name}: ${contextLabel} de "${keyword}" (nivel ${SEVERITY_LEVELS[severityLevel].label})`
          );
        }
      });
    });

    // Verificar restricciones personalizadas CON SEVERIDAD
    customRestrictions.forEach(customRestriction => {
      const keyword = typeof customRestriction === 'string' 
        ? customRestriction 
        : customRestriction.text;
      const severityLevel = typeof customRestriction === 'object'
        ? customRestriction.severityLevel
        : 'moderado';
      
      const context = this.detectIngredientContext(productText, keyword);
      
      if (context.text && this.shouldReject(context, severityLevel)) {
        const contextLabel = this.getContextLabel(context.type);
        
        violations.push({
          restriction: keyword,
          reason: `${contextLabel}: ${keyword}`,
          severity: 'medium'
        });
      } else if (context.text && context.type !== 'direct') {
        const contextLabel = this.getContextLabel(context.type);
        warnings.push(
          `⚠️ Restricción personalizada "${keyword}": ${contextLabel} (nivel ${SEVERITY_LEVELS[severityLevel].label})`
        );
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