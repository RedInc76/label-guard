import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Términos y Condiciones</h1>
            <p className="text-sm text-muted-foreground">Última actualización: Enero 2025</p>
          </div>
        </div>

        {/* Disclaimer Principal */}
        <Card className="p-6 border-2 border-destructive/30 bg-destructive/5">
          <h2 className="text-xl font-bold text-foreground mb-3">
            ⚠️ DESLINDE DE RESPONSABILIDAD IMPORTANTE
          </h2>
          <div className="space-y-3 text-sm">
            <p className="text-foreground">
              <strong>LabelGuard</strong> es una herramienta informativa diseñada para ayudar 
              a los usuarios a identificar ingredientes en productos alimenticios según sus 
              restricciones personales.
            </p>
            
            <div className="space-y-2">
              <p className="font-bold text-destructive">SIN EMBARGO:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>❌ NO garantizamos la exactitud al 100% de la información mostrada.</li>
                <li>❌ NO somos responsables de errores en bases de datos de terceros.</li>
                <li>❌ NO sustituimos el asesoramiento médico o nutricional profesional.</li>
                <li>❌ NO nos hacemos responsables de reacciones alérgicas o problemas de salud derivados del consumo de productos analizados.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <p className="font-bold text-success">✓ El usuario acepta que es su ÚNICA responsabilidad:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Leer las etiquetas físicas de los productos</li>
                <li>• Consultar con profesionales de salud ante dudas</li>
                <li>• Verificar ingredientes antes de consumir cualquier producto</li>
                <li>• No confiar únicamente en nuestra aplicación para decisiones críticas de salud</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="font-bold text-foreground">
                AL USAR LABELGUARD, ACEPTAS ESTAS LIMITACIONES Y TE COMPROMETES A USAR LA 
                APLICACIÓN DE MANERA RESPONSABLE Y COMPLEMENTARIA A OTRAS FUENTES DE INFORMACIÓN.
              </p>
            </div>
          </div>
        </Card>

        {/* Secciones del documento */}
        <Card className="p-6">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">1. Aceptación de Términos</h3>
              <p className="text-muted-foreground">
                Al acceder y utilizar LabelGuard, aceptas estar sujeto a estos términos y condiciones. 
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la aplicación.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">2. Descripción del Servicio</h3>
              <p className="text-muted-foreground mb-2">
                LabelGuard proporciona:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Escaneo de códigos de barras para identificar productos</li>
                <li>Análisis de ingredientes mediante IA (función premium)</li>
                <li>Comparación de ingredientes con restricciones alimentarias personalizadas</li>
                <li>Historial de productos escaneados (función premium)</li>
                <li>Gestión de productos favoritos (función premium)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">3. Naturaleza Informativa</h3>
              <p className="text-muted-foreground">
                LabelGuard es exclusivamente una herramienta informativa. La información proporcionada 
                no constituye consejo médico, nutricional, o profesional de ningún tipo. Siempre debes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Consultar con profesionales de la salud sobre tu dieta y restricciones</li>
                <li>Leer las etiquetas físicas completas de los productos</li>
                <li>Verificar la información directamente en el empaque</li>
                <li>Consultar al fabricante en caso de dudas sobre alérgenos</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">4. Exactitud de la Información</h3>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-semibold">4.1 Bases de Datos de Terceros</p>
                <p>
                  Utilizamos bases de datos públicas como Open Food Facts. Estas bases de datos son 
                  mantenidas por terceros y pueden contener información desactualizada, incompleta o incorrecta. 
                  No controlamos ni verificamos de forma independiente esta información.
                </p>
                
                <p className="font-semibold mt-3">4.2 Análisis por IA</p>
                <p>
                  El análisis de productos mediante fotografías utiliza inteligencia artificial que puede 
                  cometer errores de interpretación, especialmente con:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
                  <li>Fotos de baja calidad o mal iluminadas</li>
                  <li>Texto pequeño o borroso</li>
                  <li>Ingredientes escritos en múltiples idiomas</li>
                  <li>Formatos de etiquetas no estándar</li>
                </ul>
                <p className="mt-2">
                  El análisis por IA debe considerarse como una referencia preliminar y SIEMPRE debe 
                  verificarse contra la etiqueta física del producto.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">5. Responsabilidades del Usuario</h3>
              <p className="text-muted-foreground mb-2">
                Como usuario de LabelGuard, eres responsable de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Verificar toda la información antes de consumir cualquier producto</li>
                <li>Mantener tus restricciones alimentarias actualizadas en la aplicación</li>
                <li>Consultar con profesionales de salud sobre tus restricciones alimentarias</li>
                <li>Leer las etiquetas físicas completas de todos los productos</li>
                <li>No confiar únicamente en LabelGuard para decisiones críticas de salud</li>
                <li>Usar la aplicación de manera responsable y ética</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">6. Limitaciones del Servicio</h3>
              <p className="text-muted-foreground">
                LabelGuard no puede:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Garantizar la exactitud de la información de productos</li>
                <li>Detectar contaminación cruzada en procesos de fabricación</li>
                <li>Identificar ingredientes no declarados en etiquetas</li>
                <li>Proporcionar consejo médico o nutricional personalizado</li>
                <li>Reemplazar la consulta con profesionales de la salud</li>
                <li>Garantizar que un producto es seguro para tu consumo</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">7. Uso Apropiado</h3>
              <p className="text-muted-foreground">
                LabelGuard está diseñado para ayudarte a identificar potenciales ingredientes problemáticos 
                como una primera línea de referencia. Debe usarse como una herramienta complementaria, 
                nunca como única fuente de información para decisiones relacionadas con tu salud.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">8. Privacidad de Datos</h3>
              <p className="text-muted-foreground">
                Respetamos tu privacidad. Los datos de tus perfiles y restricciones alimentarias se 
                almacenan de forma segura y solo se utilizan para proporcionar el servicio. No vendemos 
                ni compartimos tu información personal con terceros para fines de marketing.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">9. Modificaciones al Servicio</h3>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del 
                servicio en cualquier momento sin previo aviso. También podemos actualizar estos términos 
                y condiciones. El uso continuado del servicio después de cambios constituye aceptación 
                de los nuevos términos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">10. Limitación de Responsabilidad</h3>
              <p className="text-muted-foreground">
                En la máxima medida permitida por la ley, LabelGuard y sus desarrolladores no serán 
                responsables por daños directos, indirectos, incidentales, consecuentes o punitivos 
                que surjan del uso o la imposibilidad de usar el servicio, incluyendo pero no limitado 
                a reacciones alérgicas, problemas de salud, o cualquier otro daño relacionado con el 
                consumo de productos analizados mediante la aplicación.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">11. Contacto</h3>
              <p className="text-muted-foreground">
                Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos a través 
                de los canales de soporte disponibles en la aplicación.
              </p>
            </section>
          </div>
        </Card>

        <div className="text-center pb-6">
          <Button onClick={() => navigate(-1)} variant="outline" size="lg">
            Volver
          </Button>
        </div>
      </div>
    </div>
  );
};
