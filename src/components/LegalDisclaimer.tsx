import { useState } from 'react';
import { Info, AlertTriangle, ShieldAlert, CheckSquare, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LegalDisclaimerProps {
  variant: 'general' | 'results' | 'photo-analysis' | 'terms-acceptance';
  compact?: boolean;
  className?: string;
}

export const LegalDisclaimer = ({ variant, compact = false, className }: LegalDisclaimerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
        <Card className="border-border bg-muted/30">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="text-sm font-semibold">ℹ️ Herramienta Informativa</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-2 text-sm text-muted-foreground">
              <p>
                Esta aplicación proporciona recomendaciones basadas en bases de datos públicas 
                y tu configuración personal de restricciones alimentarias.
              </p>
              <p>
                ⚠️ No sustituye el consejo médico profesional. Siempre lee la etiqueta completa del producto antes de consumir.
              </p>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (variant === 'results') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
        <Card className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <span className="font-bold text-foreground text-sm">
                ⚠️ IMPORTANTE: Lee Esto Antes de Decidir
              </span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-yellow-600 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (variant === 'photo-analysis') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
        <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="font-bold text-foreground text-sm">
                🤖 Análisis por Inteligencia Artificial
              </span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-orange-600 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
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
          </CollapsibleContent>
        </Card>
      </Collapsible>
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
