import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

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
      if (Capacitor.isNativePlatform()) {
        // USAR PLUGIN NATIVO EN MÓVIL
        console.log('[Geolocation] Usando plugin nativo de Capacitor');
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 30000
        });
        
        console.log('[Geolocation] ✅ Ubicación obtenida (nativo):', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        return {
          success: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        };
      } else {
        // WEB: Usar HTML5 Geolocation
        console.log('[Geolocation] Usando HTML5 Geolocation API');
        
        if (!('geolocation' in navigator)) {
          console.error('[Geolocation] API no disponible en este dispositivo');
          return { success: false, error: 'Geolocation API no disponible' };
        }

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
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 30000
            }
          );
        });

        return {
          success: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          permissionState
        };
      }
    } catch (error: any) {
      const errorMessage = error.code 
        ? `Error ${error.code}: ${error.message}`
        : error.message || 'Error desconocido al obtener ubicación';
      
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
      if (Capacitor.isNativePlatform()) {
        // USAR PLUGIN NATIVO
        const permission = await Geolocation.checkPermissions();
        return permission.location === 'granted';
      } else {
        // WEB: Navigator permissions
        if (!('permissions' in navigator)) {
          return false;
        }

        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return result.state === 'granted';
      }
    } catch (error) {
      console.error('[Geolocation] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Solicitar permisos de ubicación (solo nativo)
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        console.log('[Geolocation] Solicitando permisos nativos...');
        const permission = await Geolocation.requestPermissions();
        const granted = permission.location === 'granted';
        console.log('[Geolocation] Permisos:', granted ? 'CONCEDIDOS' : 'DENEGADOS');
        return granted;
      }
      // En web, los permisos se solicitan automáticamente al llamar getCurrentPosition
      return false;
    } catch (error) {
      console.error('[Geolocation] Error requesting permissions:', error);
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
