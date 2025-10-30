import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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

export const Account = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Por ahora, simplemente cerrar sesión y mostrar mensaje
      // La eliminación completa requeriría una función de backend
      toast({
        title: 'Funcionalidad en desarrollo',
        description: 'La eliminación de cuenta estará disponible próximamente. Por favor contacta con soporte.',
        variant: 'destructive',
      });

      // TODO: Implementar migración con función RPC para eliminar cuenta
      // const { error } = await supabase.rpc('delete_user_account');
      // if (error) throw error;
      
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
    <div className="min-h-screen p-6">
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

        {/* Email */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email || 'No disponible'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones de cuenta */}
        <div className="space-y-3">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={handleResetPassword}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Cambiar contraseña</p>
                  <p className="text-xs text-muted-foreground">
                    Recibirás un email para restablecer tu contraseña
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={handleSignOut}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Cerrar sesión</p>
                  <p className="text-xs text-muted-foreground">
                    Sal de tu cuenta en este dispositivo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zona peligrosa */}
        <div className="pt-6 border-t border-border">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de peligro
          </h2>
          
          <Card className="border-destructive/50 hover:bg-destructive/5 transition-colors cursor-pointer" onClick={() => setShowDeleteDialog(true)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-destructive">Eliminar cuenta</p>
                  <p className="text-xs text-muted-foreground">
                    Esta acción no se puede deshacer. Se eliminarán todos tus datos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
