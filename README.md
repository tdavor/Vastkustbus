# Göteborg Explorer

Göteborg Explorer is an Android app for exploring outdoors with children ages 3–6. It has 20 built-in missions in Swedish and English, animal avatars, XP, a photo Memory Book, and shareable postcards. The home screen has a language picker. The first launch defaults to Swedish on a Swedish device and English otherwise.

## Run on Android

Use Node.js 20.19.4 or newer, JDK 17, and a configured Android SDK. An Android phone with USB debugging is the best way to check the camera and location flow.

```sh
npm ci
npm run typecheck
npm run android
```

The development build connects to Metro. For an installable APK that starts offline, use the included EAS preview profile. From the project folder, sign in to your Expo account and initialize the project when prompted.

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The EAS build service is only used to build the APK. The installed app does not need an account, backend, or network to open missions, capture photos, record progress, or create postcards.

## How it works

- **Progress** starts at level 1. Every 300 XP adds a level. Each saved completion earns XP, including repeat missions. The local journal stores one record per completion, so retrying the same save cannot award XP twice.
- **Photos** are copied from the camera cache to the app’s private documents folder. The journal is stored in AsyncStorage. Clearing app data or uninstalling the app removes local memories.
- **Location** is optional. The app attempts a short foreground location lookup while the parent reviews the photo. If an internet connection and Android geocoding are available, it suggests a short place name. Parents can edit it, pick a preset, or save without a place tag.
- **Sharing** renders the postcard on the device and opens Android’s share sheet. Only the postcard image is shared. It shows the chosen place tag and current badge and level. It omits the child’s name and raw GPS coordinates. Available destinations and posting depend on the installed apps and their connectivity.
- **Permissions** are requested when needed. Android needs camera access for photos and optional foreground location for GPS. The app uses private storage and Android’s native share flow, so it does not request broad media access, microphone access, or background location.

## Android smoke check

1. Install the standalone APK. Start in airplane mode, create a profile, switch languages, and check all four mission filters.
2. Cancel the camera once. Confirm no XP was added, then take a photo, decline location, pick a quick tag, and save. Restart the app and open the photo from the Memory Book.
3. Repeat with location enabled. Check that a manual tag is kept even if a location suggestion arrives later. Confirm that a completion bringing the total to 300 XP advances the profile to level 2.
4. Open a memory and share it. Check that Android receives a PNG postcard with its photo, title, place, and current badge.
