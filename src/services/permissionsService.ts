import { CameraService } from './cameraService';
import { GeolocationService } from './geolocationService';

export interface PermissionsStatus {
  camera: boolean;
  location: boolean;
}

export class PermissionsService {
  private static readonly ONBOARDING_KEY = 'labelguard_permissions_onboarding_completed';

  /**
   * Solicitar ambos permisos de una vez
   */
  static async requestAllPermissions(): Promise<PermissionsStatus> {
    try {
      // Primero solicitar cámara (más crítico)
      const cameraGranted = await CameraService.requestPermissions();
      
      // Luego solicitar ubicación (opcional)
      const locationGranted = await GeolocationService.checkPermissions();
      
      return {
        camera: cameraGranted,
        location: locationGranted
      };
    } catch (error) {
      console.error('[PermissionsService] Error requesting permissions:', error);
      return {
        camera: false,
        location: false
      };
    }
  }

  /**
   * Verificar estado de todos los permisos
   */
  static async checkAllPermissions(): Promise<PermissionsStatus> {
    try {
      const camera = await CameraService.checkPermissions();
      const location = await GeolocationService.checkPermissions();
      
      return { camera, location };
    } catch (error) {
      console.error('[PermissionsService] Error checking permissions:', error);
      return {
        camera: false,
        location: false
      };
    }
  }

  /**
   * Verificar si ya se completó el onboarding
   */
  static hasCompletedOnboarding(): boolean {
    try {
      const completed = localStorage.getItem(this.ONBOARDING_KEY);
      return completed === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Marcar onboarding como completado
   */
  static markOnboardingComplete(): void {
    try {
      localStorage.setItem(this.ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('[PermissionsService] Error saving onboarding state:', error);
    }
  }

  /**
   * Resetear onboarding (útil para testing)
   */
  static resetOnboarding(): void {
    try {
      localStorage.removeItem(this.ONBOARDING_KEY);
    } catch (error) {
      console.error('[PermissionsService] Error resetting onboarding:', error);
    }
  }

  /**
   * Abrir configuración de permisos del sistema
   */
  static async openSystemSettings(): Promise<void> {
    try {
      await CameraService.openSettings();
    } catch (error) {
      console.error('[PermissionsService] Error opening settings:', error);
    }
  }
}
