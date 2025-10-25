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
    const { data: analytics, error } = await supabase
      .from('usage_analytics')
      .select('*');

    if (error) throw error;

    const data = analytics || [];

    // Top users by AI usage
    const userAIUsage: Record<string, { total_ai_uses: number; cost_usd: number }> = {};
    for (const record of data) {
      if (record.event_type === 'ai_analysis') {
        if (!userAIUsage[record.user_id]) {
          userAIUsage[record.user_id] = { total_ai_uses: 0, cost_usd: 0 };
        }
        userAIUsage[record.user_id].total_ai_uses++;
        userAIUsage[record.user_id].cost_usd += Number(record.cost_usd) || 0;
      }
    }

    const topUsersData = await Promise.all(
      Object.entries(userAIUsage)
        .sort((a, b) => b[1].total_ai_uses - a[1].total_ai_uses)
        .slice(0, 10)
        .map(async ([userId, stats]) => {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          return {
            email: userData?.user?.email || 'Unknown',
            total_ai_uses: stats.total_ai_uses,
            cost_usd: stats.cost_usd,
          };
        })
    );

    // Monthly projection
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthData = data.filter(a => new Date(a.created_at) >= monthStart);
    const daysElapsed = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyProjection = monthData.reduce((sum, a) => sum + (Number(a.cost_usd) || 0), 0) * (daysInMonth / daysElapsed);

    // Growth rate (last 30 days vs previous 30 days)
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const last60 = new Date();
    last60.setDate(last60.getDate() - 60);
    
    const last30Count = data.filter(a => new Date(a.created_at) >= last30).length;
    const prev30Count = data.filter(a => {
      const date = new Date(a.created_at);
      return date >= last60 && date < last30;
    }).length;
    const growthRate = prev30Count > 0 ? ((last30Count - prev30Count) / prev30Count) * 100 : 0;

    // Average cost per user
    const uniqueUsers = new Set(data.map(a => a.user_id)).size;
    const totalCost = data.reduce((sum, a) => sum + (Number(a.cost_usd) || 0), 0);
    const avgCostPerUser = uniqueUsers > 0 ? totalCost / uniqueUsers : 0;

    // Active users last 30 days
    const activeUsersLast30Days = new Set(
      data.filter(a => new Date(a.created_at) >= last30).map(a => a.user_id)
    ).size;

    return {
      topUsersByAIUsage: topUsersData,
      monthlyProjection,
      growthRate,
      avgCostPerUser,
      activeUsersLast30Days,
    };
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
