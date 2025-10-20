import { useState, useEffect } from 'react';
import { Settings, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ProfileService } from '@/services/profileService';
import type { Profile as ProfileType } from '@/types/restrictions';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileEditorDialog } from '@/components/ProfileEditorDialog';
import { CreateProfileDialog } from '@/components/CreateProfileDialog';
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
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileType[]>([]);
  const [editingProfile, setEditingProfile] = useState<ProfileType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [maxProfiles, setMaxProfiles] = useState(1);

  useEffect(() => {
    const initializeProfiles = async () => {
      await ProfileService.initialize();
      loadProfiles();
      const max = await ProfileService.getMaxProfiles();
      setMaxProfiles(max);
    };
    initializeProfiles();
  }, []);

  const loadProfiles = () => {
    setProfiles(ProfileService.getProfiles());
  };

  const handleCreateProfile = (name: string) => {
    try {
      const newProfile = ProfileService.createProfile(name);
      loadProfiles();
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

  const handleToggleActive = (id: string) => {
    try {
      const isActive = ProfileService.toggleProfileActive(id);
      const profile = ProfileService.getProfile(id);
      loadProfiles();
      toast({
        title: isActive ? "Perfil activado" : "Perfil desactivado",
        description: `El perfil "${profile?.name}" ha sido ${isActive ? 'activado' : 'desactivado'}`,
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
    const profile = ProfileService.getProfile(id);
    if (profile) {
      setEditingProfile(profile);
    }
  };

  const handleSaveProfile = (profile: ProfileType) => {
    try {
      ProfileService.updateProfile(profile.id, {
        name: profile.name,
        restrictions: profile.restrictions,
        customRestrictions: profile.customRestrictions,
      });
      loadProfiles();
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

  const confirmDeleteProfile = () => {
    if (!profileToDelete) return;
    
    try {
      const profile = ProfileService.getProfile(profileToDelete);
      ProfileService.deleteProfile(profileToDelete);
      loadProfiles();
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
  const canCreateMore = ProfileService.canCreateProfile();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Perfiles</h1>
          <p className="text-muted-foreground">
            {profiles.length}/{maxProfiles} perfiles creados
            {activeProfilesCount > 0 && ` • ${activeProfilesCount} activo${activeProfilesCount > 1 ? 's' : ''}`}
          </p>
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

        {/* Botón crear perfil */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!canCreateMore}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {canCreateMore 
            ? 'Crear Nuevo Perfil' 
            : `Máximo ${maxProfiles} perfiles alcanzado`
          }
        </Button>

        {/* Lista de perfiles */}
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
              Esta acción no se puede deshacer. El perfil "{ProfileService.getProfile(profileToDelete || '')?.name}" 
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
