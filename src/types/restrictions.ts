// Nivel de severidad de restricciones
export type SeverityLevel = 'leve' | 'moderado' | 'severo';

// Información de cada nivel de severidad
export interface SeverityInfo {
  level: SeverityLevel;
  label: string;
  description: string;
  icon: string;
  color: string;
}

// Constantes de niveles de severidad
export const SEVERITY_LEVELS: Record<SeverityLevel, SeverityInfo> = {
  leve: {
    level: 'leve',
    label: 'Leve',
    description: 'Tolera trazas y menciones indirectas (ej: "puede contener")',
    icon: '🟢',
    color: 'text-green-600'
  },
  moderado: {
    level: 'moderado',
    label: 'Moderado',
    description: 'Estándar - rechaza ingredientes directos y trazas explícitas',
    icon: '🟡',
    color: 'text-yellow-600'
  },
  severo: {
    level: 'severo',
    label: 'Severo',
    description: 'Crítico - rechaza cualquier mención, incluso procesamiento cruzado',
    icon: '🔴',
    color: 'text-red-600'
  }
};

export interface DietaryRestriction {
  id: string;
  name: string;
  description: string;
  category: 'allergens' | 'dietary' | 'health' | 'religious';
  keywords: string[];
  enabled: boolean;
  isFree?: boolean; // true for FREE mode restrictions (allergens only)
  severityLevel?: SeverityLevel;
  supportsSeverity?: boolean; // true only for restrictions that can detect traces/derivatives
}

export interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  restrictions: DietaryRestriction[];
  createdAt: string;
}

export interface ProfileSystem {
  profiles: Profile[];
  version: string;
}

// Legacy interface for migration
export interface UserProfile {
  restrictions: DietaryRestriction[];
}

export interface ProductInfo {
  code: string;
  product_name: string;
  brands: string;
  ingredients_text: string;
  allergens: string;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  image_url?: string;
}

export interface AnalysisResult {
  isCompatible: boolean;
  violations: {
    restriction: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    severityLevel?: SeverityLevel; // Nivel de severidad real del perfil
  }[];
  warnings: string[];
  score: number;
}