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
    // Normalizar texto: remover puntos y espacios redundantes que vienen de OCR/IA
    // Ej: "P. U. E. D. E. . C. O. N. T. E. N. E. R." -> "puede contener"
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/([a-z])\.\s+/gi, '$1') // "P. U. E. D. E." -> "puede"
        .replace(/\s+/g, ' ') // múltiples espacios -> un espacio
        .trim();
    };
    
    // Escapar caracteres especiales de regex
    const escapeRegex = (str: string): string => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Crear patrón fuzzy tolerante a OCR fragmentado: "gluten" -> "g[\s.\-_/]*l[\s.\-_/]*u..."
    const makeFuzzy = (word: string): string => {
      return word.split('').map(char => 
        escapeRegex(char) + '[\\s.\\-_/]*'
      ).join('').slice(0, -'[\\s.\\-_/]*'.length);
    };
    
    // Colapsar texto eliminando todos los separadores para detección extrema
    const makeCollapsed = (str: string): string => {
      return str.replace(/[\s.\-_/,]/g, '');
    };
    
    // Separar y normalizar textos de ingredientes y alérgenos
    const ingredientsLower = normalizeText(product.ingredients_text || '');
    const allergensLower = normalizeText(product.allergens || '');
    const productNameLower = normalizeText(product.product_name || '');
    const brandsLower = normalizeText(product.brands || '');
    const combinedLower = ingredientsLower + ' ' + allergensLower;
    const combinedCollapsed = makeCollapsed(combinedLower);
    const allergensCollapsed = makeCollapsed(allergensLower);
    
    const lowerKeyword = keyword.toLowerCase();
    const escapedKeyword = escapeRegex(lowerKeyword);
    const fuzzyKeyword = makeFuzzy(lowerKeyword);
    const collapsedKeyword = makeCollapsed(lowerKeyword);
    
    // SPECIAL CASE: Para restricciones de sal y azúcar, solo buscar en ingredients_text y allergens
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
    
    let searchText = combinedLower;
    if (isSaltRelated || isSugarRelated) {
      searchText = combinedLower;
      
      // Verificar excepciones: si la palabra aparece en el nombre del producto pero no en ingredientes
      const hasInName = productNameLower.includes(lowerKeyword) || brandsLower.includes(lowerKeyword);
      
      if (hasInName && !searchText.includes(lowerKeyword)) {
        const isException = KEYWORD_EXCEPTIONS.some(exc => 
          productNameLower.includes(exc) || brandsLower.includes(exc)
        );
        
        if (isException) {
          console.log('[AnalysisService] Excepción de keyword detectada:', {
            keyword: lowerKeyword,
            restrictionId,
            productName: product.product_name,
            reason: 'Palabra parte del nombre del producto'
          });
          return { text: '', type: 'ambiguous', confidence: 'low' };
        }
      }
      
      // SPECIAL CASE: Productos "sin azúcar añadido" o "sugar free"
      if (isSugarRelated &&
          (productNameLower.includes('sin azúcar') ||
           productNameLower.includes('sin azucar') ||
           productNameLower.includes('sugar free') ||
           productNameLower.includes('zero sugar') ||
           productNameLower.includes('zero') ||
           productNameLower.includes('0%') ||
           productNameLower.includes('light'))) {
        console.log('🍬 [AnalysisService] Producto sin/bajo azúcar:', productNameLower);
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
      
      // SPECIAL CASE: Agua mineral
      const isWater = productNameLower.includes('water') || 
                     productNameLower.includes('agua') ||
                     productNameLower.includes('mineral');
      const noIngredients = !product.ingredients_text || product.ingredients_text.trim().length < 10;
      
      if (isWater && noIngredients) {
        console.log('[AnalysisService] Agua mineral sin ingredientes:', productNameLower);
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
      
      // SPECIAL CASE: Jugos 100% naturales
      const isNaturalProduct = productNameLower.includes('100%') || productNameLower.includes('natural');
      const isFruitJuice = productNameLower.includes('juice') || productNameLower.includes('jugo') ||
                           productNameLower.includes('fruta') || productNameLower.includes('fruit');
      
      if (isSugarRelated && isNaturalProduct && isFruitJuice && noIngredients) {
        console.log('🍊 [AnalysisService] Producto natural con azúcares naturales:', productNameLower);
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
    }
    
    const index = searchText.indexOf(lowerKeyword);
    if (index === -1) {
      return { text: '', type: 'ambiguous', confidence: 'low' };
    }
    
    // Extraer contexto MÁS AMPLIO (150 caracteres antes y después para tolerar OCR)
    const start = Math.max(0, index - 150);
    const end = Math.min(searchText.length, index + keyword.length + 150);
    const context = searchText.substring(start, end);
    
    // ========== PASO 1: VERIFICAR PATRONES NEGATIVOS ESPECÍFICOS PRIMERO ==========
    const negativePatterns = [
      // Patrones directos
      `sin\\s*${fuzzyKeyword}`,
      `libre\\s*de\\s*${fuzzyKeyword}`,
      `free\\s*of\\s*${fuzzyKeyword}`,
      `without\\s*${fuzzyKeyword}`,
      `${fuzzyKeyword}\\s*free`,
      
      // Patrones con "contiene" (corrección del bug principal)
      `no\\s*contiene\\s*${fuzzyKeyword}`,
      `does\\s*not\\s*contain\\s*${fuzzyKeyword}`,
      `sin\\s*contenido\\s*de\\s*${fuzzyKeyword}`,
      
      // Patrones con "naturaleza"
      `por\\s*naturaleza\\s*no\\s*contiene\\s*${fuzzyKeyword}`,
      `por\\s*su\\s*naturaleza\\s*no\\s*contiene\\s*${fuzzyKeyword}`,
      `naturally\\s*${fuzzyKeyword}\\s*free`,
      
      // Patrones con "alérgenos"
      `no\\s*contiene\\s*alergen[osa]*\\s*${fuzzyKeyword}`,
      `allergens?\\s*[:-]?\\s*no\\s*${fuzzyKeyword}`,
      `allergens?\\s*[:-]?\\s*does\\s*not\\s*contain\\s*${fuzzyKeyword}`,
      
      // Casos especiales
      `0%\\s*${fuzzyKeyword}`,
      `cero\\s*${fuzzyKeyword}`,
      `exento\\s*de\\s*${fuzzyKeyword}`,
      `exempt\\s*from\\s*${fuzzyKeyword}`
    ];

    const hasNegativeContext = negativePatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(combinedLower);
    });

    if (hasNegativeContext) {
      console.log('✅ [AnalysisService] Patrón negativo detectado:', { keyword: lowerKeyword });
      return { text: '', type: 'ambiguous', confidence: 'low' };
    }
    
    // ========== PASO 2: PRESENCIA EN INGREDIENTES (PRIORIDAD MÁXIMA) ==========
    // TODO lo que aparece en la lista de INGREDIENTES es lo que el producto CONTIENE
    const isInIngredientsFuzzy = new RegExp(fuzzyKeyword, 'i').test(ingredientsLower);
    const isInIngredientsCollapsed = makeCollapsed(ingredientsLower).includes(collapsedKeyword);
    
    if (isInIngredientsFuzzy || isInIngredientsCollapsed) {
      console.log('🔍 [AnalysisService] DIRECTO en ingredients:', { 
        keyword: lowerKeyword,
        ingredientsPreview: ingredientsLower.substring(0, 100)
      });
      return { text: ingredientsLower.substring(0, 200), type: 'direct', confidence: 'high' };
    }
    
    // ========== PASO 2.5: VERIFICACIÓN ESPECÍFICA DE ALLERGENS CON NEGACIONES ==========
    // Antes de verificar presencia directa en allergens, confirmar que NO sea una negación explícita
    const allergenNegationPatterns = [
      /no\s+contiene/i,
      /does\s+not\s+contain/i,
      /free\s+of/i,
      /sin\s+contenido/i,
      /libre\s+de/i,
      /por\s+naturaleza\s+no/i,
      /naturally.*free/i,
      /0%/,
      /exento/i
    ];
    
    const hasAllergenNegation = allergenNegationPatterns.some(pattern => 
      pattern.test(allergensLower)
    );
    
    if (hasAllergenNegation) {
      // Verificar que la negación esté relacionada con el keyword específico
      const negationWithKeyword = allergenNegationPatterns.some(pattern => {
        const match = allergensLower.match(pattern);
        if (match) {
          const negationIndex = match.index!;
          const keywordIndex = allergensLower.indexOf(lowerKeyword);
          // La negación debe estar cerca del keyword (dentro de 50 caracteres)
          return keywordIndex !== -1 && Math.abs(negationIndex - keywordIndex) < 50;
        }
        return false;
      });
      
      if (negationWithKeyword) {
        console.log('✅ [AnalysisService] Negación detectada en allergens:', { 
          keyword: lowerKeyword,
          allergensText: allergensLower.substring(0, 100)
        });
        return { text: '', type: 'ambiguous', confidence: 'low' };
      }
    }
    
    // ========== PASO 3: DETECCIÓN DIRECTA EN ALLERGENS (sin "puede contener") ==========
    // Presencia en allergens sin "puede contener" = es directo (ej: "Contiene: gluten")
    const puedeContenerFuzzy = makeFuzzy('puede contener');
    const mayContainFuzzy = makeFuzzy('may contain');
    const trazasFuzzy = makeFuzzy('trazas');
    
    const hasPuedeContenerInAllergens = new RegExp(puedeContenerFuzzy, 'i').test(allergensLower) ||
                                        /puedecontener|maycontain/i.test(allergensCollapsed);
    const hasTrazasInAllergens = new RegExp(trazasFuzzy, 'i').test(allergensLower) ||
                                 /trazas|traces/i.test(allergensCollapsed);
    
    const keywordInAllergensFuzzy = new RegExp(fuzzyKeyword, 'i').test(allergensLower);
    const keywordInAllergensCollapsed = allergensCollapsed.includes(collapsedKeyword);
    
    const isInAllergensDirect = (keywordInAllergensFuzzy || keywordInAllergensCollapsed) && 
                                !hasPuedeContenerInAllergens && 
                                !hasTrazasInAllergens;
    
    if (isInAllergensDirect) {
      console.log('🔍 [AnalysisService] DIRECTO en allergens (sin puede contener):', { 
        keyword: lowerKeyword,
        allergensPreview: allergensLower.substring(0, 100),
        hasPuedeContener: hasPuedeContenerInAllergens,
        hasTrazas: hasTrazasInAllergens,
        allergensFullText: allergensLower
      });
      return { text: allergensLower.substring(0, 200), type: 'direct', confidence: 'high' };
    }
    
    // ========== PASO 4: DETECCIÓN DE "PUEDE CONTENER" / "TRAZAS" EN ALLERGENS ==========
    // SI hay "puede contener" o "trazas" en allergens Y el keyword está presente en allergens
    if ((hasPuedeContenerInAllergens || hasTrazasInAllergens) && 
        (keywordInAllergensFuzzy || keywordInAllergensCollapsed)) {
      
      const contextType = hasTrazasInAllergens ? 'trace' : 'may_contain';
      console.log(`🔍 [AnalysisService] ${contextType.toUpperCase()} detectado en allergens:`, {
        keyword: lowerKeyword,
        hasPuedeContener: hasPuedeContenerInAllergens,
        hasTrazas: hasTrazasInAllergens,
        keywordFound: keywordInAllergensFuzzy || keywordInAllergensCollapsed,
        allergensPreview: allergensLower.substring(0, 150)
      });
      
      return { 
        text: allergensLower.substring(0, 200), 
        type: contextType, 
        confidence: 'high' 
      };
    }
    
    // ========== PASO 5: CONTAMINACIÓN CRUZADA ==========
    const crossContaminationPatterns = [
      'elaborado en', 'fabricado en', 'procesado en instalaciones',
      'manufactured in a facility', 'processed in a facility',
      'hecho en una fábrica que', 'hecho en una planta que',
      'puede elaborarse en una planta que procesa',
      'producido en instalaciones donde se manipula'
    ];
    
    const hasCrossContamination = crossContaminationPatterns.some(p => combinedLower.includes(p));
    if (hasCrossContamination && (new RegExp(fuzzyKeyword, 'i').test(combinedLower))) {
      console.log('🔍 [AnalysisService] CONTAMINACIÓN CRUZADA detectada:', { keyword: lowerKeyword });
      return { text: combinedLower.substring(0, 200), type: 'cross_contamination', confidence: 'medium' };
    }
    
    // ========== PASO 6: DEFAULT A AMBIGUOUS ==========
    console.log('🔍 [AnalysisService] Contexto AMBIGUO (no clasificado):', { 
      keyword: lowerKeyword,
      foundInCombined: combinedLower.includes(lowerKeyword)
    });
    return { text: '', type: 'ambiguous', confidence: 'low' };
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

  // Obtener prioridad numérica del tipo de contexto (menor = más grave)
  private static getContextPriority(violation: AnalysisResult['violations'][0]): number {
    const reason = violation.reason.toLowerCase();
    
    if (reason.startsWith('contiene:')) {
      return 1; // Ingrediente directo - MÁXIMA PRIORIDAD
    } else if (reason.startsWith('trazas de:')) {
      return 2; // Trazas explícitas
    } else if (reason.startsWith('puede contener:')) {
      return 3; // Puede contener
    } else if (reason.startsWith('procesado en instalaciones con:')) {
      return 4; // Contaminación cruzada
    } else {
      return 5; // Otros casos ambiguos
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
          } else if (context.text && context.type !== 'direct' && context.type !== 'ambiguous') {
            // Si no se rechaza pero hay mención indirecta (trazas, puede contener), agregar warning
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

    // Ordenar violaciones por prioridad de contexto y severidad
    violations.sort((a, b) => {
      const priorityA = this.getContextPriority(a);
      const priorityB = this.getContextPriority(b);
      
      // Si tienen diferente prioridad de contexto, ordenar por eso
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Si tienen la misma prioridad de contexto, ordenar por severidad de categoría
      const severityOrder = { high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
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