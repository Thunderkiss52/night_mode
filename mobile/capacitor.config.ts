import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nightmode.app',
  appName: 'Night Mode',
  webDir: '../.next',
  server: {
    url: process.env.NM_WEBVIEW_URL || 'https://night-mode.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  }
};

export default config;
