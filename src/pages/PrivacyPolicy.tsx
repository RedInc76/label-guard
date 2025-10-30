import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Política de Privacidad</h1>
            <p className="text-sm text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Datos que Recopilamos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Para proporcionar nuestros servicios, recopilamos:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>Email:</strong> Obligatorio para crear tu cuenta y acceder a la aplicación</li>
                <li><strong>Información personal opcional:</strong> Nombre completo, fecha de nacimiento, país y ciudad (solo si decides proporcionarlos)</li>
                <li><strong>Historial de escaneos:</strong> Productos que has analizado con nuestra aplicación</li>
                <li><strong>Perfiles de restricciones:</strong> Tus preferencias y restricciones alimentarias configuradas</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Uso de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Utilizamos tus datos para:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Proporcionar todas las funcionalidades de la aplicación</li>
                <li>Analizar productos según tus restricciones personales</li>
                <li>Generar estadísticas comunitarias anónimas (solo si das tu consentimiento)</li>
                <li>Mejorar continuamente nuestros servicios</li>
                <li>Comunicarte información importante sobre tu cuenta</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Protección de Datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Tu privacidad es nuestra prioridad:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Todos tus datos están encriptados y almacenados de forma segura</li>
                <li><strong>NO vendemos</strong> tus datos personales a terceros</li>
                <li><strong>NO compartimos</strong> tu información con empresas externas con fines comerciales</li>
                <li>Solo accedemos a tus datos para proporcionarte el servicio</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4. Tus Derechos (GDPR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>De acuerdo con el Reglamento General de Protección de Datos (GDPR), tienes derecho a:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong>Acceso:</strong> Consultar todos tus datos almacenados en cualquier momento</li>
                <li><strong>Rectificación:</strong> Modificar o corregir tu información personal</li>
                <li><strong>Supresión:</strong> Eliminar tu cuenta y todos tus datos de forma permanente</li>
                <li><strong>Portabilidad:</strong> Solicitar una copia de tus datos en formato legible</li>
                <li><strong>Oposición:</strong> Retirar consentimientos otorgados previamente</li>
              </ul>
              <p className="pt-2">
                Puedes ejercer estos derechos directamente desde la configuración de tu cuenta o contactándonos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">5. Estadísticas Comunitarias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Si otorgas tu consentimiento, utilizamos datos <strong>completamente anónimos</strong> para:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Entender tendencias alimentarias generales</li>
                <li>Mejorar nuestras recomendaciones de productos</li>
                <li>Crear insights útiles para toda la comunidad</li>
                <li>Desarrollar nuevas funcionalidades basadas en necesidades reales</li>
              </ul>
              <p className="pt-2 font-semibold">
                Importante: Los datos se anonimizan completamente antes de cualquier análisis. 
                Es imposible identificarte personalmente en las estadísticas comunitarias.
              </p>
              <p>
                Puedes retirar este consentimiento en cualquier momento desde tu perfil, sin afectar 
                el uso de la aplicación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6. Cambios en esta Política</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Nos reservamos el derecho de actualizar esta política de privacidad. 
                Cualquier cambio significativo será comunicado mediante:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Notificación por email a tu cuenta registrada</li>
                <li>Aviso destacado en la aplicación</li>
                <li>Actualización de la fecha en esta página</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7. Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Si tienes preguntas sobre esta política de privacidad, el tratamiento de tus datos, 
                o deseas ejercer tus derechos, puedes contactarnos:
              </p>
              <div className="pt-2">
                <p className="font-semibold">Email de contacto:</p>
                <p className="text-primary">soporte@tuapp.com</p>
              </div>
              <p className="pt-2 text-xs">
                Responderemos a tu solicitud en un plazo máximo de 30 días, conforme a la legislación vigente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Nota legal:</strong> Esta política de privacidad se rige por el Reglamento General 
                de Protección de Datos (GDPR - UE 2016/679) y demás legislación aplicable en materia de 
                protección de datos personales.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
