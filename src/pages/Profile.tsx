import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProfiles, useToggleProfile, useCreateProfile, useUpdateProfile, useDeleteProfile, useMaxProfiles } from '@/hooks/useProfiles';
import type { Profile as ProfileType } from '@/types/restrictions';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileEditorDialog } from '@/components/ProfileEditorDialog';
import { CreateProfileDialog } from '@/components/CreateProfileDialog';
import { ProfileListSkeleton } from '@/components/ProfileListSkeleton';
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

export const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingProfile, setEditingProfile] = useState<ProfileType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  
  // React Query: datos instantáneos desde cache
  const { data: profiles = [], isLoading, isFetching, refetch } = useProfiles();
  const { data: maxProfiles = 1 } = useMaxProfiles();
  const toggleMutation = useToggleProfile();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const deleteMutation = useDeleteProfile();

  const handleCreateProfile = async (name: string) => {
    try {
      const newProfile = await createMutation.mutateAsync(name);
      toast({
        title: "Perfil creado",
        description: `El perfil "${newProfile.name}" ha sido creado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el perfil",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const profile = profiles.find(p => p.id === id);
      // Actualización optimista: UI cambia INSTANTÁNEAMENTE
      await toggleMutation.mutateAsync(id);
      toast({
        title: profile?.isActive ? "Perfil desactivado" : "Perfil activado",
        description: `El perfil "${profile?.name}" ha sido ${profile?.isActive ? 'desactivado' : 'activado'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setEditingProfile(profile);
    }
  };

  const handleSaveProfile = async (profile: ProfileType) => {
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        updates: {
          name: profile.name,
          restrictions: profile.restrictions
        }
      });
      toast({
        title: "Perfil actualizado",
        description: `Los cambios en "${profile.name}" han sido guardados`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el perfil",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfileToDelete(id);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      const profile = profiles.find(p => p.id === profileToDelete);
      await deleteMutation.mutateAsync(profileToDelete);
      toast({
        title: "Perfil eliminado",
        description: `El perfil "${profile?.name}" ha sido eliminado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el perfil",
        variant: "destructive",
      });
    } finally {
      setProfileToDelete(null);
    }
  };

  const activeProfilesCount = profiles.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Perfiles</h1>
            <p className="text-muted-foreground">
              {profiles.length}/{maxProfiles} perfiles creados
              {activeProfilesCount > 0 && ` • ${activeProfilesCount} activo${activeProfilesCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Alert si no hay perfiles activos */}
        {activeProfilesCount === 0 && profiles.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay perfiles activos. Activa al menos un perfil para poder escanear productos.
            </AlertDescription>
          </Alert>
        )}

        {/* Botón refrescar perfiles */}
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Actualizando...' : 'Refrescar Perfiles'}
        </Button>

        {/* Botón crear perfil */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={profiles.length >= maxProfiles}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {profiles.length >= maxProfiles
            ? `Máximo ${maxProfiles} perfiles alcanzado`
            : 'Crear Nuevo Perfil'
          }
        </Button>

        {/* Lista de perfiles con skeleton */}
        {isLoading ? (
          <ProfileListSkeleton />
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onToggleActive={handleToggleActive}
                onEdit={handleEditProfile}
                onDelete={handleDeleteProfile}
              />
            ))}
          </div>
        )}

        {profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No hay perfiles creados aún
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Crear Primer Perfil
            </Button>
          </div>
        )}

        {/* Información adicional */}
        {activeProfilesCount > 0 && (
          <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">
                {activeProfilesCount === 1 ? 'Perfil Listo' : 'Perfiles Listos'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Los productos se verificarán contra {activeProfilesCount === 1 ? 'este perfil' : `estos ${activeProfilesCount} perfiles`}. 
                Activa o desactiva perfiles según necesites.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Diálogos */}
      <CreateProfileDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreate={handleCreateProfile}
      />

      <ProfileEditorDialog
        profile={editingProfile}
        isOpen={editingProfile !== null}
        onClose={() => setEditingProfile(null)}
        onSave={handleSaveProfile}
      />

      <AlertDialog open={profileToDelete !== null} onOpenChange={() => setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El perfil "{profiles.find(p => p.id === profileToDelete)?.name}" 
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
