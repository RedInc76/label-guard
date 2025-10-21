import { Capacitor } from '@capacitor/core';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationResult {
  success: boolean;
  location?: Location;
  error?: string;
  permissionState?: PermissionState;
}

export class GeolocationService {
  /**
   * Capturar ubicación actual del dispositivo
   * Funciona en web (HTML5 Geolocation) y nativo (Capacitor Geolocation)
   */
  static async getCurrentLocation(): Promise<LocationResult> {
    console.log('[Geolocation] Iniciando captura de ubicación...');
    
    try {
      // 1. Verificar soporte
      if (!('geolocation' in navigator)) {
        console.error('[Geolocation] API no disponible en este dispositivo');
        return { success: false, error: 'Geolocation API no disponible' };
      }

      // 2. Verificar permisos previos
      let permissionState: PermissionState | undefined;
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        permissionState = permission.state;
        console.log('[Geolocation] Estado de permisos:', permissionState);
        
        if (permissionState === 'denied') {
          return { 
            success: false, 
            error: 'Permisos de ubicación denegados',
            permissionState 
          };
        }
      } catch (e) {
        console.log('[Geolocation] No se pudo verificar permisos (normal en algunos navegadores)');
      }

      // 3. Solicitar ubicación
      console.log('[Geolocation] Solicitando ubicación al dispositivo...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('[Geolocation] ✅ Ubicación obtenida:', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            resolve(pos);
          },
          (err) => {
            console.error('[Geolocation] ❌ Error al obtener ubicación:', err.code, err.message);
            reject(err);
          },
          {
            enableHighAccuracy: false, // false = más rápido, menos batería
            timeout: 30000, // 30 segundos (móviles son lentos)
            maximumAge: 30000 // Cache de 30 segundos
          }
        );
      });

      const result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      console.log('[Geolocation] ✅ Ubicación capturada exitosamente');
      return { success: true, location: result, permissionState };
      
    } catch (error: any) {
      const errorMessage = error.code 
        ? `Error ${error.code}: ${error.message}`
        : 'Error desconocido al obtener ubicación';
      
      console.error('[Geolocation] ❌ Captura falló:', errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Verificar si tenemos permisos de ubicación
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      if (!('permissions' in navigator)) {
        return false;
      }

      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      // Si no podemos verificar, asumimos que no hay permisos
      return false;
    }
  }

  /**
   * Abrir Google Maps con las coordenadas
   * Funciona en web y móvil
   */
  static openInMaps(latitude: number, longitude: number, label?: string): void {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // En móvil, intentar abrir la app de mapas nativa
      const iosUrl = `maps://?q=${latitude},${longitude}`;
      const androidUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      
      // Intentar abrir URL nativa, si falla usar Google Maps web
      const platform = Capacitor.getPlatform();
      const url = platform === 'ios' ? iosUrl : androidUrl;
      
      window.open(url, '_system');
    } else {
      // En web, usar click programático en elemento <a> para mejor compatibilidad con CSP
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Formatear coordenadas para mostrar en UI
   */
  static formatCoordinates(latitude: number, longitude: number): string {
    const lat = latitude.toFixed(6);
    const lng = longitude.toFixed(6);
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lngDir = longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(Number(lat))}° ${latDir}, ${Math.abs(Number(lng))}° ${lngDir}`;
  }
}
