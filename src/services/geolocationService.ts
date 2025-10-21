import { Capacitor } from '@capacitor/core';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export class GeolocationService {
  /**
   * Capturar ubicación actual del dispositivo
   * Funciona en web (HTML5 Geolocation) y nativo (Capacitor Geolocation)
   */
  static async getCurrentLocation(): Promise<Location | null> {
    try {
      // Verificar si Geolocation está disponible
      if (!('geolocation' in navigator)) {
        console.warn('Geolocation not supported');
        return null;
      }

      // Solicitar ubicación con timeout de 10 segundos
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 segundos
            maximumAge: 60000 // Cache de 1 minuto
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (error) {
      console.warn('Error getting location:', error);
      // No lanzar error, solo retornar null
      // La ubicación es opcional, no debe bloquear el escaneo
      return null;
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
