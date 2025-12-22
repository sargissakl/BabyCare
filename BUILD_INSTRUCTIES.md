# 🚀 BabyCare - Agora Real-Time Build Instructies

## ⚠️ BELANGRIJKE VOORBEREIDING

Agora real-time streaming vereist **native code compilation**. Dit betekent dat je **NIET** de OnSpace "Download APK" knop kunt gebruiken. Je moet de app lokaal bouwen met EAS Build.

---

## 📦 STAP 1: Code Exporteren naar GitHub

### 1.1 OnSpace → GitHub Sync
1. **Klik rechtsboven** op de **GitHub knop** 🔗
2. **Connect je GitHub account** (als nog niet gedaan)
3. **Kies repository naam**: bijv. `babycare-app`
4. **Klik "Sync"** - code wordt ge-upload
5. **Wacht tot sync compleet is** ✅

### 1.2 Clone Project Lokaal
Open **Terminal** of **Command Prompt**:

```bash
# Ga naar je gewenste map
cd Documents

# Clone het project (vervang USERNAME)
git clone https://github.com/USERNAME/babycare-app.git

# Ga naar de project folder
cd babycare-app
```

---

## 🛠️ STAP 2: Installeer Benodigdheden

```bash
# Installeer dependencies
npm install

# Installeer Agora SDK
npm install react-native-agora@4.2.6 --save

# Installeer EAS CLI globaal
npm install -g eas-cli

# Login bij Expo (maak gratis account op expo.dev)
eas login
```

---

## 🔑 STAP 3: Configureer Agora Credentials

### Optie A: Vanuit OnSpace Backend (Aanbevolen)
Je Agora credentials zijn al in OnSpace Cloud:
1. Open OnSpace project
2. Klik **Cloud** (rechtsboven)
3. Ga naar **Secrets** tab
4. Kopieer je `AGORA_APP_ID` en `AGORA_APP_CERTIFICATE`

### Optie B: Nieuwe Agora Account
1. Ga naar https://console.agora.io/
2. Maak gratis account
3. Maak nieuw project
4. Kopieer **App ID** en **App Certificate**

### Bewaar Credentials
Maak een bestand `.env` in de project root:

```bash
# .env
AGORA_APP_ID=jouw_app_id_hier
AGORA_APP_CERTIFICATE=jouw_certificate_hier
```

---

## 🏗️ STAP 4: Configureer EAS Build

Het bestand `eas.json` is al aangemaakt. Nu configureren we de native build:

```bash
# Initialiseer EAS project
eas build:configure
```

Beantwoord de vragen:
- **Platform**: Android (of both)
- **Create new project?**: Yes

---

## 📱 STAP 5: Maak de Native Build

### 5.1 Pre-build (Genereer Native Code)
```bash
npx expo prebuild --clean
```

Dit genereert `android/` en `ios/` folders met native code.

### 5.2 Voeg Agora Dependencies Toe aan Android

Maak een bestand `android/app/build.gradle` patch (dit wordt automatisch gedaan door prebuild, maar controleer):

```bash
# Check of Agora permissions in AndroidManifest.xml staan
cat android/app/src/main/AndroidManifest.xml
```

Zorg dat deze permissions er staan:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

### 5.3 Start EAS Build
```bash
eas build --platform android --profile production
```

### Wat gebeurt er?
1. **Uploadt code** naar Expo servers
2. **Compileert native modules** (inclusief Agora)
3. **Genereert APK**
4. **Tijd**: ~15-25 minuten (eerste keer)

### Monitor de Build
- URL verschijnt in terminal (bijv. `https://expo.dev/builds/abc123`)
- Of ga naar: https://expo.dev/accounts/[username]/builds
- Live logs tonen de voortgang

---

## 📥 STAP 6: Download en Installeer APK

### 6.1 Download
Wanneer build **Finished** ✅:
1. Klik op build in https://expo.dev/builds
2. **Download** knop verschijnt
3. Download APK naar telefoon (via QR code of direct link)

### 6.2 Installeer
1. Open APK op Android telefoon
2. **Sta installatie toe** van onbekende bronnen
3. **Installeer** BabyCare app

### 6.3 Test Real-Time Audio
1. Open app → **Monitor** tab
2. **"Start Monitoring"** - krijg 4-cijferige code
3. 2e apparaat: Scan QR of voer code in
4. **Test audio** - <300ms latency! 🎉

---

## 🔧 Alternatieve Methode: Lokale Build (Gevorderd)

Als je Android Studio hebt geïnstalleerd:

```bash
# Build lokaal
npx expo run:android --variant release

# Of met React Native CLI
cd android
./gradlew assembleRelease
```

APK locatie: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🐛 Troubleshooting

### Build Failed?
**Check de logs** op expo.dev/builds voor exacte error.

**Veelvoorkomende fixes:**

```bash
# Clear cache
rm -rf node_modules
npm install
eas build --platform android --clear-cache

# Rebuild prebuild
npx expo prebuild --clean
```

### "Agora SDK not initialized" in app?
1. **Check permissions**: App Settings → Permissions → Microphone ON
2. **Check credentials**: Zorg dat AGORA_APP_ID correct is
3. **Rebuild**: Mogelijk verkeerde build gebruikt

### Audio werkt niet?
1. **Internet**: Beide apparaten online
2. **Firewall**: Agora gebruikt UDP ports
3. **Agora status**: Check console.agora.io voor usage/errors

### "Cannot find module react-native-agora"?
Dit betekent dat je de OnSpace preview gebruikt in plaats van de EAS build:
- ✅ **Gebruik de gedownloade APK** van EAS Build
- ❌ **NIET de OnSpace "Download APK" knop** (ondersteunt geen Agora)

---

## 💰 Kosten

### Expo EAS Build
- **Gratis tier**: 30 builds/maand
- **Meer nodig?**: $29/maand voor onbeperkt

### Agora
- **Gratis tier**: 10.000 minuten/maand
- **Betaald**: $0.99 per 1000 minuten
- **Voor hobbyist**: Ruim voldoende gratis

---

## 🔄 Updates Pushen

Na code wijzigingen:

```bash
# Commit changes
git add .
git commit -m "Update audio features"
git push

# Nieuwe build
eas build --platform android --profile production
```

---

## ✅ Complete Checklist

**Voorbereiding:**
- [ ] Code op GitHub
- [ ] Project lokaal gecloned
- [ ] Node modules geïnstalleerd (`npm install`)
- [ ] Agora SDK geïnstalleerd
- [ ] EAS CLI geïnstalleerd globaal

**Configuratie:**
- [ ] Expo account aangemaakt (expo.dev)
- [ ] Agora credentials (App ID + Certificate)
- [ ] `.env` bestand aangemaakt met credentials
- [ ] `eas build:configure` uitgevoerd

**Build:**
- [ ] `npx expo prebuild --clean` succesvol
- [ ] Android permissions gecheckt
- [ ] `eas build --platform android` gestart
- [ ] Build status **Finished** (groen)

**Testing:**
- [ ] APK gedownload van expo.dev
- [ ] App geïnstalleerd op telefoon
- [ ] Microphone permission toegestaan
- [ ] Real-time audio werkt <300ms! 🎉

---

## 📚 Nuttige Links

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Agora React Native**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native
- **Expo Prebuild**: https://docs.expo.dev/workflow/prebuild/
- **Troubleshooting**: https://docs.expo.dev/build-reference/troubleshooting/

---

## 💡 Tips

**Eerste Build Langzaam?**
- Normale eerste build: 20-30 min
- Herhaalde builds: 8-15 min
- Cache wordt hergebruikt

**Development Testing?**
Voor snellere test cycles zonder EAS build elke keer:
```bash
npx expo run:android
```
Vereist Android Studio + Android SDK.

**Multiple Devices?**
- APK delen via Google Drive/Dropbox
- Of gebruik `adb install app.apk` via USB

---

**Succes met je real-time babyfoon!** 👶🎙️✨

Bij vragen: check Expo forums of Agora docs!
