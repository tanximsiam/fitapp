# Releasing FitApp Mobile

How to build installable Android and iOS releases. Nothing here has been run end to end yet: the native
projects are generated and configured, and the GitHub Actions workflow is the first place the Android
project compiles. Treat the first release as a test run.

## 1. Version

- Bump `version` in `package.json` (semver). Android reads its `versionName` from there.
- Android's `versionCode` comes from `FITAPP_VERSION_CODE` (CI sets it to the run number); set it yourself
  for local release builds, and keep it increasing for every upload to Google Play.
- iOS: set *Version* and *Build* in Xcode (target App → General).

## 2. Which data a build uses

A build reads `VITE_BACKEND_URI` at build time:

```bash
cp .env.example .env    # then set VITE_BACKEND_URI=https://your-fitapp-server.example
```

Leave it empty for a demo-only build (no sign-in, simulated watch). The server must list the app's origin in
`FRONTEND_ORIGINS`: `capacitor://localhost` for iOS and `https://localhost` for Android.

## 3. Icons and splash screens

Generated from the official brand files; regenerate after a brand change:

```bash
node scripts/brand-assets.mjs        # renders resources/ from ../brand/svg
npx capacitor-assets generate --android --ios
```

## 4. Android

Needs JDK 21 and the Android SDK (Android Studio installs both). Minimum Android 8.0 (SDK 26), required by Health Connect.

Create an upload key once and keep it, with its passwords, outside the repository:

```bash
keytool -genkeypair -v -keystore ~/keys/fitapp-upload.jks -alias fitapp -keyalg RSA -keysize 4096 -validity 10000
```

Then create `android/keystore.properties` (gitignored):

```properties
storeFile=/home/you/keys/fitapp-upload.jks
storePassword=…
keyAlias=fitapp
keyPassword=…
```

Build a signed bundle for Google Play (or `assembleRelease` for an APK):

```bash
npm run build
npx cap sync android
cd android && FITAPP_VERSION_CODE=2 ./gradlew bundleRelease
# android/app/build/outputs/bundle/release/app-release.aab
```

Google Play requirements for this app:

- **Health Connect**: complete the Health apps declaration in Play Console for the read permissions used
  (steps, active calories, exercise, distance, heart rate), with a privacy policy URL that explains what is
  read and where it is sent (your FitApp server).
- **Bluetooth**: scanning is declared `neverForLocation`; location permission is requested only on Android 11
  and earlier, where scanning requires it.
- **Data safety form**: health and fitness data, collected, sent to the user's own server, encrypted in
  transit and at rest on the device, deletable by signing out.

## 5. iOS

Needs macOS with Xcode and an Apple developer account.

```bash
npm run build
npx cap sync ios          # also runs pod install
npx cap open ios
```

In Xcode: choose your team under *Signing & Capabilities*, and make sure the **HealthKit** capability is on
(the entitlements file `ios/App/App/App.entitlements` and the usage descriptions are already in place; the App
ID must have HealthKit enabled in the developer portal). Then *Product → Archive* and upload.

App Review notes worth including: the app reads HealthKit data only to show it and upload it to the person's own
FitApp server; it writes nothing to Health; Bluetooth is used only to pair the FitApp watch; observations are
not medical advice.

## 6. Before each release

- `npx vue-tsc --noEmit && npx vitest run`
- Contract tests against the backend version you ship with: `scripts/contract-backend.sh &` then `npm run test:contract`
- On a real phone (these are not covered by automated tests):
  - Welcome flow, demo mode, sign-in to your server
  - Health Connect / Apple Health: permission prompt, first sync, data appears on Health pages
  - FitApp watch: pairing confirmation on the watch, reconnect after app restart, activity appears
  - Offline: airplane mode shows saved data and the offline notice; a journal entry made offline syncs later
  - Sign-out warns about unsent entries and removes local data
  - TalkBack / VoiceOver on Home, Health and Quick log; largest system text size; light and dark themes
- Update the status table in `README.md` with what was verified on which device.
