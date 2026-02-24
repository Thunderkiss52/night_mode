# WebView release checklist

1. Deploy production web app to Vercel.
2. Verify HTTPS domain and no mixed-content warnings.
3. Ensure camera permission flow works (`/qr` page).
4. Add deep-link opening to `/ru` (or last locale).
5. Configure Android/iOS app icons and splash screen.
6. Build test APK/IPA and run smoke tests:
   - Login
   - Map load
   - QR scan
   - Clicker save state
7. Publish to internal testing track first.
