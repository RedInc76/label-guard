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
    question: "¿Cómo se calcula el score de compatibilidad?",
    answer: "El score de compatibilidad es calculado por Label Guard basándose en tus perfiles activos:\n\n• Comienza en 100 puntos\n• Cada violación resta puntos según la categoría:\n  - Alérgenos y restricciones religiosas: -30 puntos\n  - Salud y dieta: -20 puntos\n  - Otras restricciones: -10 puntos\n• Cada advertencia resta 5 puntos adicionales\n\nEl resultado final determina la recomendación:\n🟢 80-100: Excelente\n🟡 60-79: Aceptable\n🟠 40-59: Precaución\n🔴 0-39: No recomendado\n\nEste sistema te permite comparar productos y tomar decisiones informadas según tus necesidades específicas."
  },
  {
    question: "¿Qué son los niveles de severidad?",
    answer: "Algunas restricciones permiten configurar niveles de severidad para determinar qué tan estricto es el análisis. Esto solo aplica a restricciones donde se pueden detectar trazas, derivados o contaminación cruzada:\n\n🟢 Leve: Tolera trazas y menciones como 'puede contener'\n🟡 Moderado: Rechaza ingredientes directos y trazas explícitas (recomendado)\n🔴 Severo: Rechaza cualquier mención, incluso contaminación cruzada (ideal para alergias graves)\n\n💡 Las restricciones que NO permiten niveles de severidad son binarias: el producto es apto o no es apto."
  },
  {
    question: "¿Qué restricciones tienen niveles de severidad?",
    answer: "Solo 11 restricciones permiten configurar niveles de severidad (detectan trazas y derivados):\n\n🔴 Alérgenos principales (8):\n• Sin Gluten\n• Sin Lactosa\n• Sin Frutos Secos\n• Sin Soja\n• Sin Huevo\n• Sin Pescado\n• Sin Mariscos\n• Sin Sésamo\n\n🕌 Restricciones religiosas (3):\n• Sin Cerdo\n• Halal\n• Kosher\n\n✅ Las otras 20 restricciones son binarias (apto/no apto): Si el ingrediente está presente, el producto no es apto. Esto incluye restricciones de dieta (vegano, keto, etc.) y salud (bajo en azúcar, sin conservantes, etc.)."
  },
  {
    question: "¿Cuántos perfiles puedo crear?",
    answer: "• Modo invitado (sin registro): 1 perfil\n• Modo registrado (gratuito): Hasta 5 perfiles\n\nCada perfil puede tener múltiples restricciones activas simultáneamente. Los perfiles te permiten gestionar diferentes necesidades (por ejemplo: un perfil para ti, otro para tu hijo con alergias, etc.)."
  },
  {
    question: "¿Cómo funciona el análisis con IA?",
    answer: "Cuando escaneas una etiqueta con la cámara, Label Guard utiliza inteligencia artificial para:\n\n1. 📸 Leer y extraer el texto de los ingredientes directamente de la foto\n2. 🔍 Identificar cada ingrediente listado en la etiqueta\n3. ⚠️ Detectar alérgenos y advertencias\n4. ✅ Analizar la compatibilidad con tus restricciones\n\nLa IA funciona de dos formas:\n• Análisis directo: Lee la foto en tiempo real\n• Análisis optimizado: Si otro usuario ya escaneó ese producto antes, reutiliza la información para darte resultados más rápidos\n\n💡 Recuerda: La IA solo puede detectar lo que está visible en la etiqueta. Si un ingrediente no aparece listado, no puede ser detectado."
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

      </div>
    </div>
  );
};
