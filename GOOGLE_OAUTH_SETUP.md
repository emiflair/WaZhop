# Google OAuth Setup Guide

## Overview
This guide explains how to set up Google OAuth authentication for WaZhop.

## Prerequisites
- Google Cloud Console account
- Google OAuth 2.0 credentials (Client ID and Client Secret)

## Environment Variables

### Frontend (Vercel)
Add this environment variable in your Vercel dashboard:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### Backend (Railway)
Add these environment variables in your Railway dashboard:
```
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## How to Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Select **Web Application**
6. Configure:
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5173
     https://your-domain.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5173
     https://your-domain.com
     ```
7. Copy the Client ID and Client Secret

## Implementation Details

### Frontend Flow
1. User clicks "Continue with Google" button
2. Google OAuth popup appears
3. User selects Google account
4. Google returns credential (ID token)
5. Frontend sends token + role to `/api/auth/google`
6. Backend verifies token and creates/logs in user
7. JWT token returned to frontend
8. User redirected to dashboard (seller) or home (buyer)

### Backend Flow
1. Receives Google ID token and role
2. Verifies token with Google using `google-auth-library`
3. Extracts user info (email, name, picture)
4. Checks if user exists:
   - **Exists:** Log them in
   - **New:** Create account with emailVerified=true
5. If seller role, creates default shop
6. Returns JWT token

## Features
- ✅ One-click registration/login
- ✅ No password required for Google users
- ✅ Email automatically verified
- ✅ Profile picture from Google account
- ✅ Seamless account linking for existing emails
- ✅ Role selection (buyer/seller) during OAuth

## User Model Changes
```javascript
{
  authProvider: 'local' | 'google',  // New field
  googleId: String,                   // New field (unique, sparse)
  profilePic: String,                 // New field for Google avatar
  password: String,                   // Now optional for OAuth users
  emailVerified: Boolean              // Auto-true for Google users
}
```

## Testing

### Local Development
1. Set `VITE_GOOGLE_CLIENT_ID` in `client/.env`
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`
3. Start both servers
4. Navigate to `/login` or `/register`
5. Click "Continue with Google"
6. Complete Google authentication
7. Verify redirect to appropriate page

### Production
1. Add environment variables to Vercel and Railway
2. Redeploy both services
3. Test OAuth flow on production domain
4. Verify shop creation for sellers
5. Check JWT token functionality

## Security Notes
- Google tokens are verified server-side using `google-auth-library`
- Expired tokens are rejected
- Users cannot access other accounts via OAuth spoofing
- Same email can only have one account
- All standard authentication middleware applies to OAuth users

## Troubleshooting

### "Invalid Google token"
- Check that `GOOGLE_CLIENT_ID` matches on frontend and backend
- Ensure authorized origins are configured correctly in Google Cloud Console
- Token may have expired (tokens expire after 1 hour)

### "Google login failed"
- Check network requests in browser DevTools
- Verify backend `/api/auth/google` endpoint is accessible
- Check Railway logs for detailed error messages

### User sees "Unable to retrieve email from Google"
- Google account may not have email set to public
- OAuth scopes may be misconfigured
- User may have denied email permission

## API Endpoint

**POST /api/auth/google**

Request Body:
```json
{
  "token": "google_id_token_here",
  "role": "buyer" | "seller"
}
```

Response (Success):
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@gmail.com",
    "role": "seller",
    "emailVerified": true,
    "authProvider": "google",
    "profilePic": "https://lh3.googleusercontent.com/..."
  }
}
```

Response (Error):
```json
{
  "success": false,
  "message": "Invalid Google token"
}
```

## Files Modified

### Frontend
- `client/src/App.jsx` - Added GoogleOAuthProvider wrapper
- `client/src/components/GoogleLoginButton.jsx` - New component
- `client/src/pages/Login.jsx` - Added Google button
- `client/src/pages/Register.jsx` - Added Google button
- `client/src/context/AuthContext.jsx` - Added googleLogin function
- `client/src/utils/api.js` - Added googleAuth endpoint

### Backend
- `server/controllers/authController.js` - Added googleAuth handler
- `server/routes/auth.js` - Added POST /google route
- `server/models/User.js` - Added OAuth fields
- `server/package.json` - Added google-auth-library

## Next Steps
1. Set environment variables in Vercel and Railway
2. Redeploy both services
3. Test OAuth flow end-to-end
4. Monitor for any errors in production
5. Consider adding more OAuth providers (Facebook, Apple, etc.)
