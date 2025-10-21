import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldAlert } from 'lucide-react';

interface InitialDisclaimerDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const InitialDisclaimerDialog = ({ 
  isOpen: controlledIsOpen, 
  onOpenChange: controlledOnOpenChange 
}: InitialDisclaimerDialogProps = {}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  // Use controlled props if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  
  useEffect(() => {
    // Only check localStorage if not externally controlled
    if (controlledIsOpen === undefined) {
      const hideDisclaimer = localStorage.getItem('hideInitialDisclaimer');
      if (hideDisclaimer !== 'true') {
        setInternalIsOpen(true);
      }
    }
  }, [controlledIsOpen]);
  
  const handleAccept = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideInitialDisclaimer', 'true');
    }
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Aviso Importante
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            {/* Mensaje del disclaimer */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-foreground text-sm leading-relaxed">
                Esta aplicación proporciona <strong>recomendaciones basadas en datos públicos</strong> y tu configuración personal.
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                ⚠️ <strong>No sustituye el consejo médico profesional.</strong>
              </p>
              <p>
                ✓ <strong>Siempre lee la etiqueta completa del producto antes de consumir.</strong>
              </p>
              <p className="text-xs pt-2 border-t">
                Usa esta herramienta como guía complementaria, no como única fuente de decisión.
              </p>
            </div>
            
            {/* Checkbox "No volver a mostrar" */}
            <div className="flex items-start gap-2 pt-2">
              <Checkbox 
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label 
                htmlFor="dont-show" 
                className="text-sm text-muted-foreground cursor-pointer leading-tight"
              >
                No volver a mostrar este mensaje
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button onClick={handleAccept} className="w-full">
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
