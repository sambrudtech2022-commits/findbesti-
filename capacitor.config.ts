import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.livestars',
  appName: 'Livestars',
  webDir: 'dist',
  server: {
    url: 'https://80f205be-8ffa-4726-a847-d67024a67c51.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
