import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, History, Star, Lock, ChevronRight, FileText, BarChart3, Loader2, Shield, HelpCircle, Smartphone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '@/config/app';

export const Settings = () => {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const { isAdmin, checking } = useAdminCheck();
  const isNative = Capacitor.isNativePlatform();

  const settingsSections = [
    {
      id: 'profile',
      title: 'Perfil y uso',
      icon: User,
      description: 'Gestiona tus perfiles y actividad',
      showAlways: true,
      options: [
        {
          icon: User,
          label: 'Perfiles',
          description: 'Gestiona los perfiles de usuarios',
          path: '/profile',
          showAlways: true,
        },
        {
          icon: History,
          label: 'Historial',
          description: 'Consulta tu historial de escaneos',
          path: '/history',
          badge: 'Premium',
          requiresPremium: true,
        },
        {
          icon: Star,
          label: 'Favoritos',
          description: 'Tus productos favoritos guardados',
          path: '/favorites',
          badge: 'Premium',
          requiresPremium: true,
        },
        {
          icon: BarChart3,
          label: 'Insights Personales',
          description: 'Estadísticas de tus escaneos',
          path: '/insights',
          badge: 'Premium',
          requiresPremium: true,
        },
      ],
    },
  {
    id: 'account',
    title: 'Mi Cuenta',
    icon: User,
    description: 'Gestiona tu cuenta y preferencias',
    showAlways: true,
    options: [
      {
        icon: User,
        label: 'Información de Cuenta',
        description: 'Email, contraseña y opciones de cuenta',
        path: '/account',
      },
    ],
  },
  {
    id: 'device',
    title: 'Permisos y dispositivo',
    icon: Smartphone,
    description: 'Configuración de tu dispositivo',
    showAlways: true,
    alwaysShow: true, // Siempre mostrar sección aunque no tenga opciones
    options: [
      {
        icon: Lock,
        label: 'Permisos',
        description: 'Gestiona permisos de cámara y ubicación',
        path: '/permissions',
        onlyNative: true,
        badge: 'Móvil',
      },
    ],
  },
    {
      id: 'admin',
      title: 'Administración',
      icon: Shield,
      description: 'Gestión y estadísticas del sistema',
      requiresAdmin: true,
      options: [
        {
          icon: Shield,
          label: 'Dashboard Admin',
          description: 'Estadísticas y análisis de uso',
          path: '/admin',
          badge: 'Admin',
        },
      ],
    },
    {
      id: 'help',
      title: 'Ayuda y legal',
      icon: HelpCircle,
      description: 'Soporte y términos de uso',
      showAlways: true,
      options: [
        {
          icon: HelpCircle,
          label: 'Preguntas Frecuentes',
          description: 'Respuestas a dudas comunes',
          path: '/faq',
        },
        {
          icon: FileText,
          label: 'Términos y Condiciones',
          description: 'Lee nuestros términos de uso',
          path: '/terms',
        },
      ],
    },
  ];

  // Función para filtrar opciones dentro de cada sección
  const getVisibleOptions = (options: any[]) => {
    return options.filter((option) => {
      // Opciones solo para nativo: ocultar si no es nativo
      if (option.onlyNative && !isNative) return false;
      
      // Opciones premium: solo mostrar si el usuario es premium
      if (option.requiresPremium && !isPremium) return false;
      
      return true;
    });
  };

// Filtrar secciones visibles
const visibleSections = settingsSections.filter((section) => {
  // Secciones que requieren admin: SOLO mostrar si el usuario ES admin
  if (section.requiresAdmin && !isAdmin) return false;
  
  // Siempre mostrar secciones marcadas como showAlways
  if (section.showAlways) return true;
  
  return false;
}).map((section) => ({
  ...section,
  options: getVisibleOptions(section.options),
})).filter((section) => section.options.length > 0 || section.alwaysShow); // Mostrar secciones con opciones O marcadas como alwaysShow

  if (checking) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona todas las opciones de la aplicación
          </p>
        </div>

        {/* Settings Sections */}
        <Accordion type="single" collapsible className="space-y-4" defaultValue="profile">
          {visibleSections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg overflow-hidden bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3 pt-1">
                <div className="space-y-2">
                  {section.options.map((option) => (
                    <Card
                      key={option.path}
                      className="p-3 hover:bg-accent/50 transition-colors cursor-pointer border-muted"
                      onClick={() => navigate(option.path)}
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">
                              {option.label}
                            </p>
                            {option.badge && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                {option.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                  
                  {/* Versión de la app en la sección de Permisos y dispositivo */}
                  {section.id === 'device' && (
                    <div className="pt-2 mt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground text-center">
                        Versión {APP_VERSION}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Info Card Premium - Movido después de las secciones */}
        {!isPremium && (
          <Card className="p-4 bg-primary/5 border-primary/20 mt-6">
            <p className="text-sm text-muted-foreground text-center">
              Algunas opciones requieren una cuenta Premium
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
