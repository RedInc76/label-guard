// Diccionario CONSERVADOR de ingredientes comunes en español
// Solo incluye palabras con alta probabilidad de confusión por OCR
const COMMON_INGREDIENTS_ES = [
  // Harinas y cereales (errores comunes: HARMA, TRICO, MAIZ con I en vez de Í)
  'harina', 'trigo', 'maiz', 'avena', 'arroz', 'centeno', 'cebada',
  'gluten', 'salvado', 'germen',
  
  // Lácteos (errores: LECHE con E mal leída, LACTMA)
  'leche', 'lactosa', 'suero', 'crema', 'mantequilla', 'queso',
  'yogur', 'caseina', 'lactosuero',
  
  // Proteínas (errores: FUEVO, ALBUMMA)
  'huevo', 'albumina', 'yema', 'clara',
  
  // Legumbres y frutos secos (errores: SOVA, CACAFUATE)
  'soya', 'soja', 'cacahuate', 'cacahuete', 'mani', 'almendra',
  'nuez', 'avellana', 'pistacho', 'anacardo', 'lenteja', 'garbanzo',
  
  // Grasas y aceites
  'aceite', 'grasa', 'margarina', 'manteca',
  
  // Azúcares (errores: AZUCAR mal escrito)
  'azucar', 'glucosa', 'fructosa', 'sacarosa', 'maltosa',
  'jarabe', 'miel', 'melaza', 'dextrosa',
  
  // Aditivos comunes (errores: LECITMA)
  'lecitina', 'emulsionante', 'colorante', 'conservador',
  'antioxidante', 'espesante', 'gelificante',
  
  // Otros comunes
  'sal', 'agua', 'levadura', 'bicarbonato', 'vinagre',
  'canela', 'vainilla', 'chocolate', 'cacao'
];

// Palabras de alérgenos específicas
const ALLERGEN_KEYWORDS = [
  'contiene', 'puede', 'trazas', 'gluten', 'lactosa', 'huevo',
  'cacahuate', 'nuez', 'soya', 'pescado', 'marisco', 'sulfitos'
];

// Distancia de Levenshtein simplificada
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Función de corrección CONSERVADORA
export function correctOCRErrors(text: string, isAllergens: boolean = false): string {
  const dictionary = isAllergens 
    ? [...COMMON_INGREDIENTS_ES, ...ALLERGEN_KEYWORDS]
    : COMMON_INGREDIENTS_ES;
  
  // Separar por espacios y procesar cada palabra
  const words = text.split(/\s+/);
  
  const correctedWords = words.map(word => {
    // Solo procesar palabras de 4+ letras para evitar falsos positivos
    if (word.length < 4) return word;
    
    const cleanWord = word.toLowerCase().replace(/[^a-záéíóúñü]/g, '');
    
    // Solo corregir si NO es ya una palabra válida conocida
    if (dictionary.includes(cleanWord)) {
      return word; // Ya está correcta
    }
    
    let bestMatch = word;
    let minDistance = Infinity;
    
    for (const ingredient of dictionary) {
      const dist = levenshteinDistance(cleanWord, ingredient);
      
      // CONSERVADOR: Solo corregir si la distancia es ≤ 1 (un solo error)
      if (dist === 1 && dist < minDistance) {
        minDistance = dist;
        bestMatch = ingredient;
      }
    }
    
    // Log solo si hubo corrección
    if (bestMatch !== word && minDistance === 1) {
      console.log(`🔧 OCR Correction: "${word}" → "${bestMatch}" (dist: ${minDistance})`);
    }
    
    return bestMatch === word ? word : bestMatch;
  });
  
  return correctedWords.join(' ');
}
