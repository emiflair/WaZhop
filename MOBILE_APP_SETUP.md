# WaZhop Mobile App Setup Guide

This guide will help you convert the WaZhop web app into native iOS and Android mobile applications using Capacitor.

## Prerequisites

### For Both Platforms
- Node.js (v16 or higher)
- npm or yarn
- A code editor (VS Code recommended)

### For iOS Development
- macOS (required)
- Xcode 14 or later (download from Mac App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for deployment to App Store)

### For Android Development
- Android Studio (download from https://developer.android.com/studio)
- Java Development Kit (JDK) 17 or later
- Android SDK (comes with Android Studio)
- Google Developer Account (for deployment to Play Store)

## Initial Setup

### 1. Install Dependencies

Navigate to the client directory:

```bash
cd client
npm install
```

This will install all Capacitor dependencies including:
- @capacitor/core
- @capacitor/cli
- @capacitor/ios
- @capacitor/android
- @capacitor/app
- @capacitor/splash-screen
- @capacitor/status-bar
- @capacitor/keyboard
- @capacitor/haptics

### 2. Build Your Web App

Before adding mobile platforms, build your web application:

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### 3. Add Mobile Platforms

#### Add iOS Platform
```bash
npm run cap:add:ios
```

#### Add Android Platform
```bash
npm run cap:add:android
```

**Note:** You only need to run these commands once. They create the native project folders.

## Development Workflow

### Building and Syncing

After making changes to your web app, follow this workflow:

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync changes to mobile platforms:**
   ```bash
   npm run cap:sync
   ```
   
   Or sync to a specific platform:
   ```bash
   npm run cap:sync:ios
   npm run cap:sync:android
   ```

3. **Quick build and sync:**
   ```bash
   npm run build:mobile
   ```

### Opening Native IDEs

#### Open iOS Project in Xcode
```bash
npm run cap:open:ios
```

#### Open Android Project in Android Studio
```bash
npm run cap:open:android
```

### Live Reload (Development Mode)

For faster development, you can use live reload:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Find your local IP address:
   - macOS/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

3. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_LOCAL_IP:5173',
     cleartext: true
   }
   ```

4. Sync and run:
   ```bash
   npm run cap:sync
   npm run cap:run:ios
   # or
   npm run cap:run:android
   ```

**Important:** Remember to remove the `server.url` configuration before building for production!

## iOS Configuration

### 1. Open Xcode
```bash
npm run cap:open:ios
```

### 2. Configure App Settings

In Xcode:
- Select the project in the left sidebar
- Go to "Signing & Capabilities"
- Select your development team
- Update the Bundle Identifier if needed (default: `ng.wazhop.app`)

### 3. Add App Icons and Splash Screens

Place your app icons in:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

Required sizes:
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

### 4. Update Info.plist

Edit `ios/App/App/Info.plist` to add permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to upload product images</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to upload product images</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need location to show you nearby shops</string>
```

### 5. Build and Run

In Xcode:
- Select a simulator or connected device
- Click the "Play" button or press `Cmd + R`

### 6. Deploy to TestFlight/App Store

1. Archive your app: Product → Archive
2. Validate the archive
3. Distribute to TestFlight or App Store Connect
4. Complete App Store Connect metadata and submit for review

## Android Configuration

### 1. Open Android Studio
```bash
npm run cap:open:android
```

### 2. Configure App Settings

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "ng.wazhop.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 3. Add App Icons

Place your app icons in:
```
android/app/src/main/res/
```

Required folders and sizes:
- `mipmap-mdpi/` - 48x48
- `mipmap-hdpi/` - 72x72
- `mipmap-xhdpi/` - 96x96
- `mipmap-xxhdpi/` - 144x144
- `mipmap-xxxhdpi/` - 192x192

### 4. Add Splash Screen

Create a splash screen drawable:
```
android/app/src/main/res/drawable/splash.png
```

### 5. Update AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml` to add permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 6. Build and Run

In Android Studio:
- Select a device or emulator
- Click the "Run" button or press `Shift + F10`

### 7. Generate Signed APK/AAB

1. Build → Generate Signed Bundle/APK
2. Choose Android App Bundle (AAB) for Play Store
3. Create or select a keystore
4. Complete the signing configuration
5. Upload to Google Play Console

## Capacitor Plugins Integration

Your app already includes these Capacitor plugins:

### Status Bar
```javascript
import { StatusBar, Style } from '@capacitor/status-bar';

// Set status bar style
await StatusBar.setStyle({ style: Style.Light });

// Set status bar color (Android only)
await StatusBar.setBackgroundColor({ color: '#F97316' });
```

### Splash Screen
```javascript
import { SplashScreen } from '@capacitor/splash-screen';

// Hide splash screen
await SplashScreen.hide();

// Show splash screen
await SplashScreen.show();
```

### Keyboard
```javascript
import { Keyboard } from '@capacitor/keyboard';

// Hide keyboard
await Keyboard.hide();

// Add keyboard listener
Keyboard.addListener('keyboardWillShow', info => {
  console.log('keyboard will show with height:', info.keyboardHeight);
});
```

### Haptics
```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Vibrate on button press
await Haptics.impact({ style: ImpactStyle.Medium });
```

### App State
```javascript
import { App } from '@capacitor/app';

// Listen to app state changes
App.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active?', isActive);
});

// Listen to back button (Android)
App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp();
  } else {
    window.history.back();
  }
});
```

## Implementing Capacitor Features in Your App

### Example: Add to main.jsx or App.jsx

```javascript
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

function AppWithCapacitor() {
  useEffect(() => {
    // Only run on native platforms
    if (Capacitor.isNativePlatform()) {
      // Configure status bar
      StatusBar.setStyle({ style: Style.Light });
      
      // Hide splash screen after app loads
      SplashScreen.hide();
      
      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // App came to foreground
          console.log('App is active');
        } else {
          // App went to background
          console.log('App is in background');
        }
      });
      
      // Handle Android back button
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // Show confirmation before exit
          if (confirm('Do you want to exit the app?')) {
            App.exitApp();
          }
        } else {
          window.history.back();
        }
      });
    }
    
    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, []);
  
  return (
    // Your app components
  );
}
```

## Testing

### Test on Simulators/Emulators

#### iOS Simulator
```bash
npm run cap:run:ios
```

#### Android Emulator
```bash
npm run cap:run:android
```

### Test on Physical Devices

#### iOS Device
1. Connect your iPhone via USB
2. Trust the computer on your device
3. In Xcode, select your device from the device dropdown
4. Click Run

#### Android Device
1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect via USB
4. In Android Studio, select your device
5. Click Run

## Troubleshooting

### iOS Issues

**Build fails with CocoaPods error:**
```bash
cd ios/App
pod repo update
pod install
```

**"Developer Not Trusted" error:**
- Go to Settings → General → Device Management
- Trust the developer certificate

### Android Issues

**Gradle build fails:**
```bash
cd android
./gradlew clean
./gradlew build
```

**SDK not found:**
- Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Ensure required SDK versions are installed

### General Issues

**Changes not reflecting:**
```bash
npm run build
npm run cap:sync
```

**Clear all builds:**
```bash
# Web build
rm -rf dist

# iOS
cd ios/App
xcodebuild clean

# Android
cd android
./gradlew clean
```

## Environment Variables

For production builds, ensure your API endpoints are correctly configured:

1. Create `.env.production` in the client folder:
   ```
   VITE_API_URL=https://your-production-api.com
   ```

2. Update your API configuration to use these variables

## App Store Deployment Checklist

### iOS App Store
- [ ] App icons (all required sizes)
- [ ] Screenshots for all device sizes
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] App Store Connect account setup
- [ ] TestFlight beta testing completed
- [ ] App review information provided

### Google Play Store
- [ ] App icons (all densities)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phones and tablets
- [ ] Privacy policy URL
- [ ] App description and keywords
- [ ] Content rating questionnaire completed
- [ ] Google Play Console account setup
- [ ] Internal testing completed

## Best Practices

1. **Always test on physical devices** before release
2. **Use HTTPS** for all API calls
3. **Handle offline scenarios** gracefully
4. **Optimize images** for mobile bandwidth
5. **Test on different screen sizes**
6. **Implement proper error handling**
7. **Add analytics** (e.g., Google Analytics, Firebase)
8. **Implement crash reporting** (e.g., Sentry)
9. **Version your APIs** for backward compatibility
10. **Follow platform-specific design guidelines**

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [Capacitor Community Plugins](https://github.com/capacitor-community)

## Support

For issues specific to WaZhop mobile app:
- Create an issue in the project repository
- Contact the development team at support@wazhop.ng

## Next Steps

1. Install dependencies: `cd client && npm install`
2. Build the web app: `npm run build`
3. Add platforms: `npm run cap:add:ios` and `npm run cap:add:android`
4. Open native IDEs and start developing!

Happy mobile app development! 🚀
