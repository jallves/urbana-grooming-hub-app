import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d8077827f7c84ebd8463ec535c4f64a5',
  appName: 'barbeariacostaurbana',
  webDir: 'dist',
  server: {
    url: 'https://d8077827-f7c8-4ebd-8463-ec535c4f64a5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
