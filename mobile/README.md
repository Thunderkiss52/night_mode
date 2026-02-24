# Mobile shell (WebView)

## Option 1: Capacitor (recommended)
1. Deploy web app to Vercel.
2. Install capacitor inside this repo:
   - `npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`
   - `npx cap init night-mode com.nightmode.app --web-dir=.next`
3. Build web app: `npm run build`.
4. Add platforms:
   - `npx cap add android`
   - `npx cap add ios`
5. Set `server.url` in `capacitor.config.ts` to deployed Vercel URL for hot updates.
6. Run:
   - Android: `npx cap run android`
   - iOS: `npx cap run ios`

## Option 2: React Native WebView shell
Use `react-native-webview` and load deployed URL `https://your-night-mode.vercel.app/ru`.
