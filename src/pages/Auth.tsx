import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

export const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isPremium, resendConfirmationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Redirect if already logged in
  if (isPremium) {
    navigate('/scanner');
    return null;
  }

  const validateInputs = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      newErrors.email = 'Email inválido';
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      // Check if it's an email confirmation error
      if (error.message?.includes('confirma tu email')) {
        setShowEmailVerification(true);
        setRegisteredEmail(email);
        toast({
          title: "Email no confirmado",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al iniciar sesión",
          description: error.message || "Verifica tus credenciales",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(email, password);
      
      if (needsEmailConfirmation) {
        setShowEmailVerification(true);
        setRegisteredEmail(email);
        toast({
          title: "📧 Revisa tu correo",
          description: "Te enviamos un link de confirmación",
        });
      } else {
        toast({
          title: "¡Cuenta creada! 🎉",
          description: "Ya tienes acceso a todas las funciones premium",
        });
        navigate('/scanner');
      }
    } catch (error: any) {
      let errorMessage = "No se pudo crear la cuenta";
      if (error.message?.includes('already registered')) {
        errorMessage = "Este email ya está registrado";
      }
      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await resendConfirmationEmail(registeredEmail);
      toast({
        title: "Email reenviado",
        description: "Revisa tu bandeja de entrada",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo reenviar el email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show email verification message if needed
  if (showEmailVerification) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📧</span>
            </div>
            <CardTitle>Confirma tu email</CardTitle>
            <CardDescription>
              Te enviamos un link de confirmación a
            </CardDescription>
            <p className="font-semibold text-foreground mt-2">{registeredEmail}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Pasos a seguir:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Revisa tu bandeja de entrada</li>
                  <li>Haz clic en el link de confirmación</li>
                  <li>Regresa aquí para iniciar sesión</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Revisa también la carpeta de spam
                </p>
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleResendEmail} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reenviar email
            </Button>
            
            <Button 
              onClick={() => setShowEmailVerification(false)} 
              variant="ghost" 
              className="w-full"
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <div className="w-full">
        <div className="text-center mb-8">
          <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Label Guard</h1>
          <p className="text-muted-foreground">
            Accede a todas las funciones premium
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>
                  Accede a tu cuenta premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
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
              <CardHeader>
                <CardTitle>Crear Cuenta</CardTitle>
                <CardDescription>
                  Desbloquea todas las funciones premium gratis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 border-primary/20 bg-primary/5">
                  <AlertDescription className="text-sm">
                    <strong>Con tu cuenta premium tendrás:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Hasta 5 perfiles personalizados</li>
                      <li>Historial completo de escaneos</li>
                      <li>Productos favoritos</li>
                      <li>Análisis por IA con fotos</li>
                      <li>Sincronización multi-dispositivo</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta Gratis 🚀
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/scanner')}
          >
            Volver al escáner
          </Button>
        </div>
      </div>
    </div>
  );
};
