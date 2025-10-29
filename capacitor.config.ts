import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2facda13c62041e4bf4539f6ddef5bde',
  appName: 'LabelGuard',
  webDir: 'dist',
  version: '1.7.2',
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