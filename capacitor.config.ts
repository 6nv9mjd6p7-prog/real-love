import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const productionUrl = 'https://real-love-connections.fetes-rowboat-0k.chatgpt.site';
const serverUrl = process.env.CAPACITOR_SERVER_URL || productionUrl;

if (!serverUrl.startsWith('https://')) {
  throw new Error('CAPACITOR_SERVER_URL must use HTTPS.');
}

const config: CapacitorConfig = {
  appId: 'app.reallove.connections',
  appName: 'Real Love',
  webDir: 'native-shell',
  appendUserAgent: ' RealLoveNative/1.0',
  backgroundColor: '#f5f6fa',
  loggingBehavior: 'none',
  server: {
    url: serverUrl,
    cleartext: false,
    errorPath: 'offline.html',
  },
  ios: {
    allowsLinkPreview: false,
    backgroundColor: '#f5f6fa',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light,
      autoBackdropColor: 'dom',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
