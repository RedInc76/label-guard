import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Al menos 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Una letra mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Una letra minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Un número', test: (p) => /[0-9]/.test(p) },
  { label: 'Un símbolo especial', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const metRequirements = requirements.filter(req => req.test(password)).length;
  const strength = (metRequirements / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 40) return 'bg-destructive';
    if (strength <= 80) return 'bg-warning';
    return 'bg-success';
  };

  const getStrengthText = () => {
    if (strength <= 40) return 'Débil';
    if (strength <= 80) return 'Media';
    return 'Fuerte';
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Seguridad de la contraseña</span>
          <span className="font-medium">{getStrengthText()}</span>
        </div>
        <Progress value={strength} className="h-2" indicatorClassName={getStrengthColor()} />
      </div>
      
      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isMet ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={isMet ? 'text-foreground' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
