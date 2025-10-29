import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "¿Para qué sirve Label Guard?",
    answer: "Label Guard es una aplicación que te ayuda a verificar si los productos alimenticios son compatibles con tus restricciones dietéticas personales. Escanea códigos de barras o toma fotos de las etiquetas para obtener análisis instantáneos basados en tus perfiles configurados."
  },
  {
    question: "¿Puedo escanear sin un perfil activo?",
    answer: "Sí, puedes escanear productos sin un perfil activo. En ese caso, la app te mostrará la información nutricional y los ingredientes del producto, pero no realizará un análisis de compatibilidad con restricciones específicas. Para obtener análisis personalizados, debes crear y activar al menos un perfil."
  },
  {
    question: "¿Qué es Nutri-Score?",
    answer: "Nutri-Score es un sistema de etiquetado nutricional frontal que clasifica los alimentos de la A (más saludable) a la E (menos saludable) según su valor nutricional. Tiene en cuenta nutrientes positivos (fibra, proteínas, frutas/verduras) y negativos (calorías, grasas saturadas, azúcares, sal)."
  },
  {
    question: "¿Qué es NOVA?",
    answer: "NOVA es una clasificación que categoriza los alimentos según su nivel de procesamiento:\n• Grupo 1: Alimentos sin procesar o mínimamente procesados\n• Grupo 2: Ingredientes culinarios procesados\n• Grupo 3: Alimentos procesados\n• Grupo 4: Productos ultraprocesados\n\nUn grupo NOVA más alto generalmente indica mayor procesamiento industrial."
  },
  {
    question: "¿Qué es OpenFoodFacts?",
    answer: "OpenFoodFacts es una base de datos colaborativa y abierta de productos alimenticios de todo el mundo. Contiene información sobre ingredientes, alérgenos, valores nutricionales y más. Label Guard utiliza esta base de datos para obtener información de productos escaneados mediante código de barras."
  },
  {
    question: "¿Cómo funciona el análisis de productos?",
    answer: "Label Guard analiza productos de dos formas:\n\n1. Escaneo de código de barras: Busca el producto en OpenFoodFacts y obtiene sus ingredientes y datos nutricionales.\n\n2. Análisis por IA con foto: Si el producto no está en OpenFoodFacts o quieres analizar la etiqueta directamente, la IA lee la foto y extrae los ingredientes.\n\n⚠️ Importante: El análisis solo puede detectar ingredientes que estén listados en la etiqueta o en la base de datos. Si un ingrediente no aparece, no puede ser detectado."
  },
  {
    question: "¿Qué son los niveles de severidad?",
    answer: "Los niveles de severidad determinan qué tan estricto es el análisis:\n\n🟢 Leve: Tolera trazas y menciones como 'puede contener'\n🟡 Moderado: Rechaza ingredientes directos y trazas explícitas (recomendado)\n🔴 Severo: Rechaza cualquier mención, incluso contaminación cruzada (ideal para alergias graves)"
  },
  {
    question: "¿Cuántos perfiles puedo crear?",
    answer: "• Modo gratuito: Puedes crear hasta 3 perfiles\n• Modo Premium: Sin límite de perfiles\n\nCada perfil puede tener múltiples restricciones activas simultáneamente."
  },
  {
    question: "¿Cómo se calculan los análisis con IA?",
    answer: "El análisis con IA incluye:\n• Análisis directo de fotos de etiquetas (ai_photo)\n• Análisis desde cache (ai_cache) - cuando un producto ya fue analizado anteriormente\n\nAmbos se agrupan como 'Análisis con IA' en tus estadísticas para simplificar la información."
  }
];

export const FAQ = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Preguntas Frecuentes</h1>
          <p className="text-muted-foreground">
            Encuentra respuestas a las dudas más comunes sobre Label Guard
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground whitespace-pre-line">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Help Section */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground text-center">
            ¿Tienes más preguntas? Contáctanos desde la sección de configuración
          </p>
        </Card>
      </div>
    </div>
  );
};
