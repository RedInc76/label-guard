import { supabase } from '@/integrations/supabase/client';

interface DailyBreakdown {
  date: string;
  ai: number;
  cache: number;
  openfoodfacts: number;
}

interface MostAnalyzedProduct {
  product_name: string;
  count: number;
}

interface UserStats {
  totalAIUses: number;
  totalCacheHits: number;
  totalOpenFoodFacts: number;
  totalCostUSD: number;
  totalSavingsUSD: number;
  mostAnalyzedProducts: MostAnalyzedProduct[];
  dailyBreakdown: DailyBreakdown[];
}

interface GlobalStats {
  totalUsers: number;
  totalAIAnalyses: number;
  totalCacheHits: number;
  totalOpenFoodFacts: number;
  cacheEfficiency: number;
  totalCostUSD: number;
  totalSavingsUSD: number;
}

interface AdminInsights {
  topUsersByAIUsage: Array<{ email: string; total_ai_uses: number; cost_usd: number }>;
  monthlyProjection: number;
  growthRate: number;
  avgCostPerUser: number;
  activeUsersLast30Days: number;
}

export class UsageAnalyticsService {
  private static readonly COSTS = {
    AI_ANALYSIS: 0.00014,
    CACHE_HIT: 0,
    OPENFOODFACTS: 0,
  };

  static async trackAIAnalysis(productName: string, barcode?: string): Promise<void> {
    await this.track('ai_analysis', productName, barcode, this.COSTS.AI_ANALYSIS);
  }

  static async trackCacheHit(productName: string, barcode?: string): Promise<void> {
    await this.track('cache_hit', productName, barcode, this.COSTS.CACHE_HIT);
  }

  static async trackOpenFoodFacts(productName: string, barcode: string): Promise<void> {
    await this.track('openfoodfacts', productName, barcode, this.COSTS.OPENFOODFACTS);
  }

  static async getUserStats(days: number = 30): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('usage_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const analytics = data || [];
    const totalAIUses = analytics.filter(a => a.event_type === 'ai_analysis').length;
    const totalCacheHits = analytics.filter(a => a.event_type === 'cache_hit').length;
    const totalOpenFoodFacts = analytics.filter(a => a.event_type === 'openfoodfacts').length;
    const totalCostUSD = analytics.reduce((sum, a) => sum + (Number(a.cost_usd) || 0), 0);
    const totalSavingsUSD = totalCacheHits * this.COSTS.AI_ANALYSIS;

    // Group by product
    const productCounts: Record<string, number> = {};
    analytics.forEach(a => {
      productCounts[a.product_name] = (productCounts[a.product_name] || 0) + 1;
    });

    const mostAnalyzedProducts = Object.entries(productCounts)
      .map(([product_name, count]) => ({ product_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily breakdown
    const dailyMap: Record<string, DailyBreakdown> = {};
    analytics.forEach(a => {
      const date = new Date(a.created_at).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { date, ai: 0, cache: 0, openfoodfacts: 0 };
      }
      if (a.event_type === 'ai_analysis') dailyMap[date].ai++;
      if (a.event_type === 'cache_hit') dailyMap[date].cache++;
      if (a.event_type === 'openfoodfacts') dailyMap[date].openfoodfacts++;
    });

    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalAIUses,
      totalCacheHits,
      totalOpenFoodFacts,
      totalCostUSD,
      totalSavingsUSD,
      mostAnalyzedProducts,
      dailyBreakdown,
    };
  }

  static async getGlobalStats(): Promise<GlobalStats> {
    const { data: analytics, error } = await supabase
      .from('usage_analytics')
      .select('*');

    if (error) throw error;

    const data = analytics || [];
    const totalAIAnalyses = data.filter(a => a.event_type === 'ai_analysis').length;
    const totalCacheHits = data.filter(a => a.event_type === 'cache_hit').length;
    const totalOpenFoodFacts = data.filter(a => a.event_type === 'openfoodfacts').length;
    const totalCostUSD = data.reduce((sum, a) => sum + (Number(a.cost_usd) || 0), 0);
    const totalSavingsUSD = totalCacheHits * this.COSTS.AI_ANALYSIS;
    const cacheEfficiency = totalCacheHits + totalAIAnalyses > 0 
      ? (totalCacheHits / (totalCacheHits + totalAIAnalyses)) * 100 
      : 0;

    const uniqueUsers = new Set(data.map(a => a.user_id)).size;

    return {
      totalUsers: uniqueUsers,
      totalAIAnalyses,
      totalCacheHits,
      totalOpenFoodFacts,
      cacheEfficiency,
      totalCostUSD,
      totalSavingsUSD,
    };
  }

  static async getAdminInsights(): Promise<AdminInsights> {
    const { data, error } = await supabase.functions.invoke('admin-insights');
    
    if (error) throw error;
    return data as AdminInsights;
  }

  private static async track(
    eventType: 'ai_analysis' | 'cache_hit' | 'openfoodfacts',
    productName: string,
    barcode: string | undefined,
    costUSD: number
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('usage_analytics').insert({
      user_id: user.id,
      event_type: eventType,
      product_name: productName,
      barcode: barcode || null,
      cost_usd: costUSD,
    });
  }
}
