import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labelguard.app',
  appName: 'LabelGuard',
  webDir: 'dist',
  version: '1.14.8',
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    BarcodeScanner: {
      // ML Kit Barcode Scanner configuration
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;