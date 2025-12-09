import process from 'node:process';
import { CapacitorConfig } from '@capacitor/cli';

const WEB_GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID
  || '782358027246-97lk9a4mgfgdaf9f2mrunibcg9ii8f2s.apps.googleusercontent.com';

const IOS_GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_IOS_CLIENT_ID
  || '782358027246-kar0nhpcqbe5hfnmp8j59abp18fka9vm.apps.googleusercontent.com';

const config: CapacitorConfig = {
  appId: 'ng.wazhop.app',
  appName: 'WaZhop',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
    allowNavigation: ['accounts.google.com', 'apis.google.com', 'api.wazhop.ng'],
    // For development, uncomment the following lines and update with your local IP
    // url: 'http://192.168.1.x:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#F97316',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#F97316',
      splashFullScreen: true,
      splashImmersive: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: WEB_GOOGLE_CLIENT_ID,
      iosClientId: IOS_GOOGLE_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
    StatusBar: {
      style: 'LIGHT',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
      scrollAssist: true,
      disableScroll: false,
    },
    App: {
      // Handle app state changes
    }
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  }
};

export default config;
