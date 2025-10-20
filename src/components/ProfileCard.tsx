import { Profile } from '@/types/restrictions';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, User } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  onToggleActive: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProfileCard = ({ profile, onToggleActive, onEdit, onDelete }: ProfileCardProps) => {
  const activeRestrictionsCount = profile.restrictions.filter(r => r.enabled).length + profile.customRestrictions.length;

  return (
    <Card className="p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{profile.name}</h3>
              {profile.isActive && (
                <Badge variant="secondary" className="text-xs">Activo</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {activeRestrictionsCount === 0 
                ? 'Sin restricciones'
                : `${activeRestrictionsCount} restricción${activeRestrictionsCount > 1 ? 'es' : ''}`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={profile.isActive}
            onCheckedChange={() => onToggleActive(profile.id)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(profile.id)}
            className="h-8 w-8"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(profile.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
