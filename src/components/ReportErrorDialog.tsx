import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ErrorReportsService, ERROR_CATEGORIES, type ErrorCategory, type CreateReportData } from '@/services/errorReportsService';
import type { ProductInfo, AnalysisResult, Profile } from '@/types/restrictions';

interface ReportErrorDialogProps {
  product: ProductInfo;
  analysis: AnalysisResult;
  activeProfiles: Profile[];
}

export const ReportErrorDialog = ({ product, analysis, activeProfiles }: ReportErrorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Error',
        description: 'Selecciona una categoría de error',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const reportData: CreateReportData = {
        error_category: selectedCategory,
        user_description: description.trim() || undefined,
        product,
        analysis,
        activeProfiles,
      };

      await ErrorReportsService.createReport(reportData);

      toast({
        title: '✅ Reporte enviado',
        description: 'Gracias por ayudarnos a mejorar. Revisaremos tu reporte pronto.',
      });

      setOpen(false);
      setSelectedCategory(null);
      setDescription('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar el reporte',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          🚨 Reportar Error
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Error de Análisis</DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar reportando errores en el análisis de productos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.product_name}</p>
                {product.brands && (
                  <p className="text-xs text-muted-foreground truncate">{product.brands}</p>
                )}
                {product.code && (
                  <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Category Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">¿Qué tipo de error encontraste?</Label>
            <RadioGroup
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value as ErrorCategory)}
              className="space-y-2"
            >
              {Object.entries(ERROR_CATEGORIES).map(([key, info]) => (
                <div
                  key={key}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedCategory === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <label htmlFor={key} className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{info.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {info.description}
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el error que encontraste (ej: 'La app dice que tiene lactosa pero en el empaque no aparece')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caracteres
            </p>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> Tu reporte incluirá el análisis completo y tus perfiles activos para que podamos revisarlo en detalle.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCategory || submitting}
            className="flex-1"
          >
            {submitting ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
