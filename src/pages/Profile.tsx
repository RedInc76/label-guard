import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { defaultRestrictions } from '@/data/restrictions';
import { DietaryRestriction, UserProfile } from '@/types/restrictions';

export const Profile = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    restrictions: defaultRestrictions,
    customRestrictions: []
  });
  const [newCustomRestriction, setNewCustomRestriction] = useState('');

  useEffect(() => {
    const savedProfile = localStorage.getItem('foodFreedomProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile({
        restrictions: defaultRestrictions.map(restriction => ({
          ...restriction,
          enabled: parsed.restrictions?.find((r: any) => r.id === restriction.id)?.enabled || false
        })),
        customRestrictions: parsed.customRestrictions || []
      });
    }
  }, []);

  const saveProfile = (updatedProfile: UserProfile) => {
    localStorage.setItem('foodFreedomProfile', JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    toast({
      title: "Perfil guardado",
      description: "Tus restricciones han sido actualizadas",
    });
  };

  const toggleRestriction = (restrictionId: string) => {
    const updatedRestrictions = profile.restrictions.map(restriction =>
      restriction.id === restrictionId
        ? { ...restriction, enabled: !restriction.enabled }
        : restriction
    );
    saveProfile({ ...profile, restrictions: updatedRestrictions });
  };

  const addCustomRestriction = () => {
    if (newCustomRestriction.trim()) {
      const updatedCustomRestrictions = [...profile.customRestrictions, newCustomRestriction.trim()];
      saveProfile({ ...profile, customRestrictions: updatedCustomRestrictions });
      setNewCustomRestriction('');
    }
  };

  const removeCustomRestriction = (index: number) => {
    const updatedCustomRestrictions = profile.customRestrictions.filter((_, i) => i !== index);
    saveProfile({ ...profile, customRestrictions: updatedCustomRestrictions });
  };

  const categories = {
    allergens: 'Alérgenos',
    dietary: 'Dieta',
    health: 'Salud',
    religious: 'Religioso'
  };

  const enabledCount = profile.restrictions.filter(r => r.enabled).length + profile.customRestrictions.length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            {enabledCount > 0 
              ? `${enabledCount} restricción${enabledCount > 1 ? 'es' : ''} activa${enabledCount > 1 ? 's' : ''}`
              : 'Define tus restricciones alimenticias'
            }
          </p>
        </div>

        {/* Restrictions by Category */}
        {Object.entries(categories).map(([categoryKey, categoryName]) => {
          const categoryRestrictions = profile.restrictions.filter(r => r.category === categoryKey);
          
          return (
            <Card key={categoryKey} className="p-4 shadow-soft">
              <h3 className="font-semibold text-foreground mb-3">{categoryName}</h3>
              <div className="space-y-3">
                {categoryRestrictions.map((restriction) => (
                  <div key={restriction.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{restriction.name}</h4>
                        {restriction.enabled && (
                          <Badge variant="secondary" className="text-xs">Activo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{restriction.description}</p>
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

        {/* Custom Restrictions */}
        <Card className="p-4 shadow-soft">
          <h3 className="font-semibold text-foreground mb-3">Restricciones Personalizadas</h3>
          
          {/* Add new custom restriction */}
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

          {/* Custom restrictions list */}
          {profile.customRestrictions.length > 0 && (
            <div className="space-y-2">
              {profile.customRestrictions.map((restriction, index) => (
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

          {profile.customRestrictions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay restricciones personalizadas
            </p>
          )}
        </Card>

        {/* Summary */}
        {enabledCount > 0 && (
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-2">Perfil Configurado</h3>
              <p className="text-sm text-muted-foreground">
                Tu perfil está listo. ¡Ya puedes escanear productos!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};