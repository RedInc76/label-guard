import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { loggingService } from '@/services/loggingService';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener al menos un símbolo especial');

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [processingRecovery, setProcessingRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkRecoverySession = async () => {
      // Verificar si la URL contiene un hash de recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasRecoveryToken = hashParams.get('type') === 'recovery';
      
      loggingService.logAction('Password recovery - checking session', {
        hasHash: !!window.location.hash,
        hashType: hashParams.get('type'),
        hasRecoveryToken
      });
      
      if (hasRecoveryToken) {
        setProcessingRecovery(true);
        // Dar tiempo al SDK de Supabase para procesar el token
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Ahora sí verificar la sesión
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      loggingService.logAction('Password recovery - session check result', {
        hasSession: !!session,
        hasError: !!error
      });
      
      if (session) {
        setValidSession(true);
        setProcessingRecovery(false);
      } else {
        // Solo redirigir si no estamos procesando recovery
        if (!hasRecoveryToken) {
          toast({
            title: 'Sesión inválida',
            description: 'El enlace de recuperación ha expirado o es inválido',
            variant: 'destructive',
          });
          navigate('/forgot-password');
        } else {
          // Si hay token pero no sesión, esperar un poco más
          setTimeout(() => checkRecoverySession(), 500);
        }
      }
    };
    
    checkRecoverySession();
    
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch (error: any) {
      toast({
        title: 'Contraseña no válida',
        description: error.errors[0]?.message || 'La contraseña no cumple los requisitos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: '¡Contraseña actualizada! ✅',
        description: 'Tu contraseña ha sido restablecida exitosamente',
      });

      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (processingRecovery) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando enlace de recuperación...</p>
        </div>
      </Layout>
    );
  }

  if (!validSession) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Restablecer Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu nueva contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
