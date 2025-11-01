import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { Separator } from '@/components/ui/separator';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener al menos un símbolo especial');

export const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, isPremium } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Redirect if already logged in
  if (isPremium) {
    navigate('/scanner');
    return null;
  }

  const validateInputs = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e: any) {
      newErrors.email = e.errors[0]?.message || 'Email inválido';
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = e.errors[0]?.message || 'Contraseña no válida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar sesión con Google',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente",
      });
      navigate('/scanner');
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Verifica tus credenciales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    if (!termsAccepted) {
      toast({
        title: "Acepta los términos",
        description: "Debes aceptar los términos y condiciones para continuar",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await signUp(email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Tu cuenta ha sido creada exitosamente. Te enviamos un email de bienvenida.",
      });
      navigate('/scanner');
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        toast({
          title: "Usuario existente",
          description: "Este email ya está registrado. ¿Quieres iniciar sesión?",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al registrarse",
          description: error.message || "Hubo un problema con el registro",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full space-y-6">
        <div className="text-center">
          <img src="/logo-192.png" alt="LabelGuard" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold mb-2">LabelGuard</h1>
          <p className="text-muted-foreground">Accede a todas las funciones premium</p>
        </div>

        <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={loading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </Button>

        <div className="relative"><Separator /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">O continúa con email</span></div>

        <Tabs defaultValue={mode} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader><CardTitle>Iniciar Sesión</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Iniciar Sesión
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader><CardTitle>Crear Cuenta</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input id="signup-password" type="password" placeholder="Contraseña segura" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked === true)} required />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      <LegalDisclaimer variant="terms-acceptance" />
                      <Link to="/terms" className="text-primary underline ml-1">Ver términos</Link>
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !termsAccepted}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta Gratis 🚀
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button variant="ghost" onClick={() => navigate('/scanner')} className="w-full">Volver al escáner</Button>
      </div>
    </div>
  );
};
