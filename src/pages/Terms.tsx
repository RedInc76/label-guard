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
            <h1 className="text-2xl font-bold text-foreground">Términos y Condiciones de Uso</h1>
            <p className="text-sm text-muted-foreground">Última actualización: Octubre 2025</p>
          </div>
        </div>

        {/* Disclaimer Principal - MANTENER el visual fuerte actual */}
        <Card className="p-6 border-2 border-destructive/30 bg-destructive/5">
          <h2 className="text-xl font-bold text-foreground mb-3">
            ⚠️ AVISO IMPORTANTE
          </h2>
          <div className="space-y-3 text-sm">
            <p className="text-foreground">
              <strong>LabelGuard</strong> es una herramienta informativa que analiza etiquetas de 
              productos alimenticios y ofrece recomendaciones basadas en bases de datos públicas 
              (como Open Food Facts) y las configuraciones personales del usuario.
            </p>
            
            <div className="space-y-2">
              <p className="font-bold text-destructive">La aplicación NO brinda asesoramiento médico, nutricional ni profesional.</p>
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

        {/* Términos y Condiciones - Contenido mejorado */}
        <Card className="p-6">
          <div className="space-y-6 text-sm">
            {/* 1. Aceptación */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">1. Aceptación</h3>
              <p className="text-muted-foreground">
                Al utilizar LabelGuard ("la aplicación"), el usuario acepta estos Términos y 
                Condiciones. Si no está de acuerdo con alguna parte, debe abstenerse de usarla.
              </p>
            </section>

            {/* 2. Naturaleza del servicio */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">2. Naturaleza del Servicio</h3>
              <p className="text-muted-foreground mb-2">
                LabelGuard es una herramienta informativa que analiza etiquetas de productos 
                alimenticios y ofrece recomendaciones basadas en bases de datos públicas (como 
                Open Food Facts) y en la configuración personal del usuario.
              </p>
              <p className="text-muted-foreground mb-2">
                La aplicación proporciona:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Escaneo de códigos de barras para identificar productos</li>
                <li>Análisis de ingredientes mediante IA</li>
                <li>Comparación de ingredientes con restricciones alimentarias personalizadas</li>
                <li>Historial de productos escaneados</li>
                <li>Gestión de productos favoritos</li>
                <li>Insights personalizados de consumo</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>La aplicación NO brinda asesoramiento médico, nutricional ni profesional.</strong>
              </p>
            </section>

            {/* 3. Limitación de responsabilidad */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">3. Limitación de Responsabilidad</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  La información mostrada se basa en fuentes públicas y puede contener errores, 
                  omisiones o datos desactualizados.
                </p>
                <p>
                  <strong>LabelGuard, sus desarrolladores y colaboradores NO asumen responsabilidad 
                  por decisiones de consumo, salud o compra tomadas en base a la aplicación.</strong>
                </p>
                <p>
                  El usuario debe verificar siempre la etiqueta completa del producto antes de 
                  consumirlo o tomar decisiones relacionadas con su salud o dieta.
                </p>
              </div>
            </section>

            {/* 4. Uso responsable */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">4. Uso Responsable</h3>
              <p className="text-muted-foreground mb-2">
                El usuario se compromete a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Utilizar la aplicación únicamente con fines personales y lícitos</li>
                <li>No intentar acceder o modificar información del sistema o sus servidores sin autorización</li>
                <li>No usar LabelGuard con fines comerciales, de distribución o ingeniería inversa</li>
                <li>Mantener sus restricciones alimentarias actualizadas en la aplicación</li>
                <li>Consultar con profesionales de salud sobre sus restricciones alimentarias</li>
              </ul>
            </section>

            {/* 5. Exactitud de la información */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">5. Exactitud de la Información</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <p className="font-semibold">5.1 Bases de Datos de Terceros</p>
                  <p>
                    Utilizamos bases de datos públicas como Open Food Facts. Estas bases de datos son 
                    mantenidas por terceros y pueden contener información desactualizada, incompleta o 
                    incorrecta. No controlamos ni verificamos de forma independiente esta información.
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold">5.2 Análisis por IA</p>
                  <p>
                    El análisis de productos mediante fotografías utiliza inteligencia artificial que 
                    puede cometer errores de interpretación, especialmente con:
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
              </div>
            </section>

            {/* 6. Limitaciones del servicio */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">6. Limitaciones del Servicio</h3>
              <p className="text-muted-foreground mb-2">
                LabelGuard no puede:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Garantizar la exactitud de la información de productos</li>
                <li>Detectar contaminación cruzada en procesos de fabricación</li>
                <li>Identificar ingredientes no declarados en etiquetas</li>
                <li>Proporcionar consejo médico o nutricional personalizado</li>
                <li>Reemplazar la consulta con profesionales de la salud</li>
                <li>Garantizar que un producto es seguro para tu consumo</li>
              </ul>
            </section>

            {/* 7. Datos personales y privacidad */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">7. Datos Personales y Privacidad</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  LabelGuard puede recopilar información mínima de uso (como idioma, ubicación 
                  aproximada o configuraciones de perfil) para mejorar la experiencia del usuario 
                  y el funcionamiento del servicio.
                </p>
                <p>
                  <strong>Tus derechos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Los datos no se venden ni se comparten con terceros, salvo requerimiento legal</li>
                  <li>El usuario puede solicitar la eliminación de sus datos a través del correo de soporte disponible en la aplicación</li>
                  <li>Consulta nuestra <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate('/privacy-policy')}>Política de Privacidad</span> para más detalles sobre el tratamiento de datos</li>
                </ul>
              </div>
            </section>

            {/* 8. Funcionalidades Premium */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">8. Funcionalidades Premium</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Algunas funciones avanzadas (como historial extendido, favoritos o estadísticas 
                  personales) pueden requerir una suscripción.
                </p>
                <p>
                  Antes de cualquier pago, se informarán claramente las condiciones, precios y 
                  modalidades de renovación dentro de la aplicación.
                </p>
              </div>
            </section>

            {/* 9. Enlaces externos */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">9. Enlaces Externos y Servicios de Terceros</h3>
              <p className="text-muted-foreground">
                La aplicación puede incluir enlaces o integrar servicios de terceros (por ejemplo, 
                Google Maps para ubicación de tiendas). LabelGuard no tiene control sobre dichos 
                servicios ni asume responsabilidad por su contenido, políticas de privacidad o 
                tratamiento de datos. El uso de servicios de terceros está sujeto a sus propios 
                términos y condiciones.
              </p>
            </section>

            {/* 10. Modificaciones */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">10. Modificaciones</h3>
              <p className="text-muted-foreground">
                LabelGuard puede actualizar estos Términos y Condiciones en cualquier momento. Las 
                modificaciones entrarán en vigor al publicarse en la aplicación o en su sitio oficial. 
                El uso continuado del servicio después de cambios constituye aceptación de los nuevos términos.
              </p>
            </section>

            {/* 11. Resolución de controversias */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">11. Resolución de Controversias</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Estos Términos se interpretarán conforme a los principios generales de derecho 
                  aplicables a los servicios digitales.
                </p>
                <p>
                  En caso de controversia, las partes buscarán resolverla de forma amistosa y directa 
                  antes de recurrir a cualquier autoridad o instancia legal.
                </p>
              </div>
            </section>

            {/* 12. Contacto */}
            <section>
              <h3 className="text-lg font-bold text-foreground mb-2">12. Contacto</h3>
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