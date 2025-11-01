import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ProfileService } from '@/services/profileService';
import { loggingService } from '@/services/loggingService';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isPremium: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log authentication events
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            loggingService.log({
              logType: 'auth',
              message: 'Usuario inició sesión',
              metadata: {
                email: session?.user?.email,
                provider: session?.user?.app_metadata?.provider,
                timestamp: new Date().toISOString()
              }
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            loggingService.log({
              logType: 'auth',
              message: 'Usuario cerró sesión',
              metadata: {
                timestamp: new Date().toISOString()
              }
            });
          }, 0);
        } else if (event === 'TOKEN_REFRESHED') {
          setTimeout(() => {
            loggingService.log({
              logType: 'auth',
              message: 'Token actualizado',
              metadata: {
                timestamp: new Date().toISOString()
              }
            });
          }, 0);
        }
        
        // Initialize profile service and reset logging cache when auth state changes
        if (session?.user) {
          setTimeout(() => {
            ProfileService.initialize();
            loggingService.resetCache();
          }, 0);
        } else {
          loggingService.resetCache();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Initialize profile service
      if (session?.user) {
        setTimeout(() => {
          ProfileService.initialize();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      loggingService.log({
        logType: 'auth',
        message: 'Attempting sign up',
        metadata: { email }
      });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/scanner`
        }
      });

      if (error) {
        loggingService.logError('Sign up error', { error: error.message });
        throw error;
      }

      // Migrate local profile to cloud after signup
      const localProfile = localStorage.getItem('localProfile');
      if (localProfile) {
        setTimeout(async () => {
          await ProfileService.migrateLocalToCloud();
          toast({
            title: "¡Bienvenido a PREMIUM! 🎉",
            description: "Tu perfil local ha sido sincronizado",
          });
        }, 100);
      }

      loggingService.log({
        logType: 'auth',
        message: 'Sign up successful',
        metadata: { email }
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      loggingService.logError('Sign up exception', { error: error.message });
      throw error;
    }
  };


  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        }
        throw error;
      }

      // Check if user needs email confirmation
      if (!data.session) {
        throw new Error('Por favor confirma tu email antes de iniciar sesión.');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };


  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/scanner`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };


  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Log before signing out
      await loggingService.log({
        logType: 'auth',
        message: 'Usuario solicitó cerrar sesión',
        metadata: {
          email: user?.email,
          timestamp: new Date().toISOString()
        }
      });
      
      // CRÍTICO: Limpiar localStorage de perfiles antes de cerrar sesión
      localStorage.removeItem('labelGuardProfiles');
      loggingService.resetCache();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      loggingService.logError('Sign out error', error);
      throw error;
    }
  };

  const isPremium = !!user;
  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isPremium,
        isGuest,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
