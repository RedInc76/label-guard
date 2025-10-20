import { Profile } from '@/types/restrictions';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface ActiveProfilesBadgeProps {
  profiles: Profile[];
}

export const ActiveProfilesBadge = ({ profiles }: ActiveProfilesBadgeProps) => {
  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
        <Users className="w-5 h-5 text-warning" />
        <span className="text-sm font-medium text-warning">
          No hay perfiles activos
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Escaneando para:
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <Badge key={profile.id} variant="secondary">
            {profile.name}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {profiles.length} perfil{profiles.length > 1 ? 'es' : ''} activo{profiles.length > 1 ? 's' : ''}
      </p>
    </div>
  );
};
