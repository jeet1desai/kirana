---
name: expo
description: Comprehensive expert guide for Expo SDK 57, React Native, EAS Build, EAS Submit, and mobile deployment.
---

# Expo SDK 57 & EAS Expert Guide

## Core Guidelines for Expo SDK 57

1. **Versioned Documentation**:
   - Always refer to Expo v57.0.0 docs: `https://docs.expo.dev/versions/v57.0.0/`
2. **Safe Area Management**:
   - Never import `SafeAreaView` from `react-native` (it is deprecated and causes layout bugs).
   - Always import `SafeAreaView` from `react-native-safe-area-context` and specify `edges={['top', 'bottom']}`.
   - Use `SafeAreaProvider` at the root of the app.
3. **Environment Variables**:
   - Client-side variables MUST be prefixed with `EXPO_PUBLIC_` (e.g., `EXPO_PUBLIC_NEON_DATABASE_URL`).
   - Metro loads `.env` only on server startup. Whenever `.env` changes, restart Metro with `npx expo start -c`.
   - In EAS Build, configure environment variables in Expo Dashboard (Settings -> Environment Variables) or via `eas.json`.
4. **Project Configuration (`app.json`)**:
   - EAS project linkage:
     ```json
     "extra": {
       "eas": {
         "projectId": "66529ac9-0e5d-4fb6-88d6-8940ff3c1f66"
       }
     }
     ```
   - Android package identifier must be set for builds: `"package": "com.kirana.app"`
   - iOS bundle identifier must be set for builds: `"bundleIdentifier": "com.kirana.app"`

## EAS CLI Commands

### 1. Authentication

```bash
npx eas-cli login
```

### 2. Connect Project

```bash
npx eas-cli init --id 66529ac9-0e5d-4fb6-88d6-8940ff3c1f66
```

### 3. Build for Production

```bash
# Android APK / AAB
npx eas-cli build --platform android --profile production

# iOS IPA
npx eas-cli build --platform ios --profile production

# All platforms
npx eas-cli build --profile production
```

### 4. Build for Testing / Internal (APK directly installable)

In `eas.json`, configure `"preview"` with `"buildType": "apk"` for Android:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Run:

```bash
npx eas-cli build --platform android --profile preview
```
