import { useState, useEffect } from 'react';
import { Profile, DietaryRestriction } from '@/types/restrictions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileEditorDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}

export const ProfileEditorDialog = ({ profile, isOpen, onClose, onSave }: ProfileEditorDialogProps) => {
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [newCustomRestriction, setNewCustomRestriction] = useState('');

  useEffect(() => {
    if (profile) {
      setEditedProfile({ ...profile });
    }
  }, [profile]);

  if (!editedProfile) return null;

  const categories = {
    allergens: 'Alérgenos',
    dietary: 'Dieta',
    health: 'Salud',
    religious: 'Religioso'
  };

  const handleSave = () => {
    onSave(editedProfile);
    onClose();
  };

  const toggleRestriction = (restrictionId: string) => {
    setEditedProfile({
      ...editedProfile,
      restrictions: editedProfile.restrictions.map(r =>
        r.id === restrictionId ? { ...r, enabled: !r.enabled } : r
      )
    });
  };

  const addCustomRestriction = () => {
    if (newCustomRestriction.trim()) {
      setEditedProfile({
        ...editedProfile,
        customRestrictions: [...editedProfile.customRestrictions, newCustomRestriction.trim()]
      });
      setNewCustomRestriction('');
    }
  };

  const removeCustomRestriction = (index: number) => {
    setEditedProfile({
      ...editedProfile,
      customRestrictions: editedProfile.customRestrictions.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Configura el nombre y restricciones para este perfil
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Nombre del perfil */}
            <div>
              <Label htmlFor="profileName">Nombre del perfil</Label>
              <Input
                id="profileName"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="mt-2"
              />
            </div>

            {/* Restricciones por categoría */}
            {Object.entries(categories).map(([categoryKey, categoryName]) => {
              const categoryRestrictions = editedProfile.restrictions.filter(
                r => r.category === categoryKey
              );
              
              if (categoryRestrictions.length === 0) return null;

              return (
                <Card key={categoryKey} className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">{categoryName}</h3>
                  <div className="space-y-3">
                    {categoryRestrictions.map((restriction) => (
                      <div key={restriction.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground text-sm">
                              {restriction.name}
                            </h4>
                            {restriction.enabled && (
                              <Badge variant="secondary" className="text-xs">Activo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {restriction.description}
                          </p>
                        </div>
                        <Switch
                          checked={restriction.enabled}
                          onCheckedChange={() => toggleRestriction(restriction.id)}
                          className="ml-4"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Restricciones personalizadas */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Restricciones Personalizadas</h3>
              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ej: Sin conservantes, Sin colorantes..."
                  value={newCustomRestriction}
                  onChange={(e) => setNewCustomRestriction(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomRestriction()}
                />
                <Button 
                  onClick={addCustomRestriction}
                  size="icon"
                  disabled={!newCustomRestriction.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {editedProfile.customRestrictions.length > 0 && (
                <div className="space-y-2">
                  {editedProfile.customRestrictions.map((restriction, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-lg">
                      <span className="text-sm font-medium">{restriction}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomRestriction(index)}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {editedProfile.customRestrictions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay restricciones personalizadas
                </p>
              )}
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
