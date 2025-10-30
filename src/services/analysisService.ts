import { ProductInfo, AnalysisResult, UserProfile, Profile, DietaryRestriction, SeverityLevel, SEVERITY_LEVELS } from '@/types/restrictions';
import { ProfileService } from './profileService';
import { loggingService } from './loggingService';

interface IngredientContext {
  text: string;
  type: 'direct' | 'trace' | 'may_contain' | 'cross_contamination' | 'ambiguous';
  confidence: 'high' | 'medium' | 'low';
}

// Palabras que NO deben considerarse como ingredientes cuando aparecen en nombres de productos
const KEYWORD_EXCEPTIONS = [
  'perrier', 'salud', 'natural', 'mineral', 'source', 'salvador', 'salada', 'ensalada',
  'sugar', 'azúcar', 'free', 'sin', 'zero', 'bajo', 'low', 'light', 'diet', 'dieta', 'reduced', 'reducido'
];

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
    });
    
    return {
      restrictions: Array.from(restrictionMap.values())
    };
  }

  // Detectar contexto de ingrediente en el texto del producto
  private static detectIngredientContext(
    productText: string, 
    keyword: string,
    product: ProductInfo,
    restrictionId?: string
  ): IngredientContext {
    const lowerText = productText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    // SPECIAL CASE: Para restricciones de sal y azúcar, solo buscar en ingredients_text y allergens
    // NO buscar en product_name ni brands para evitar falsos positivos
    const isSaltRelated = restrictionId === 'low_sodium' || 
                         lowerKeyword.includes('salt') || 
                         lowerKeyword.includes('sodium') ||
                         lowerKeyword.includes('sal') ||
                         lowerKeyword.includes('sodio');
    
    const isSugarRelated = restrictionId === 'low_sugar' || 
                          restrictionId === 'no_added_sugar' ||
                          lowerKeyword.includes('sugar') ||
                          lowerKeyword.includes('azúcar') ||
                          lowerKeyword.includes('azucar');
    
    let searchText = lowerText;
    if (isSaltRelated || isSugarRelated) {
      // Solo buscar en ingredientes y alérgenos
      searchText = [product.ingredients_text, product.allergens].join(' ').toLowerCase();
      
      // Verificar excepciones: si la palabra aparece en el nombre del producto pero no en ingredientes
      const productNameLower = (product.product_name || '').toLowerCase();
      const brandsLower = (product.brands || '').toLowerCase();
      const hasInName = productNameLower.includes(lowerKeyword) || brandsLower.includes(lowerKeyword);
      
      if (hasInName && !searchText.includes(lowerKeyword)) {
        // Verificar si es una excepción conocida (ej: "SAL" en "PERRIER", "SUGAR" en "SUGAR FREE")
        const isException = KEYWORD_EXCEPTIONS.some(exc => 
          productNameLower.includes(exc) || brandsLower.includes(exc)
        );
        
        if (isException) {
          console.log('[AnalysisService] Excepción de keyword detectada:', {
            keyword: lowerKeyword,
            restrictionId,
            productName: product.product_name,
            brands: product.brands,
            reason: 'Palabra parte del nombre del producto, no un ingrediente'
          });
          return { text: '', type: 'ambiguous', confidence: 'low' };
        }
      }
      
      // SPECIAL CASE: Productos declarados "sin azúcar añadido" o "sugar free" en el nombre
      if (isSugarRelated &&
          (productNameLower.includes('sin azúcar') ||
           productNameLower.includes('sin azucar') ||
           productNameLower.includes('sugar free') ||
           productNameLower.includes('zero sugar') ||
           productNameLower.includes('zero') ||
           productNameLower.includes('0%') ||
           productNameLower.includes('light'))) {
        console.log('🍬 [AnalysisService] Producto declarado sin/bajo azúcar en nombre:', {
          productName: product.product_name,
          reason: 'Producto sin azúcar añadido, no marcar violación'
        });
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
      
      // SPECIAL CASE: Agua mineral sin ingredientes listados
      const isWater = productNameLower.includes('water') || 
                     productNameLower.includes('agua') ||
                     productNameLower.includes('mineral');
      const noIngredients = !product.ingredients_text || product.ingredients_text.trim().length < 10;
      
      if (isWater && noIngredients) {
        console.log('[AnalysisService] Agua mineral detectada sin ingredientes:', {
          productName: product.product_name,
          hasIngredientsText: !!product.ingredients_text,
          ingredientsLength: product.ingredients_text?.length || 0,
          reason: 'Sodio natural del agua mineral, no sal añadida'
        });
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
      
      // SPECIAL CASE: Jugos/frutas 100% naturales con azúcares naturales
      const isNaturalProduct = productNameLower.includes('100%') ||
                              productNameLower.includes('natural');
      const isFruitJuice = productNameLower.includes('juice') ||
                          productNameLower.includes('jugo') ||
                          productNameLower.includes('fruta') ||
                          productNameLower.includes('fruit');
      
      if (isSugarRelated && isNaturalProduct && isFruitJuice && noIngredients) {
        console.log('🍊 [AnalysisService] Producto natural con azúcares naturales:', {
          productName: product.product_name,
          reason: 'Azúcares naturales de fruta, no azúcar añadido'
        });
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
    }
    
    const index = searchText.indexOf(lowerKeyword);
    if (index === -1) {
      return { text: '', type: 'ambiguous', confidence: 'low' };
    }
    
    // Extraer contexto (50 caracteres antes y después)
    const start = Math.max(0, index - 50);
    const end = Math.min(searchText.length, index + keyword.length + 50);
    const context = searchText.substring(start, end);
    
    console.log('[AnalysisService] Contexto detectado:', {
      keyword: lowerKeyword,
      restrictionId,
      context,
      productName: product.product_name,
      searchInIngredientsOnly: isSaltRelated
    });
    
    // Patrones negativos - VERIFICAR PRIMERO para evitar falsos positivos
    // Indicadores de AUSENCIA del ingrediente
    const negativePatterns = [
      'no contiene',
      'libre de',
      'sin ',
      'free from',
      'does not contain',
      'gluten free',
      'dairy free',
      'nut free',
      'egg free',
      'soy free',
      'lactose free',
      'sugar free',
      'salt free',
      'sodium free',
      'peanut free',
      'shellfish free',
      'fish free',
      'wheat free',
      'free of',
      'without',
      'not contain',
      'no added'
    ];

    // Verificar si el keyword aparece en un contexto negativo
    const hasNegativeContext = negativePatterns.some(pattern => {
      const patternIndex = context.indexOf(pattern);
      if (patternIndex === -1) return false;
      
      // Verificar que el keyword esté cerca del patrón negativo (dentro de 30 caracteres)
      const keywordInContext = context.indexOf(lowerKeyword, patternIndex);
      const distance = keywordInContext - patternIndex;
      
      return distance >= 0 && distance <= 30;
    });

    if (hasNegativeContext) {
      console.log('✅ [AnalysisService] Patrón negativo detectado:', {
        keyword: lowerKeyword,
        context,
        reason: 'Producto declara NO contener el ingrediente'
      });
      return { text: context, type: 'ambiguous', confidence: 'low' };
    }
    
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
    if (searchText.includes('ingredientes:') && index > searchText.indexOf('ingredientes:')) {
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
    // NUNCA rechazar contextos ambiguos (ej: "NO CONTIENE", "LIBRE DE")
    if (context.type === 'ambiguous') {
      return false;
    }
    
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
        // Por defecto, solo rechazar ingredientes directos
        return context.type === 'direct';
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

    // Combinar todo el texto para análisis
    const productText = [
      product.ingredients_text,
      product.allergens,
      product.product_name,
      product.brands
    ].join(' ').toLowerCase();

    // Verificar restricciones predefinidas
    activeRestrictions.forEach(restriction => {
      // Check if restriction supports severity levels
      const supportsSeverity = restriction.supportsSeverity === true;
      const severityLevel = restriction.severityLevel || 'moderado';
      
      restriction.keywords.forEach(keyword => {
        const context = this.detectIngredientContext(productText, keyword, product, restriction.id);
        
        if (supportsSeverity) {
          // Restricciones CON severidad: usar lógica avanzada de contexto
          if (context.text && this.shouldReject(context, severityLevel)) {
            const contextLabel = this.getContextLabel(context.type);
            
            violations.push({
              restriction: restriction.name,
              reason: `${contextLabel}: ${keyword}`,
              severity: this.getSeverity(restriction.category),
              severityLevel: severityLevel
            });
          } else if (context.text && context.type !== 'direct') {
            // Si no se rechaza pero hay mención indirecta, agregar warning
            const contextLabel = this.getContextLabel(context.type);
            warnings.push(
              `⚠️ ${restriction.name}: ${contextLabel} de "${keyword}" (nivel ${SEVERITY_LEVELS[severityLevel].label})`
            );
          }
        } else {
          // Restricciones BINARIAS: detección simple de presencia
          if (context.text && context.type === 'direct') {
            violations.push({
              restriction: restriction.name,
              reason: `Contiene: ${keyword}`,
              severity: this.getSeverity(restriction.category)
            });
          }
        }
      });
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