import { useState, useEffect } from 'react';
import { Profile, DietaryRestriction, SeverityLevel, SEVERITY_LEVELS } from '@/types/restrictions';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileEditorDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
}

// Componente SeveritySelector
const SeveritySelector = ({ 
  value, 
  onChange, 
  disabled = false 
}: { 
  value: SeverityLevel; 
  onChange: (level: SeverityLevel) => void;
  disabled?: boolean;
}) => {
  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
      <div className="flex gap-2">
        {Object.values(SEVERITY_LEVELS).map((severity) => (
          <TooltipProvider key={severity.level}>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className={`
                  flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors
                  ${value === severity.level ? 'bg-primary/10 border-primary' : 'border-input'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}
                `}>
                  <RadioGroupItem value={severity.level} className="sr-only" />
                  <span className="text-lg">{severity.icon}</span>
                  <span className={`text-sm font-medium ${severity.color}`}>
                    {severity.label}
                  </span>
                </label>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs z-50" sideOffset={5}>
                <p className="text-xs">{severity.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </RadioGroup>
  );
};

export const ProfileEditorDialog = ({ profile, isOpen, onClose, onSave }: ProfileEditorDialogProps) => {
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [newCustomRestriction, setNewCustomRestriction] = useState('');
  const [newCustomSeverity, setNewCustomSeverity] = useState<SeverityLevel>('moderado');

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
        r.id === restrictionId ? { ...r, enabled: !r.enabled, severityLevel: r.severityLevel || 'moderado' } : r
      )
    });
  };

  const updateRestrictionSeverity = (restrictionId: string, level: SeverityLevel) => {
    setEditedProfile({
      ...editedProfile,
      restrictions: editedProfile.restrictions.map(r =>
        r.id === restrictionId ? { ...r, severityLevel: level } : r
      )
    });
  };

  const updateCustomRestrictionSeverity = (index: number, level: SeverityLevel) => {
    const updated = [...editedProfile.customRestrictions];
    updated[index] = { ...updated[index], severityLevel: level };
    setEditedProfile({ ...editedProfile, customRestrictions: updated });
  };

  const addCustomRestriction = () => {
    if (newCustomRestriction.trim()) {
      setEditedProfile({
        ...editedProfile,
        customRestrictions: [
          ...editedProfile.customRestrictions,
          {
            text: newCustomRestriction.trim(),
            severityLevel: newCustomSeverity
          }
        ]
      });
      setNewCustomRestriction('');
      setNewCustomSeverity('moderado');
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
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Configura el nombre y restricciones para este perfil
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
          <div className="space-y-6 py-4">
            {/* Mensaje de advertencia importante */}
            <Alert className="border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                Importante: Define el nivel de severidad correctamente
              </AlertTitle>
              <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
                El nivel de severidad determina qué tan estricto será el análisis de productos. 
                <strong className="block mt-1">Nivel Severo</strong> es recomendado para alergias graves o restricciones médicas. 
                <strong className="block mt-1">Nivel Leve</strong> tolera trazas y procesamiento cruzado.
              </AlertDescription>
            </Alert>

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
                  <div className="space-y-4">
                    {categoryRestrictions.map((restriction) => (
                      <div key={restriction.id} className="space-y-2">
                        <div className="flex items-center justify-between">
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
                        
                        {restriction.enabled && (
                          <div className="ml-4 pl-4 border-l-2 border-muted">
                            <Label className="text-xs text-muted-foreground mb-2 block">
                              Nivel de severidad
                            </Label>
                            <SeveritySelector
                              value={restriction.severityLevel || 'moderado'}
                              onChange={(level) => updateRestrictionSeverity(restriction.id, level)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}

            {/* Restricciones personalizadas */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Restricciones Personalizadas</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
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

                {/* Selector de severidad para nueva restricción */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Nivel predeterminado:
                  </Label>
                  <SeveritySelector
                    value={newCustomSeverity}
                    onChange={setNewCustomSeverity}
                  />
                </div>

                {editedProfile.customRestrictions.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {editedProfile.customRestrictions.map((restriction, index) => (
                      <div key={index} className="space-y-2 bg-muted p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{restriction.text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomRestriction(index)}
                            className="h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <SeveritySelector
                          value={restriction.severityLevel}
                          onChange={(level) => updateCustomRestrictionSeverity(index, level)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {editedProfile.customRestrictions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay restricciones personalizadas
                  </p>
                )}
              </div>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-background pt-4 border-t">
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