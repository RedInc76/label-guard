# Configuración de Autenticación

## URLs de Redirección Requeridas

Para que funcione correctamente el flujo de recuperación de contraseña y confirmación de email, estas URLs deben estar configuradas en la configuración de autenticación de Lovable Cloud.

### ¿Cómo configurar?

1. Abre el panel de Backend en tu proyecto Lovable
2. Ve a la sección de **Autenticación** (Auth)
3. Busca la configuración de **Redirect URLs**
4. Agrega las siguientes URLs según tu entorno:

### Development (Local)
```
http://localhost:5173/reset-password
http://localhost:5173/email-confirmed
```

### Production (Lovable)
```
https://2facda13-c620-41e4-bf45-39f6ddef5bde.lovableproject.com/reset-password
https://2facda13-c620-41e4-bf45-39f6ddef5bde.lovableproject.com/email-confirmed
```

### Custom Domain
Si tienes un dominio personalizado configurado, también agrega:
```
https://tu-dominio.com/reset-password
https://tu-dominio.com/email-confirmed
```

## ¿Por qué es necesario?

Las URLs de redirección son necesarias para:
- **Recuperación de contraseña**: Cuando un usuario hace clic en el enlace del email de recuperación, necesita ser redirigido correctamente a tu aplicación
- **Confirmación de email**: Para verificar la cuenta del usuario después del registro
- **Seguridad**: Supabase solo permite redirecciones a URLs previamente autorizadas

## Troubleshooting

### El enlace me redirige a localhost
- Verifica que hayas agregado la URL de producción en la configuración
- Asegúrate de que el dominio coincida exactamente con el que estás usando

### El enlace muestra una pantalla negra
- Esto indica que la URL no está autorizada
- Agrega la URL correcta en la configuración de Lovable Cloud

### "Invalid redirect URL" error
- Verifica que no haya espacios o caracteres especiales en las URLs configuradas
- Asegúrate de incluir el protocolo (https://)

## Site URL

Además de las Redirect URLs, asegúrate de configurar correctamente el **Site URL** en la configuración de autenticación. Este debe ser:

- **Development**: `http://localhost:5173`
- **Production**: Tu URL de producción de Lovable o tu dominio personalizado

El Site URL es la URL base de tu aplicación y se usa como fallback cuando no se especifica una URL de redirección.
