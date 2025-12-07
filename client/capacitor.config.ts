import { CapacitorConfig } from '@capacitor/cli';

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
      serverClientId: '428698442868-b4f26t11d2l1rsmijqcv29mnn7itcrn8.apps.googleusercontent.com',
      iosClientId: '782358027246-kar0nhpcqbe5hfnmp8j59abp18fka9vm.apps.googleusercontent.com',
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
