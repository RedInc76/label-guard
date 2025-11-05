import { supabase } from "@/integrations/supabase/client";

const MAX_FREE_SCANS_PER_DAY = 10;
const RATE_LIMIT_WINDOW_HOURS = 24;

export class ScanRateLimitService {
  /**
   * Verifica si el usuario puede escanear
   * @param userId - ID del usuario (si es null = usuario free sin cuenta)
   * @param isPremium - Si el usuario es premium (skip rate limit)
   * @returns { allowed: boolean, remaining: number, resetAt: Date }
   */
  static async canScan(
    userId: string | null,
    isPremium: boolean
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    // Premium users = unlimited scans
    if (isPremium) {
      return { 
        allowed: true, 
        remaining: -1, // -1 = ilimitado
        resetAt: new Date()
      };
    }

    // Para usuarios free sin cuenta, usar localStorage
    if (!userId) {
      return this.checkLocalRateLimit();
    }

    // Para usuarios free con cuenta, usar DB
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    const { data, error } = await supabase
      .from('scan_rate_limit')
      .select('scan_count, window_start')
      .eq('user_id', userId)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Rate limit check error:', error);
      // En caso de error, permitir (fail-open)
      return { allowed: true, remaining: MAX_FREE_SCANS_PER_DAY, resetAt: new Date() };
    }

    const currentCount = data?.scan_count || 0;
    const remaining = Math.max(0, MAX_FREE_SCANS_PER_DAY - currentCount);
    const resetAt = data?.window_start 
      ? new Date(new Date(data.window_start).getTime() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
      : new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

    return {
      allowed: currentCount < MAX_FREE_SCANS_PER_DAY,
      remaining,
      resetAt
    };
  }

  /**
   * Incrementa el contador de escaneos
   */
  static async incrementScan(userId: string | null): Promise<void> {
    if (!userId) {
      // Usuarios sin cuenta: incrementar localStorage
      this.incrementLocalScan();
      return;
    }

    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    // Buscar registro existente en la ventana
    const { data: existing } = await supabase
      .from('scan_rate_limit')
      .select('id, scan_count')
      .eq('user_id', userId)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (existing) {
      // Incrementar contador existente
      await supabase
        .from('scan_rate_limit')
        .update({ 
          scan_count: existing.scan_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Crear nuevo registro
      await supabase
        .from('scan_rate_limit')
        .insert({
          user_id: userId,
          scan_count: 1,
          window_start: new Date().toISOString()
        });
    }
  }

  /**
   * Rate limiting para usuarios sin cuenta (localStorage)
   */
  private static checkLocalRateLimit(): {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  } {
    const key = 'labelguard_free_scan_limit';
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return { 
        allowed: true, 
        remaining: MAX_FREE_SCANS_PER_DAY - 1,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
      };
    }

    const data = JSON.parse(stored);
    const resetAt = new Date(data.resetAt);
    
    // Si ya pasó el reset, reiniciar
    if (new Date() > resetAt) {
      localStorage.removeItem(key);
      return { 
        allowed: true, 
        remaining: MAX_FREE_SCANS_PER_DAY - 1,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000)
      };
    }

    const remaining = Math.max(0, MAX_FREE_SCANS_PER_DAY - data.count);
    return {
      allowed: data.count < MAX_FREE_SCANS_PER_DAY,
      remaining,
      resetAt
    };
  }

  private static incrementLocalScan(): void {
    const key = 'labelguard_free_scan_limit';
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      localStorage.setItem(key, JSON.stringify({
        count: 1,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      }));
      return;
    }

    const data = JSON.parse(stored);
    const resetAt = new Date(data.resetAt);
    
    // Si ya pasó el reset, reiniciar
    if (new Date() > resetAt) {
      localStorage.setItem(key, JSON.stringify({
        count: 1,
        resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      }));
      return;
    }

    // Incrementar
    localStorage.setItem(key, JSON.stringify({
      count: data.count + 1,
      resetAt: data.resetAt
    }));
  }

  /**
   * Formatea el tiempo restante para el reset
   */
  static formatResetTime(resetAt: Date): string {
    const now = new Date();
    const diff = resetAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutos`;
  }
}
