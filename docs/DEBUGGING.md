# Guía de Debugging para LabelGuard

## Para Usuarios Beta Testers

### ¿Cómo reportar un bug?

Si encuentras un problema durante las pruebas, sigue estos pasos:

#### 1. Abre la Consola del Navegador

- **Chrome/Edge**: Presiona `F12` o `Ctrl+Shift+J` (Windows/Linux) / `Cmd+Option+J` (Mac)
- **Firefox**: Presiona `F12` o `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
- **Safari**: Presiona `Cmd+Option+C` (Mac) - Requiere habilitar menú Desarrollador primero

#### 2. Reproduce el Problema

- Realiza la acción que causa el bug
- Los logs aparecerán automáticamente en la consola con prefijos emoji

#### 3. Captura los Logs

**Opción A: Copiar todos los logs**
1. Haz clic derecho en la consola → "Save as..."
2. Guarda el archivo como `labelguard-logs-[fecha].txt`

**Opción B: Copiar logs específicos**
1. Busca logs con ❌ (errores) o ⚠️ (advertencias)
2. Selecciona y copia los mensajes relevantes

#### 4. Reporta el Bug

Envía un email a [support@labelguard.app] con:
- **Descripción**: Qué estabas haciendo cuando ocurrió
- **Logs**: Adjunta el archivo o pega los logs relevantes
- **Screenshot** (opcional): Captura de pantalla del problema
- **Dispositivo**: Navegador, sistema operativo, modelo de dispositivo (si es móvil)

---

## Para Desarrolladores

### Prefijos de Logs

Todos los logs incluyen prefijos emoji para identificar rápidamente el servicio:

| Prefijo | Servicio | Archivos |
|---------|----------|----------|
| `[Scanner] 📷` | Escaneo de barcode | `Scanner.tsx` |
| `[Results] 💾` | Análisis de productos | `Results.tsx` |
| `[HistoryService] 🔄` | Guardado en historial | `historyService.ts` |
| `[OpenFoodFacts] 📡` | API de OpenFoodFacts | `openFoodFactsService.ts` |
| `[useProfiles] 🔄` | Carga de perfiles | `useProfiles.ts` |
| `[Geolocation] 📍` | Geolocalización | `geolocationService.ts` |

### Tipos de Logs

#### ✅ Logs de Éxito
```typescript
console.log('[Scanner] ✅ Barcode detectado:', { barcode, format });
console.log('[Results] ✅ Análisis completado:', { isCompatible, score });
```

#### ❌ Logs de Error
```typescript
console.error('[HistoryService] ❌ Error en INSERT:', { error, barcode });
console.error('[OpenFoodFacts] ❌ Producto no encontrado:', { barcode });
```

#### 🔍 Logs de Debugging
```typescript
console.log('[Results] 🔍 Evaluando si guardar:', { willSave, isPremium });
console.log('[Scanner] 🔍 Estado de permisos:', { camera: 'granted' });
```

### Logs Críticos para Troubleshooting

#### Problema: Producto no se guarda en historial

**Buscar estos logs:**
```
[Results] 💾 Evaluando si guardar en historial:
  - Verificar que `willSave: true`
  - Verificar que `isPremium: true` (o escaneo desde OpenFoodFacts/cache)

[HistoryService] 📝 Preparando INSERT en scan_history:
  - Verificar que `user_id` no sea null
  - Verificar que `analysis_type` sea válido ('barcode', 'ai_photo', 'ai_cache', 'openfoodfacts')

[HistoryService] ❌ Error en INSERT scan_history:
  - Leer `errorMessage` para identificar constraint violado
  - Leer `errorDetails` para más información del error SQL
```

#### Problema: Perfiles no aparecen

**Buscar estos logs:**
```
[useProfiles] 🔄 Cargando perfiles desde backend...
  - Verificar que se ejecute al entrar a /profile

[useProfiles] ✅ Perfiles cargados:
  - Verificar `count` > 0
  - Verificar que los perfiles tengan los datos correctos
```

#### Problema: Producto no encontrado en OpenFoodFacts

**Buscar estos logs:**
```
[OpenFoodFacts] 📡 API Response:
  - Verificar `status: 200` (éxito) o `status: 404` (no encontrado)

[OpenFoodFacts] 📦 Producto obtenido:
  - Verificar `found: true`
  - Verificar `hasIngredients: true`
```

#### Problema: Filtros de historial no funcionan

**Buscar estos logs:**
```
[History] 🔍 Filtros aplicados:
  - Verificar valores de compatibilityFilter, typeFilter, dateFilter
  - Verificar que filteredHistory.length sea correcto

[History] 🔍 Análisis de tipo de producto:
  - Verificar que analysis_type sea uno de: 'barcode', 'openfoodfacts', 'ai_photo', 'ai_cache'
  - Verificar que agrupación sea correcta:
    - 'scan' → incluye 'barcode' + 'openfoodfacts'
    - 'ai' → incluye 'ai_photo' + 'ai_cache'
```

### Filtrar Logs en Consola

**Por servicio:**
```javascript
// Ver solo logs de Scanner
[Scanner]

// Ver solo logs de HistoryService
[HistoryService]
```

**Por tipo:**
```javascript
// Ver solo errores
❌

// Ver solo éxitos
✅

// Ver solo debugging
🔍
```

### Desactivar Logs en Producción (Futuro)

En v1.15.0+, se agregará un flag de entorno:

**Archivo: `.env`**
```bash
VITE_DEBUG_MODE=false  # Desactiva logs verbose en producción
```

**Implementación:**
```typescript
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
if (DEBUG) console.log('[Service] 🔍 Debug info...');
```

---

## Logs en Base de Datos

LabelGuard también tiene un sistema de logging persistente en Supabase (`application_logs`), gestionado por `loggingService.ts`.

**Diferencias clave:**

| Aspecto | Console Logs | DB Logs |
|---------|--------------|---------|
| **Persistencia** | No persisten (solo sesión actual) | Persisten en Supabase |
| **Costo** | Gratis (solo memoria navegador) | Consumen espacio en DB |
| **Uso** | Debugging en desarrollo/beta | Análisis a largo plazo, auditoría |
| **Activación** | Siempre activos | Requiere `logging_enabled: true` en perfil de usuario |
| **Acceso** | Consola del navegador (F12) | Admin Dashboard → Logs Viewer |

**Cuándo usar cada uno:**

- **Console Logs**: Debugging rápido, troubleshooting de bugs reportados, fase de pruebas
- **DB Logs**: Auditoría de seguridad, análisis de uso, logs de producción críticos

---

## Troubleshooting Común

### "No veo logs en la consola"

1. Verifica que la consola esté abierta (F12)
2. Verifica que no haya filtros activos
3. Recarga la página con `Ctrl+Shift+R`

### "Demasiados logs, no encuentro el error"

1. Usa el filtro de texto en la consola
2. Busca `❌` para ver solo errores
3. Busca `[NombreDelServicio]` para filtrar por componente

### "¿Los logs consumen mucho rendimiento?"

**No.** Los `console.log()` tienen impacto mínimo:
- No bloquean el thread principal
- No hacen llamadas a red
- No consumen espacio en disco (solo RAM del navegador)
- Se limpian automáticamente al cerrar la pestaña

**Recomendación:** Mantener los logs activos durante toda la fase de pruebas.

---

## Reportar Issues en GitHub

Si eres desarrollador y quieres contribuir al proyecto, puedes reportar issues directamente en GitHub incluyendo:

```markdown
### Descripción del Bug
[Descripción clara y concisa del problema]

### Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Ver error

### Logs de Consola
```
[Pegar aquí los logs relevantes de la consola]
```

### Comportamiento Esperado
[Qué debería pasar]

### Comportamiento Actual
[Qué está pasando en realidad]

### Entorno
- Navegador: [ej. Chrome 120]
- Sistema Operativo: [ej. Windows 11]
- Versión de LabelGuard: [ej. 1.14.3]
- Tipo de cuenta: [FREE / PREMIUM]

### Screenshots
[Si aplica, adjuntar capturas de pantalla]
```

---

## Contacto

Para más información sobre debugging o para reportar problemas críticos:
- 📧 Email: support@labelguard.app
- 🐛 GitHub Issues: [repositorio del proyecto]
- 💬 Discord: [servidor de la comunidad]
