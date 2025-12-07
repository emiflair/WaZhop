## Current Status
✅ Capacitor Google Auth plugin installed
✅ Plugin configured in capacitor.config.ts
✅ GoogleLoginButton component updated to use native sign-in on iOS
✅ Code synced to iOS project

## Required: iOS-Specific Configuration

### Step 1: Get iOS Client ID from Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (WaZhop)
3. Navigate to **APIs & Services** → **Credentials**
4. Find or create an **iOS OAuth 2.0 Client ID**:
   - Application type: iOS
   - Bundle ID: `ng.wazhop.app`
5. Copy the **iOS Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Update Info.plist in Xcode

1. Open Xcode workspace:
   ```bash
   cd /Users/emifeaustin/Desktop/WaZhopAPP/WaZhop/client
   open ios/App/App.xcworkspace
   ```

2. In Xcode, open `App/Info.plist`

3. Add URL Scheme for Google Sign-In:
   - Right-click on Info.plist → **Add Row**
   - Key: `CFBundleURLTypes` (if not exists)
   - Expand it and add:
     ```xml
     <key>CFBundleURLTypes</key>
     <array>
       <dict>
         <key>CFBundleURLSchemes</key>
         <array>
           <string>com.googleusercontent.apps.YOUR-IOS-CLIENT-ID-HERE</string>
         </array>
       </dict>
     </array>
     ```
   - Replace `YOUR-IOS-CLIENT-ID-HERE` with the **reversed iOS Client ID**
   - Example: If iOS Client ID is `123456-abcdef.apps.googleusercontent.com`, use `com.googleusercontent.apps.123456-abcdef`

4. Save the file

### Step 3: Update capacitor.config.ts with iOS Client ID

Replace the `serverClientId` in `capacitor.config.ts`:
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com', // Keep web client ID
  iosClientId: 'YOUR-IOS-CLIENT-ID.apps.googleusercontent.com', // Add this
  forceCodeForRefreshToken: true,
},
```

### Step 4: Update main.jsx initialization

Update the GoogleAuth.initialize call in main.jsx:
```javascript
GoogleAuth.initialize({
  clientId: 'YOUR-WEB-CLIENT-ID.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  grantOfflineAccess: true,
});
```

### Step 5: Rebuild and Test

```bash
cd /Users/emifeaustin/Desktop/WaZhopAPP/WaZhop/client
npm run build
npm run cap:sync
```

Then run the app in Xcode on your iPhone.

## Testing

1. Open the app on your iPhone
2. Go to Login/Register page
3. Click "Continue with Google" button
4. You should see the native iOS Google Sign-In prompt
5. Select your Google account
6. App should log you in successfully

## Troubleshooting

### "Google Sign-In failed" error
- Check that Bundle ID in Xcode matches what's registered in Google Cloud Console (`ng.wazhop.app`)
- Verify URL Scheme is correctly added to Info.plist
- Ensure iOS Client ID is correct

### Button doesn't appear or is disabled
- Check console logs in Safari Web Inspector
- Verify VITE_GOOGLE_CLIENT_ID is set in .env file
- Make sure app is running on actual device (not simulator for OAuth)

### "Unauthorized client" error
- Bundle ID must match exactly what's in Google Cloud Console
- Wait 5-10 minutes after creating iOS Client ID for changes to propagate

## Current Configuration

**Web Client ID (already configured):**
```
428698442868-b4f26t11d2l1rsmijqcv29mnn7itcrn8.apps.googleusercontent.com
```

**Bundle ID:**
```
ng.wazhop.app
```

**What you need to add:**
- iOS Client ID from Google Cloud Console
- URL Scheme in Info.plist
