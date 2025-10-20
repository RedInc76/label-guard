import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2facda13c62041e4bf4539f6ddef5bde',
  appName: 'LabelGuard',
  webDir: 'dist',
  server: {
    url: 'https://2facda13-c620-41e4-bf45-39f6ddef5bde.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    BarcodeScanner: {
      // ML Kit Barcode Scanner configuration
    }
  }
};

export default config;