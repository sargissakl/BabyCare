# 🚀 BabyCare - Development Build Instructies (VANAVOND)

## ⚠️ WAAROM DEVELOPMENT BUILD?

De Agora babyfoon werkt **ALLEEN** in een native build omdat:
- ❌ OnSpace preview app ondersteunt geen native modules
- ❌ OnSpace "Download APK" knop maakt managed builds (geen Agora)
- ✅ **Development build** compileert Agora SDK + geeft real-time audio

**2 OPTIES:**
- **OPTIE A**: EAS Development Build (geen kabel nodig) - **AANBEVOLEN** ⭐
- **OPTIE B**: Lokale Build (vereist Android Studio + USB kabel)

---

## 📦 VOORBEREIDENDE STAPPEN (DOE DIT NU)

### ✅ Controleer of Git Sync Werkt

OnSpace project is al gelinkt met GitHub (`https://github.com/sargissakl/BabyCare`).

**Test of sync werkt:**
```bash
cd C:\Users\semmi\Documents\BabyCare
git status
git pull
```

Als dit werkt → ga naar OPTIE A. Anders → clone opnieuw:
```bash
cd C:\Users\semmi\Documents
rmdir /s /q BabyCare
git clone https://github.com/sargissakl/BabyCare.git
cd BabyCare
```

---

---

# 🟢 OPTIE A: EAS Development Build (AANBEVOLEN)

## STAP 1: Installeer Tools

```cmd
cd C:\Users\semmi\Documents\BabyCare

# Installeer dependencies (met legacy peer deps voor React 19)
npm install --legacy-peer-deps

# Installeer Agora SDK (je hebt dit al gedaan)
npm install react-native-agora@4.2.6 --legacy-peer-deps

# Installeer EAS CLI globaal
npm install -g eas-cli
```

## STAP 2: Login bij Expo

```cmd
# Login (maak gratis account op expo.dev als je die nog niet hebt)
eas login
```

**Vul in:**
- Email/Username
- Password

(Als je nog geen account hebt: https://expo.dev/signup)

---

## STAP 3: Controleer Agora Secrets

Je Agora credentials staan al in OnSpace Cloud Backend:
- ✅ `AGORA_APP_ID`
- ✅ `AGORA_APP_CERTIFICATE`

Deze worden **automatisch** geïnjecteerd in de Edge Function (`generate-agora-token`).

**Geen extra configuratie nodig!** De app haalt tokens op via de Edge Function.

---

## STAP 4: Start Development Build

**eas.json** is al correct geconfigureerd met `development` profile.

**Start de build:**

```cmd
eas build --platform android --profile development
```

**Wat gebeurt er:**
1. ⬆️ Code uploaden naar Expo servers
2. 🔨 Native code compilatie (Agora SDK wordt geïnstalleerd)
3. 📦 APK genereren met development client
4. ⏱️ Duurt **15-25 minuten** (eerste keer)

**Monitor de build:**
- Terminal toont URL zoals: `https://expo.dev/builds/abc123`
- Of ga naar: `https://expo.dev/accounts/[jouw-username]/builds`
- Zie live logs van de build proces

---

## STAP 5: Download & Installeer APK

### 5.1 Wacht Tot Build Klaar Is

Wanneer de build **Finished** ✅ is:

1. **Ga naar de build page** (URL uit terminal)
2. **Klik op "Download"** knop
3. **Scan QR code** met je telefoon OF download direct

### 5.2 Installeer op Android

1. **Open APK** op je telefoon
2. **Sta installatie toe** van onbekende bronnen (Settings popup)
3. **Installeer** BabyCare app

### 5.3 Test de Babyfoon!

1. Open app → **Monitor** tab
2. **Klik "Start Monitoring"**
3. **Toestemming geven** voor microfoon
4. **QR code verschijnt** + 4-cijferige code

**Op 2e apparaat (andere telefoon/tablet):**
1. Scan de QR code OF
2. Open app → Watch tab → voer 4-cijferige code in
3. **Audio stream begint!** 🎙️

**Verwachte resultaten:**
- ✅ Real-time audio (<300ms vertraging)
- ✅ Geluidsniveau visualisatie
- ✅ Automatische alerts bij hard geluid
- ✅ GEEN "werkt alleen in APK" melding meer!

---

---

# 🔵 OPTIE B: Lokale Build (GEVORDERD)

**Vereisten:**
- ✅ Android Studio geïnstalleerd
- ✅ Android SDK tools
- ✅ Java JDK 17+
- ✅ Android telefoon met USB kabel
- ✅ USB debugging enabled

## STAP 1: Genereer Native Code

```cmd
cd C:\Users\semmi\Documents\BabyCare

# Installeer dependencies
npm install --legacy-peer-deps

# Genereer android/ folder
npx expo prebuild --clean
```

## STAP 2: Check Android Permissions

Open `android/app/src/main/AndroidManifest.xml` en controleer:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

(Deze staan er al in via `app.json` configuratie)

## STAP 3: Build en Installeer

**Optie 3A: Met Expo CLI (makkelijkst)**
```cmd
npx expo run:android --variant release
```

**Optie 3B: Met Gradle direct**
```cmd
cd android
.\gradlew assembleRelease
```

APK locatie: `android\app\build\outputs\apk\release\app-release.apk`

**Installeer:**
```cmd
adb install android\app\build\outputs\apk\release\app-release.apk
```

---

---

# ⚠️ VERWACHTE PROBLEMEN & OPLOSSINGEN

---

## ❌ "EAS Build Failed"

**Check de logs** op expo.dev/builds voor exacte error.

**Meest voorkomende fix:**
```cmd
# Wis cache en herbouw
eas build --platform android --profile development --clear-cache
```

**Als het blijft falen:**
```cmd
# Verwijder node_modules lokaal
rmdir /s /q node_modules
npm install --legacy-peer-deps

# Probeer opnieuw
eas build --platform android --profile development
```

## ❌ "Unable to resolve module" tijdens build

Dit is de React Native 0.79.3 bug die we eerder zagen.

**Fix:**
```cmd
# Gebruik production profile (meer stabiel)
eas build --platform android --profile production
```

Production build werkt ook, maar development build heeft:
- ✅ Snellere reload tijdens testen
- ✅ Debug tools ingebouwd

## ❌ "Agora SDK not initialized" in de app

**Oorzaken:**
1. **Verkeerde build**: Je gebruikt nog steeds OnSpace preview
   - ✅ **Oplossing**: Gebruik ALLEEN de APK van EAS build
2. **Geen microfoon permission**: App heeft geen toegang
   - ✅ **Oplossing**: Settings → Apps → BabyCare → Permissions → Microphone ON
3. **Agora credentials fout**: Backend secrets zijn leeg
   - ✅ **Oplossing**: Check OnSpace Cloud → Secrets tab

## ❌ Audio stream werkt niet (geen geluid)

**Checklist:**
1. ✅ Beide apparaten hebben **internet** (WiFi of 4G)
2. ✅ Monitoring apparaat heeft **microfoon permission**
3. ✅ Watching apparaat heeft **geluid** niet op mute
4. ✅ **Firewall** blokkeert geen UDP traffic (Agora gebruikt UDP)
5. ✅ **4-cijferige code** correct ingevoerd

**Test:**
```
1. Start monitoring → praat in microfoon
2. Check groene "Audio Level" bars → beweegt?
   - JA: Microfoon werkt, probleem bij netwerk/watching apparaat
   - NEE: Microfoon permission issue
```

## ❌ "Cannot find module react-native-agora"

**Dit betekent:**
Je gebruikt **NIET** de EAS development build.

**Oplossing:**
- ❌ **STOP met** OnSpace preview app gebruiken
- ❌ **STOP met** OnSpace "Download APK" knop gebruiken
- ✅ **GEBRUIK ALLEEN** de APK van EAS build (expo.dev/builds)

---

---

## 💰 KOSTEN

### Expo EAS Build
- ✅ **Gratis tier**: 30 builds/maand (ruim voldoende)
- 💵 **Meer nodig**: $29/maand voor onbeperkt

### Agora Real-Time
- ✅ **Gratis tier**: 10.000 minuten/maand
- 💵 **Betaald**: $0.99 per 1000 minuten daarna
- 📊 **Voor deze app**: 1 uur babyfoon/dag = ~30 uur/maand = **GRATIS**

---

---

## 🔄 UPDATES PUSHEN (LATER)

Wanneer je code wijzigt:

```cmd
# In OnSpace: maak wijzigingen
# Klik GitHub knop → Sync

# Lokaal: pull changes
cd C:\Users\semmi\Documents\BabyCare
git pull

# Maak nieuwe build
eas build --platform android --profile development
```

---

---

## ✅ COMPLETE CHECKLIST (VANAVOND)

### Voorbereiding (5 min)
- [ ] Open Command Prompt
- [ ] `cd C:\Users\semmi\Documents\BabyCare`
- [ ] `git pull` (haal laatste code op)
- [ ] `npm install --legacy-peer-deps`

### EAS Setup (10 min)
- [ ] `npm install -g eas-cli`
- [ ] `eas login` (maak account op expo.dev)
- [ ] Agora secrets check (OnSpace Cloud → Secrets tab)

### Build Starten (2 min)
- [ ] `eas build --platform android --profile development`
- [ ] Wacht op build URL in terminal
- [ ] Open URL in browser om voortgang te zien

### Wachten (15-25 min)
- [ ] ☕ Koffie/thee pakken
- [ ] 📱 Check expo.dev/builds voor status
- [ ] Wacht tot status = **Finished** (groen)

### Downloaden & Installeren (5 min)
- [ ] Download APK via QR code of direct link
- [ ] Installeer op telefoon
- [ ] Sta "onbekende bronnen" toe

### Testen (2 min)
- [ ] Open app → Monitor tab
- [ ] Start Monitoring → geef microfoon permission
- [ ] Check of QR code + 4-cijferige code verschijnt
- [ ] **GEEN "werkt alleen in APK" melding!** ✅

### Live Test (met 2e apparaat)
- [ ] 2e telefoon: scan QR of voer code in
- [ ] Praat in monitoring telefoon
- [ ] Hoor audio op watching telefoon (<300ms!)
- [ ] Check groene audio level bars
- [ ] **SUCCES!** 🎉👶🎙️

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

---

## 📞 HULP NODIG?

**Als het misgaat vanavond:**

1. **Check de build logs** op expo.dev/builds
2. **Google de error message**
3. **Probeer `--clear-cache` flag**
4. **Post in Expo Discord** (https://chat.expo.dev/)

**Specifieke problemen:**
- Agora SDK errors → https://docs.agora.io/en/help/integration-issues
- EAS Build fails → https://docs.expo.dev/build-reference/troubleshooting/
- React Native errors → https://reactnative.dev/docs/troubleshooting

---

## 🎯 VERWACHTE RESULTAAT

**Na vanavond heb je:**
- ✅ Werkende development build APK
- ✅ Real-time babyfoon met <300ms latency
- ✅ QR code sharing tussen apparaten
- ✅ Audio visualisatie en alerts
- ✅ Alle tracking features (sleep, feeding, etc.)

**Totale tijd:** ~45 min (waarvan 20 min wachten op build)

---

**Succes vanavond!** 🚀👶🎙️

*Laatste update: 23 december 2025*
