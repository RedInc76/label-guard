import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Mail, Lock, LogOut, Trash2, AlertTriangle, User, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserProfileService } from '@/services/userProfileService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileFormSchema = z.object({
  gender: z.enum(['hombre', 'mujer', '']).optional(),
  country: z.string().optional().or(z.literal('')),
  city: z.string().max(50, 'La ciudad no puede exceder 50 caracteres').optional().or(z.literal('')),
  community_stats_consent: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const countries = [
  'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Venezuela',
  'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'República Dominicana', 'Honduras',
  'Paraguay', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá', 'Uruguay',
  'Puerto Rico', 'Estados Unidos', 'Otro'
];

export const Account = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      gender: '',
      country: '',
      city: '',
      community_stats_consent: false,
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setIsLoadingProfile(true);
      const profile = await UserProfileService.getProfile(user.id);
      
      if (profile) {
        form.reset({
          gender: (profile.gender === 'hombre' || profile.gender === 'mujer') ? profile.gender : '',
          country: profile.country || '',
          city: profile.city || '',
          community_stats_consent: profile.community_stats_consent || false,
        });
      }
      setIsLoadingProfile(false);
    };

    loadProfile();
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;

    const success = await UserProfileService.updateProfile(user.id, {
      gender: data.gender || null,
      country: data.country || null,
      city: data.city || null,
      community_stats_consent: data.community_stats_consent,
    });

    if (success) {
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido guardada correctamente',
      });
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar tu perfil. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: 'Revisa tu correo para restablecer tu contraseña',
      });
    } catch (error) {
      console.error('Error al enviar email de restablecimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el email. Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar sesión',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      toast({
        title: 'Funcionalidad en desarrollo',
        description: 'La eliminación de cuenta estará disponible próximamente. Por favor contacta con soporte.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cuenta. Contacta con soporte.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mi Cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu información y preferencias
            </p>
          </div>
        </div>

        {/* Sección 1: Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Todos los campos son opcionales</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar sexo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hombre">Hombre</SelectItem>
                          <SelectItem value="mujer">Mujer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoadingProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sección 2: Seguridad de la Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Seguridad de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email || 'No disponible'}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full justify-start" onClick={handleResetPassword}>
              <Lock className="w-4 h-4 mr-2" />
              Cambiar contraseña
            </Button>

            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        {/* Sección 3: Preferencias de Privacidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Preferencias de Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="community_stats"
                checked={form.watch('community_stats_consent')}
                onCheckedChange={(checked) => {
                  form.setValue('community_stats_consent', checked as boolean);
                  form.handleSubmit(onSubmit)();
                }}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="community_stats"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Permitir uso de datos anónimos para estadísticas comunitarias
                </Label>
                <p className="text-xs text-muted-foreground">
                  Esto nos ayuda a entender mejor las tendencias alimentarias y mejorar la app. 
                  Tus datos personales nunca serán compartidos. Puedes desactivar esto en cualquier momento.
                </p>
              </div>
            </div>

            <Button 
              variant="link" 
              className="p-0 h-auto text-primary"
              onClick={() => navigate('/privacy-policy')}
            >
              Ver Política de Privacidad completa
            </Button>
          </CardContent>
        </Card>

        {/* Sección 4: Zona de Peligro */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zona de Peligro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar cuenta permanentemente
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Esta acción no se puede deshacer. Se eliminarán todos tus datos.
            </p>
          </CardContent>
        </Card>

        {/* Info legal */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Derecho al olvido (GDPR):</strong> Tienes derecho a solicitar la eliminación 
              completa de tu cuenta y todos los datos asociados. Al eliminar tu cuenta se borrarán 
              permanentemente todos tus perfiles, historial de escaneos y favoritos.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar cuenta permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="font-semibold">Esta acción es irreversible y eliminará:</p>
              <ul className="list-disc ml-5 space-y-1 text-sm">
                <li>Todos tus perfiles y restricciones configuradas</li>
                <li>Tu historial completo de escaneos</li>
                <li>Todos tus productos favoritos</li>
                <li>Tus estadísticas e insights</li>
                <li>Tu cuenta de usuario</li>
              </ul>
              <p className="font-semibold pt-2">¿Estás completamente seguro/a?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
