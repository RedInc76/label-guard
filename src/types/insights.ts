import { ScanHistoryItem } from '@/services/historyService';

export interface InsightsData {
  totalScans: number;
  compatibleScans: number;
  incompatibleScans: number;
  compatibilityRate: number;
  avgScore: number;
  topProducts: {
    count: number;
    item: ScanHistoryItem;
  }[];
  topViolations: {
    name: string;
    count: number;
  }[];
  dailyScans: Record<string, number>;
  usageStats: {
    totalAnalyses: number;
    aiAnalyses: number;
    cacheAnalyses: number;
    openFoodFactsAnalyses: number;
    estimatedCost: number;
    cacheSavings: number;
    cacheEfficiency: number;
  };
}

export interface ComparisonResult {
  products: ScanHistoryItem[];
  differences: {
    bestScore: string;
    worstScore: string;
    mostCompatible: string[];
    uniqueViolations: Record<string, string[]>;
  };
}
