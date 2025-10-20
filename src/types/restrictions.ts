export interface DietaryRestriction {
  id: string;
  name: string;
  description: string;
  category: 'allergens' | 'dietary' | 'health' | 'religious';
  keywords: string[];
  enabled: boolean;
}

export interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  restrictions: DietaryRestriction[];
  customRestrictions: string[];
  createdAt: string;
}

export interface ProfileSystem {
  profiles: Profile[];
  version: string;
}

// Legacy interface for migration
export interface UserProfile {
  restrictions: DietaryRestriction[];
  customRestrictions: string[];
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
  }[];
  warnings: string[];
  score: number;
}