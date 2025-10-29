import { useState } from 'react';
import { ScanHistoryItem } from '@/services/historyService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Camera, Copy, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: ScanHistoryItem[];
  onComplete: () => void;
}

export const ShoppingListDialog = ({
  open,
  onOpenChange,
  selectedItems,
  onComplete,
}: ShoppingListDialogProps) => {
  const [listName, setListName] = useState('Lista de compras');
  const [isSharing, setIsSharing] = useState(false);

  const generateShareableText = () => {
    let text = `🛒 ${listName}\n\n`;
    
    selectedItems.forEach((item, index) => {
      text += `✅ ${item.product_name}\n`;
      if (item.brands) {
        text += `   Marca: ${item.brands}\n`;
      }
      if (index < selectedItems.length - 1) {
        text += '\n';
      }
    });
    
    text += `\n📦 Total: ${selectedItems.length} producto${selectedItems.length !== 1 ? 's' : ''}`;
    
    return text;
  };

  const handleShare = async () => {
    const text = generateShareableText();
    const isNative = Capacitor.isNativePlatform();
    
    try {
      setIsSharing(true);
      
      if (isNative) {
        // Usar plugin de Capacitor en apps nativas
        await Share.share({
          text: text,
          title: listName,
          dialogTitle: 'Compartir lista de compras',
        });
      } else {
        // Usar Web Share API en navegador
        if (navigator.share) {
          await navigator.share({
            text: text,
            title: listName,
          });
        }
      }
      
      toast({
        title: "¡Lista compartida!",
        description: "Se compartió exitosamente",
      });
      onComplete();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({
          title: "Error al compartir",
          description: "Intenta copiar el texto en su lugar",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = async () => {
    const text = generateShareableText();
    
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "¡Lista copiada!",
        description: "Se copió al portapapeles",
      });
      onComplete();
    } catch (error) {
      console.error('Error copying:', error);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const isNative = Capacitor.isNativePlatform();
  const hasShareAPI = isNative || (typeof navigator !== 'undefined' && !!navigator.share);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lista de compras</DialogTitle>
          <DialogDescription>
            Edita el nombre y comparte tu lista
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Nombre de la lista"
              className="text-base"
            />
          </div>

          <ScrollArea className="max-h-[300px] rounded-md border p-4">
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {item.image_url || item.front_photo_url ? (
                      <img
                        src={item.image_url || item.front_photo_url || ''}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.product_name}
                    </p>
                    {item.brands && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.brands}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground text-center">
            📦 {selectedItems.length} producto{selectedItems.length !== 1 ? 's' : ''} seleccionado{selectedItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {hasShareAPI && (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
          )}
          <Button
            onClick={handleCopyText}
            variant="outline"
            className="w-full"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar texto
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
