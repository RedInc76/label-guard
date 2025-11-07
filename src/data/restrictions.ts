import { DietaryRestriction } from '@/types/restrictions';

export const defaultRestrictions: DietaryRestriction[] = [
  // Alérgenos (FREE)
  {
    id: 'gluten',
    name: 'Sin Gluten',
    description: 'Evita trigo, cebada, centeno y productos con gluten',
    category: 'allergens',
    keywords: ['gluten', 'wheat', 'barley', 'rye', 'triticale', 'trigo', 'cebada', 'centeno'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🌾'
  },
  {
    id: 'lactose',
    name: 'Sin Lactosa',
    description: 'Evita productos lácteos y derivados',
    category: 'allergens',
    keywords: ['lactose', 'milk', 'dairy', 'lactosa', 'leche', 'lácteo'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🥛'
  },
  {
    id: 'nuts',
    name: 'Sin Frutos Secos',
    description: 'Evita almendras, nueces, avellanas, etc.',
    category: 'allergens',
    keywords: ['nuts', 'almond', 'walnut', 'hazelnut', 'cashew', 'pistachio', 'frutos secos', 'almendra', 'nuez'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🥜'
  },
  {
    id: 'soy',
    name: 'Sin Soja',
    description: 'Evita soja y productos derivados',
    category: 'allergens',
    keywords: ['soy', 'soja', 'soybean', 'lecithin'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🫘'
  },
  {
    id: 'egg',
    name: 'Sin Huevo',
    description: 'Evita huevos y productos con huevo',
    category: 'allergens',
    keywords: ['egg', 'eggs', 'albumin', 'huevo', 'albúmina', 'ovoproteína', 'ovo'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🥚'
  },
  {
    id: 'fish',
    name: 'Sin Pescado',
    description: 'Evita pescado y derivados',
    category: 'allergens',
    keywords: ['fish', 'anchovy', 'salmon', 'tuna', 'cod', 'pescado', 'atún', 'salmón', 'anchoa', 'bacalao'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🐟'
  },
  {
    id: 'shellfish',
    name: 'Sin Mariscos',
    description: 'Evita mariscos y crustáceos',
    category: 'allergens',
    keywords: ['shellfish', 'shrimp', 'crab', 'lobster', 'prawn', 'marisco', 'camarón', 'cangrejo', 'langosta', 'gamba'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🦐'
  },
  {
    id: 'celery',
    name: 'Sin Apio',
    description: 'Evita apio y productos con apio',
    category: 'allergens',
    keywords: ['celery', 'celeriac', 'apio'],
    enabled: false,
    isFree: true,
    icon: '🥬'
  },
  {
    id: 'mustard',
    name: 'Sin Mostaza',
    description: 'Evita mostaza y productos con mostaza',
    category: 'allergens',
    keywords: ['mustard', 'mostaza'],
    enabled: false,
    isFree: true,
    icon: '🌭'
  },
  {
    id: 'sesame',
    name: 'Sin Sésamo',
    description: 'Evita sésamo y productos derivados',
    category: 'allergens',
    keywords: ['sesame', 'tahini', 'sésamo', 'ajonjolí'],
    enabled: false,
    isFree: true,
    supportsSeverity: true,
    icon: '🌰'
  },
  {
    id: 'sulfites',
    name: 'Sin Sulfitos',
    description: 'Evita sulfitos y conservantes con azufre',
    category: 'allergens',
    keywords: ['sulfite', 'sulfur dioxide', 'metabisulfite', 'sulfito', 'dióxido de azufre', 'E220', 'E221', 'E222'],
    enabled: false,
    isFree: true,
    icon: '🍷'
  },
  
  // Dietas (PREMIUM)
  {
    id: 'vegetarian',
    name: 'Vegetariano',
    description: 'No contiene carne ni pescado',
    category: 'dietary',
    keywords: ['meat', 'beef', 'pork', 'chicken', 'fish', 'seafood', 'carne', 'pollo', 'cerdo', 'pescado'],
    enabled: false,
    isFree: false,
    icon: '🥗'
  },
  {
    id: 'vegan',
    name: 'Vegano',
    description: 'No contiene productos de origen animal',
    category: 'dietary',
    keywords: ['meat', 'dairy', 'egg', 'honey', 'gelatin', 'carne', 'lácteo', 'huevo', 'miel', 'gelatina'],
    enabled: false,
    isFree: false,
    icon: '🌱'
  },
  {
    id: 'keto',
    name: 'Keto/Cetogénica',
    description: 'Evita carbohidratos y azúcares',
    category: 'dietary',
    keywords: ['sugar', 'bread', 'pasta', 'rice', 'potato', 'flour', 'azúcar', 'pan', 'pasta', 'arroz', 'patata', 'harina'],
    enabled: false,
    isFree: false,
    icon: '🥑'
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'Evita granos, lácteos y alimentos procesados',
    category: 'dietary',
    keywords: ['grain', 'dairy', 'legume', 'processed', 'grano', 'lácteo', 'legumbre', 'procesado', 'cereal'],
    enabled: false,
    isFree: false,
    icon: '🍖'
  },
  {
    id: 'no_added_sugar',
    name: 'Sin Azúcares Añadidos',
    description: 'Evita azúcares agregados artificialmente',
    category: 'dietary',
    keywords: [
      'added sugar', 'added sugars',
      'high fructose corn syrup',
      'syrup',
      'azúcar añadido', 'azúcares añadidos', 'azucar añadido', 'azucares añadidos',
      'azúcar agregado', 'azúcares agregados', 'azucar agregado', 'azucares agregados',
      'jarabe de maíz', 'jarabe'
    ],
    enabled: false,
    isFree: false,
    icon: '🚫'
  },
  
  // Salud (PREMIUM)
  {
    id: 'low_sugar',
    name: 'Bajo en Azúcar',
    description: 'Limita el contenido de azúcar',
    category: 'health',
    keywords: ['sugar', 'glucose', 'fructose', 'sucrose', 'azúcar', 'glucosa', 'fructosa', 'sacarosa'],
    enabled: false,
    isFree: false,
    icon: '🍬'
  },
  {
    id: 'low_sodium',
    name: 'Bajo en Sodio',
    description: 'Limita el contenido de sal añadida',
    category: 'health',
    keywords: ['sodium chloride', 'table salt', 'sea salt', 'sal añadida', 'sal de mesa', 'cloruro de sodio', 'added salt', 'salt added', 'sal común'],
    enabled: false,
    isFree: false,
    icon: '🧂'
  },
  {
    id: 'low_saturated_fat',
    name: 'Bajo en Grasas Saturadas',
    description: 'Limita grasas saturadas para salud cardiovascular',
    category: 'health',
    keywords: ['saturated fat', 'palm oil', 'coconut oil', 'grasa saturada', 'aceite de palma', 'aceite de coco'],
    enabled: false,
    isFree: false,
    icon: '🫒'
  },
  {
    id: 'no_trans_fat',
    name: 'Sin Grasas Trans',
    description: 'Evita grasas trans y aceites hidrogenados',
    category: 'health',
    keywords: ['trans fat', 'partially hydrogenated', 'grasa trans', 'hidrogenado', 'hydrogenated oil'],
    enabled: false,
    isFree: false,
    icon: '⛔'
  },
  {
    id: 'no_preservatives',
    name: 'Sin Conservantes',
    description: 'Evita conservantes artificiales',
    category: 'health',
    keywords: ['preservative', 'E200', 'E201', 'E202', 'benzoate', 'sorbate', 'conservante', 'benzoato', 'sorbato'],
    enabled: false,
    isFree: false,
    icon: '🔬'
  },
  {
    id: 'no_artificial_colors',
    name: 'Sin Colorantes Artificiales',
    description: 'Evita colorantes artificiales y sintéticos',
    category: 'health',
    keywords: ['artificial color', 'E100', 'E102', 'tartrazine', 'colorante artificial', 'tartrazina', 'colorante sintético'],
    enabled: false,
    isFree: false,
    icon: '🎨'
  },
  {
    id: 'no_artificial_sweeteners',
    name: 'Sin Edulcorantes Artificiales',
    description: 'Evita edulcorantes artificiales',
    category: 'health',
    keywords: ['aspartame', 'sucralose', 'saccharin', 'acesulfame', 'edulcorante artificial', 'E950', 'E951'],
    enabled: false,
    isFree: false,
    icon: '🧃'
  },
  {
    id: 'no_alcohol',
    name: 'Sin Alcohol',
    description: 'Evita bebidas y productos con alcohol',
    category: 'health',
    keywords: ['alcohol', 'ethanol', 'ethyl alcohol', 'alcoholic', 'etanol', 'bebida alcohólica'],
    enabled: false,
    isFree: false,
    icon: '🍺'
  },
  {
    id: 'no_msg',
    name: 'Sin Glutamato Monosódico',
    description: 'Evita MSG y potenciadores de sabor',
    category: 'health',
    keywords: ['MSG', 'monosodium glutamate', 'E621', 'glutamato monosódico', 'glutamato', 'ajinomoto'],
    enabled: false,
    isFree: false,
    icon: '🧂'
  },
  {
    id: 'no_nitrates',
    name: 'Sin Nitratos/Nitritos',
    description: 'Evita conservantes en carnes procesadas',
    category: 'health',
    keywords: ['nitrate', 'nitrite', 'E249', 'E250', 'E251', 'E252', 'nitrato', 'nitrito', 'sodium nitrite'],
    enabled: false,
    isFree: false,
    icon: '🥩'
  },
  {
    id: 'no_bha_bht',
    name: 'Sin BHA/BHT',
    description: 'Evita antioxidantes sintéticos',
    category: 'health',
    keywords: ['BHA', 'BHT', 'E320', 'E321', 'butylated hydroxyanisole', 'butylated hydroxytoluene'],
    enabled: false,
    isFree: false,
    icon: '🧪'
  },
  {
    id: 'no_carrageenan',
    name: 'Sin Carragenina',
    description: 'Evita este espesante controversial',
    category: 'health',
    keywords: ['carrageenan', 'E407', 'carragenina', 'carragenano'],
    enabled: false,
    isFree: false,
    icon: '🌊'
  },
  
  // Religioso (PREMIUM)
  {
    id: 'halal',
    name: 'Halal',
    description: 'Cumple con los requisitos halal',
    category: 'religious',
    keywords: ['pork', 'alcohol', 'cerdo', 'alcohol'],
    enabled: false,
    isFree: false,
    supportsSeverity: true,
    icon: '☪️'
  },
  {
    id: 'kosher',
    name: 'Kosher',
    description: 'Cumple con los requisitos kosher',
    category: 'religious',
    keywords: ['pork', 'shellfish', 'cerdo', 'mariscos'],
    enabled: false,
    isFree: false,
    supportsSeverity: true,
    icon: '✡️'
  },
  {
    id: 'no_pork',
    name: 'Sin Cerdo',
    description: 'Evita carne de cerdo y derivados',
    category: 'religious',
    keywords: ['pork', 'pig', 'bacon', 'ham', 'lard', 'cerdo', 'tocino', 'jamón', 'manteca', 'panceta'],
    enabled: false,
    isFree: false,
    supportsSeverity: true,
    icon: '🐖'
  }
];
