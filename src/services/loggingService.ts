import { supabase } from "@/integrations/supabase/client";

export type LogType = 
  | 'error' 
  | 'action' 
  | 'navigation' 
  | 'scan' 
  | 'analysis' 
  | 'auth'
  | 'profile'
  | 'favorite';

interface LogEntry {
  logType: LogType;
  message: string;
  metadata?: Record<string, any>;
}

class LoggingService {
  private loggingEnabled: boolean | null = null;
  private checkInProgress: boolean = false;

  /**
   * Check if logging is enabled for the current user
   */
  private async isLoggingEnabled(): Promise<boolean> {
    if (this.loggingEnabled !== null) {
      return this.loggingEnabled;
    }

    if (this.checkInProgress) {
      return false;
    }

    this.checkInProgress = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.loggingEnabled = false;
        return false;
      }

      const { data, error } = await supabase
        .from('user_logging_config')
        .select('logging_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking logging config:', error);
        this.loggingEnabled = false;
        return false;
      }

      this.loggingEnabled = data?.logging_enabled ?? false;
      return this.loggingEnabled;
    } catch (error) {
      console.error('Error in isLoggingEnabled:', error);
      this.loggingEnabled = false;
      return false;
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Reset the logging enabled cache (call when user logs in/out)
   */
  resetCache() {
    this.loggingEnabled = null;
  }

  /**
   * Log an entry to the database if logging is enabled for the user
   */
  async log({ logType, message, metadata = {} }: LogEntry): Promise<void> {
    try {
      const enabled = await this.isLoggingEnabled();
      if (!enabled) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('application_logs')
        .insert({
          user_id: user.id,
          log_type: logType,
          message,
          metadata
        });

      if (error) {
        console.error('Error saving log:', error);
      }
    } catch (error) {
      // Silently fail - we don't want logging to break the app
      console.error('Error in log method:', error);
    }
  }

  /**
   * Log an error
   */
  async logError(message: string, error?: any) {
    await this.log({
      logType: 'error',
      message,
      metadata: {
        error: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log a user action
   */
  async logAction(action: string, details?: Record<string, any>) {
    await this.log({
      logType: 'action',
      message: action,
      metadata: details
    });
  }

  /**
   * Log navigation
   */
  async logNavigation(from: string, to: string) {
    await this.log({
      logType: 'navigation',
      message: `Navigated from ${from} to ${to}`,
      metadata: { from, to }
    });
  }

  /**
   * Log a scan event
   */
  async logScan(scanType: 'openfood_api' | 'ai_photo', productName?: string, barcode?: string) {
    await this.log({
      logType: 'scan',
      message: `Scan performed: ${scanType}`,
      metadata: { scanType, productName, barcode }
    });
  }

  /**
   * Log an analysis event
   */
  async logAnalysis(analysisType: string, result: any) {
    await this.log({
      logType: 'analysis',
      message: `Analysis completed: ${analysisType}`,
      metadata: { analysisType, result }
    });
  }
}

export const loggingService = new LoggingService();
