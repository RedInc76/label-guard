import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminInsights {
  topUsersByAIUsage: Array<{ email: string; total_ai_uses: number; cost_usd: number }>;
  monthlyProjection: number;
  growthRate: number;
  avgCostPerUser: number;
  activeUsersLast30Days: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for fetching user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch all usage analytics
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('usage_analytics')
      .select('*');

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
      throw analyticsError;
    }

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
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
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

    const insights: AdminInsights = {
      topUsersByAIUsage: topUsersData,
      monthlyProjection,
      growthRate,
      avgCostPerUser,
      activeUsersLast30Days,
    };

    console.log('Admin insights generated successfully for user:', user.email);

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
