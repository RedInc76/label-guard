import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

export class CameraService {
  /**
   * Verifica si el módulo de Google Barcode Scanner está disponible
   */
  static async isModuleAvailable(): Promise<boolean> {
    try {
      const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      return available;
    } catch (error) {
      console.error('Error checking module availability:', error);
      return false;
    }
  }

  /**
   * Instala el módulo de Google Barcode Scanner con seguimiento de progreso
   */
  static async installModule(
    onProgress?: (progress: any) => void
  ): Promise<boolean> {
    try {
      let progressListener: any;
      
      if (onProgress) {
        progressListener = await BarcodeScanner.addListener(
          'googleBarcodeScannerModuleInstallProgress',
          (event) => {
            console.log('Installation progress:', event);
            onProgress(event);
          }
        );
      }

      await BarcodeScanner.installGoogleBarcodeScannerModule();
      
      if (progressListener) {
        await progressListener.remove();
      }
      
      return true;
    } catch (error) {
      console.error('Error installing barcode scanner module:', error);
      return false;
    }
  }

  /**
   * Escanea un código de barras usando la cámara del dispositivo
   * Usa Google ML Kit para detección precisa y en tiempo real
   */
  static async scanBarcode(
    onInstallProgress?: (progress: any) => void
  ): Promise<string | null> {
    try {
      // Verificar si el dispositivo soporta escaneo
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        throw new Error('Tu dispositivo no soporta escaneo de códigos de barras');
      }

      // Verificar/solicitar permisos
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Se requiere permiso de cámara para escanear');
      }

      // Verificar si el módulo está instalado
      const isAvailable = await this.isModuleAvailable();
      
      if (!isAvailable) {
        console.log('Módulo no disponible, solicitando instalación...');
        
        const installed = await this.installModule(onInstallProgress);
        
        if (!installed) {
          throw new Error('Se requiere instalar el módulo de Google Barcode Scanner. Por favor intenta de nuevo.');
        }
        
        console.log('Módulo instalado correctamente');
      }

      // Realizar escaneo modal (modo simple con UI nativa)
      const { barcodes } = await BarcodeScanner.scan({
        formats: [
          BarcodeFormat.Ean13,    // Códigos de productos europeos (13 dígitos)
          BarcodeFormat.Ean8,     // Códigos de productos europeos (8 dígitos)
          BarcodeFormat.UpcA,     // Códigos de productos americanos (12 dígitos)
          BarcodeFormat.UpcE,     // Códigos UPC-E
          BarcodeFormat.Code128,  // Códigos industriales
          BarcodeFormat.Code39,   // Códigos industriales
          BarcodeFormat.QrCode,   // Códigos QR (por si acaso)
        ],
      });

      // Si se detectó al menos un código, retornar el primero
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        console.log('Código detectado:', barcode.rawValue, 'Formato:', barcode.format);
        return barcode.rawValue;
      }

      return null;
    } catch (error) {
      console.error('Error scanning barcode:', error);
      throw error;
    }
  }

  /**
   * Solicita permisos de cámara
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Verifica si ya tenemos permisos de cámara
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  /**
   * Abre la configuración de la app para que el usuario pueda dar permisos
   */
  static async openSettings(): Promise<void> {
    await BarcodeScanner.openSettings();
  }
}