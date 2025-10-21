import { Info, AlertTriangle, ShieldAlert, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LegalDisclaimerProps {
  variant: 'general' | 'results' | 'photo-analysis' | 'terms-acceptance';
  compact?: boolean;
  className?: string;
}

export const LegalDisclaimer = ({ variant, compact = false, className }: LegalDisclaimerProps) => {
  const getIcon = () => {
    switch (variant) {
      case 'general': return Info;
      case 'results': return AlertTriangle;
      case 'photo-analysis': return ShieldAlert;
      case 'terms-acceptance': return CheckSquare;
    }
  };

  const Icon = getIcon();

  const getVariant = () => {
    switch (variant) {
      case 'results': return 'destructive';
      case 'photo-analysis': return 'default';
      default: return 'default';
    }
  };

  if (variant === 'general') {
    return (
      <Alert className={cn("border-border bg-muted/30", className)}>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>ℹ️ Herramienta Informativa</strong>
          <p className="mt-1 text-muted-foreground">
            Esta aplicación proporciona recomendaciones basadas en bases de datos públicas 
            y tu configuración personal de restricciones alimentarias.
          </p>
          <p className="mt-2 text-muted-foreground">
            ⚠️ No sustituye el consejo médico profesional. Siempre lee la etiqueta completa del producto antes de consumir.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'results') {
    return (
      <Card className={cn("border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20", className)}>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-base mb-2">
                ⚠️ IMPORTANTE: Lee Esto Antes de Decidir
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-1">✓ Este análisis se basa en:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                    <li>Bases de datos públicas (pueden contener errores)</li>
                    <li>Tu configuración personal de restricciones</li>
                    <li>Detección automatizada de ingredientes</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">❌ Este análisis NO sustituye:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                    <li>Asesoramiento médico o nutricional profesional</li>
                    <li>Lectura completa y cuidadosa de la etiqueta real</li>
                    <li>Consulta con tu médico ante dudas sobre alergias</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-yellow-300 dark:border-yellow-700">
                  <p className="font-bold text-foreground">
                    🔍 SIEMPRE verifica manualmente los ingredientes en el empaque físico.
                  </p>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  <p className="font-semibold">⚖️ DESLINDE DE RESPONSABILIDAD:</p>
                  <p>
                    No nos hacemos responsables de decisiones de consumo basadas únicamente en esta información. 
                    Usa esta herramienta como guía, no como única fuente de verdad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'photo-analysis') {
    return (
      <Card className={cn("border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20", className)}>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-base mb-2">
                🤖 Análisis por Inteligencia Artificial
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-1">⚠️ Este método puede contener errores debido a:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                    <li>Calidad o iluminación de la fotografía</li>
                    <li>Limitaciones del reconocimiento óptico de caracteres (OCR)</li>
                    <li>Errores de interpretación del modelo de IA</li>
                    <li>Texto borroso o mal enfocado</li>
                  </ul>
                </div>

                <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                  <p className="font-semibold text-foreground mb-1">📊 Nivel de confiabilidad:</p>
                  <p className="text-muted-foreground">✓ Escaneo de código de barras: ★★★★★ (Recomendado)</p>
                  <p className="text-muted-foreground">⚠️ Análisis por foto: ★★★☆☆ (Menos confiable)</p>
                </div>

                <div className="pt-2">
                  <p className="font-bold text-foreground">
                    💡 Recomendación: Usa el escáner de código de barras siempre que sea posible para obtener resultados más precisos.
                  </p>
                </div>

                <div className="pt-2 border-t border-orange-300 dark:border-orange-700">
                  <p className="font-semibold text-foreground">
                    🔍 Verifica SIEMPRE los ingredientes manualmente en el empaque.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'terms-acceptance') {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        Al crear una cuenta, confirmo que entiendo que:
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Esta es una herramienta informativa, no un consejo médico</li>
          <li>Debo verificar ingredientes manualmente antes de consumir</li>
          <li>LabelGuard no se responsabiliza por errores en la información</li>
        </ul>
      </div>
    );
  }

  return null;
};
