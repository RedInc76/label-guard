import { DietaryRestriction } from '@/types/restrictions';

export const defaultRestrictions: DietaryRestriction[] = [
  // Alérgenos
  {
    id: 'gluten',
    name: 'Sin Gluten',
    description: 'Evita trigo, cebada, centeno y productos con gluten',
    category: 'allergens',
    keywords: ['gluten', 'wheat', 'barley', 'rye', 'triticale', 'trigo', 'cebada', 'centeno'],
    enabled: false
  },
  {
    id: 'lactose',
    name: 'Sin Lactosa',
    description: 'Evita productos lácteos y derivados',
    category: 'allergens',
    keywords: ['lactose', 'milk', 'dairy', 'lactosa', 'leche', 'lácteo'],
    enabled: false
  },
  {
    id: 'nuts',
    name: 'Sin Frutos Secos',
    description: 'Evita almendras, nueces, avellanas, etc.',
    category: 'allergens',
    keywords: ['nuts', 'almond', 'walnut', 'hazelnut', 'cashew', 'pistachio', 'frutos secos', 'almendra', 'nuez'],
    enabled: false
  },
  {
    id: 'soy',
    name: 'Sin Soja',
    description: 'Evita soja y productos derivados',
    category: 'allergens',
    keywords: ['soy', 'soja', 'soybean', 'lecithin'],
    enabled: false
  },
  
  // Dietas
  {
    id: 'vegetarian',
    name: 'Vegetariano',
    description: 'No contiene carne ni pescado',
    category: 'dietary',
    keywords: ['meat', 'beef', 'pork', 'chicken', 'fish', 'seafood', 'carne', 'pollo', 'cerdo', 'pescado'],
    enabled: false
  },
  {
    id: 'vegan',
    name: 'Vegano',
    description: 'No contiene productos de origen animal',
    category: 'dietary',
    keywords: ['meat', 'dairy', 'egg', 'honey', 'gelatin', 'carne', 'lácteo', 'huevo', 'miel', 'gelatina'],
    enabled: false
  },
  
  // Salud
  {
    id: 'low_sugar',
    name: 'Bajo en Azúcar',
    description: 'Limita el contenido de azúcar',
    category: 'health',
    keywords: ['sugar', 'glucose', 'fructose', 'sucrose', 'azúcar', 'glucosa', 'fructosa', 'sacarosa'],
    enabled: false
  },
  {
    id: 'low_sodium',
    name: 'Bajo en Sodio',
    description: 'Limita el contenido de sal',
    category: 'health',
    keywords: ['sodium', 'salt', 'sodio', 'sal'],
    enabled: false
  },
  
  // Religioso
  {
    id: 'halal',
    name: 'Halal',
    description: 'Cumple con los requisitos halal',
    category: 'religious',
    keywords: ['pork', 'alcohol', 'cerdo', 'alcohol'],
    enabled: false
  },
  {
    id: 'kosher',
    name: 'Kosher',
    description: 'Cumple con los requisitos kosher',
    category: 'religious',
    keywords: ['pork', 'shellfish', 'cerdo', 'mariscos'],
    enabled: false
  }
];