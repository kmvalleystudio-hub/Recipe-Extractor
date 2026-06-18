# Recipe Extractor

A mobile-first recipe extraction app built with **React Native**, **Expo**, and **Expo Router**. Paste a public cooking video URL and get a structured recipe with clearly separated extracted facts and smart suggestions.

## Features

- Paste a YouTube cooking video URL and extract a structured recipe
- **Extracted Recipe** tab: title, timing, ingredients, instructions, notes, and missing-detail suggestions
- **Alternative Ingredients** tab: substitutions with ratios and dietary notes
- Secure backend API — API keys stay on the server, never in the mobile app
- Android-ready with EAS Build (targets API level 35)
- Warm, food-inspired UI with NativeWind (Tailwind-style) styling

## Project structure

```
Recipe Extractor/
├── app/                    # Expo Router screens
├── src/
│   ├── components/         # Reusable UI components
│   ├── services/           # API client
│   ├── store/              # Zustand state
│   ├── types/              # TypeScript types
│   └── utils/              # Validation & formatting
├── backend/                # Secure API server
│   └── src/
│       ├── routes/         # API endpoints
│       └── services/       # Video fetch, AI extraction
├── assets/                 # App icons & splash (placeholders)
├── app.config.ts           # Expo configuration
└── eas.json                # EAS Build configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (via `npx expo`)
- [EAS CLI](https://docs.expo.dev/build/setup/) for production builds (`npm install -g eas-cli`)
- Android Studio / emulator (for local Android testing)
- [Ollama](https://ollama.com/) installed locally (for recipe extraction during development)

## Installation

### 1. Mobile app

```bash
cd "Recipe Extractor"
npm install
node scripts/create-assets.mjs
```

### 2. Backend API

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
AI_PROVIDER=ollama-local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
PORT=3001
```

Pull the Ollama model if you haven't already:

```bash
ollama pull llama3.2
```

**AI providers** (set `AI_PROVIDER` in `backend/.env`):

| Provider | Description |
|----------|-------------|
| `ollama-local` | Default — uses local Ollama at `OLLAMA_BASE_URL` |
| `mock` | Returns sample recipe JSON (test UI without Ollama) |
| `openai` | Placeholder — set `OPENAI_API_KEY` when ready |
| `gemini` | Placeholder — set `GEMINI_API_KEY` when ready |

### 3. Environment variables (mobile)

Copy the example env file in the project root:

```bash
cp .env.example .env
```

Set the backend URL (use your machine's LAN IP when testing on a physical device or Android emulator):

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> **Android emulator / physical phone:** `localhost` on the device is not your PC. Use your computer's IPv4 address instead, e.g. `http://192.168.1.10:3001`. Run `ipconfig` on Windows to find it. The backend on your PC calls Ollama at `localhost:11434` — the phone never talks to Ollama directly.

> **Important:** Never put API keys in the mobile app. Only `EXPO_PUBLIC_API_URL` belongs in the client `.env`.

## Running locally

### Start the backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3001`.

Health check: `GET http://localhost:3001/health`

### Start the mobile app

**Windows browser preview (phone-sized, no device needed):**

```powershell
cd "C:\Recipe Extractor"
npm run preview
```

Opens http://localhost:8081 in your browser inside a phone frame. Also run the backend in another terminal:

```powershell
cd backend && npm run dev
```

**Android / Expo Go:**

In a separate terminal:

```bash
npm start
```

Then press `a` for Android emulator, or scan the QR code with Expo Go.

**Physical device tip:** Replace `localhost` in `EXPO_PUBLIC_API_URL` with your computer's local IP (e.g. `http://192.168.1.10:3001`).

## Native Android build on your phone (`run:android`)

To install the app directly on a connected Android phone (not Expo Go):

### Prerequisites
- Android Studio installed with SDK
- Phone connected via USB with **USB debugging** enabled
- Copy `android/local.properties.example` → `android/local.properties` and set your SDK path

### Build and install

```powershell
cd "C:\Recipe Extractor"
node scripts/create-assets.mjs
npm run android
```

Or manually:

```powershell
npx expo run:android
```

The debug APK is also at:
`android/app/build/outputs/apk/debug/app-debug.apk`

Install via USB:
```powershell
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Windows Gradle fix

If you see `Could not move temporary workspace` / `AccessDeniedException`, the included script applies a robocopy workaround automatically. You can also run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-android.ps1
```

If builds still fail, add a Windows Defender exclusion for the project folder and ensure Android SDK path is set in `android/local.properties`.

## API endpoint

### `POST /api/extract-recipe`

**Request:**

```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "manualTranscript": "optional — paste transcript text for local testing"
}
```

If `manualTranscript` is provided, the backend skips video fetching and extracts from that text instead.

**Response:** Structured recipe JSON (see `src/types/recipe.ts`).

**Error codes:**

| Code | Meaning |
|------|---------|
| `INVALID_URL` | URL format or platform not supported |
| `CONTENT_UNAVAILABLE` | Captions/transcript unavailable |
| `INSUFFICIENT_CONTENT` | Not enough text to extract a recipe |
| `EXTRACTION_ERROR` | Server or AI processing error |

## Expo development build

For a custom dev client (recommended before production):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```

Install the resulting APK on your device, then run `npm start` and connect to the dev client.

## Building for Google Play (EAS)

### 1. Configure EAS

```bash
eas login
eas build:configure
```

Update `app.config.ts`:
- Replace `your-eas-project-id` in `extra.eas.projectId` with your real EAS project ID
- Update `com.yourcompany.recipeextractor` to your final package name before release

### 2. Replace placeholder assets

Replace files in `assets/` with your final:
- `icon.png` (1024×1024)
- `adaptive-icon.png` (1024×1024)
- `splash-icon.png`

### 3. Production build

```bash
eas build --profile production --platform android
```

This produces an **AAB** (Android App Bundle) suitable for Google Play.

### 4. Submit to Google Play

1. Create a Google Play Console app listing named **Recipe Extractor**
2. Add a privacy policy URL
3. Configure a service account for EAS Submit
4. Place `google-play-service-account.json` in the project root (gitignored)
5. Run:

```bash
eas submit --platform android --profile production
```

## Google Play checklist

- [ ] App name: **Recipe Extractor** (no "AI" in branding)
- [ ] Package name finalized (not `com.yourcompany.recipeextractor`)
- [ ] Target SDK 35 (configured via `expo-build-properties`)
- [ ] Adaptive icon and splash screen added
- [ ] Privacy policy published
- [ ] No unnecessary permissions requested
- [ ] Backend deployed to a production URL
- [ ] `EXPO_PUBLIC_API_URL` set in EAS secrets for production builds

## Type checking

```bash
# Mobile app
npm run typecheck

# Backend
cd backend && npm run typecheck
```

## Supported video platforms

| Platform | Status |
|----------|--------|
| YouTube | Supported (captions, transcript, oEmbed metadata) |
| Facebook | Supported (post caption + spoken audio transcript via yt-dlp) |
| TikTok | Planned |
| Instagram | Planned |

### Spoken audio transcription

Facebook Reels rarely include full recipes in the post caption. The backend downloads video audio with **yt-dlp** and transcribes it so you can compare spoken words with extracted ingredients.

**Requirements:**

1. [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) and **ffmpeg** on your PATH
2. **Local Whisper server** (included in this repo — no OpenAI key needed)

#### Local Whisper setup (Windows)

**Terminal 1 — Whisper** (first run downloads ~500 MB model):

```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/start-whisper.ps1
```

Wait until you see `Model ready.` and the server listening on port 8000.

Verify: open http://localhost:8000/health — should show `{"status":"ok","model":"small"}`

**Terminal 2 — Backend:**

```powershell
cd backend
npm run dev
```

**Terminal 3 — App:**

```powershell
cd "C:\Recipe Extractor"
npm run preview
```

**`backend/.env`** (already configured if you followed setup):

```env
AUDIO_TRANSCRIPTION_ENABLED=true
TRANSCRIPTION_PROVIDER=whisper-api
WHISPER_API_URL=http://localhost:8000/v1
WHISPER_MODEL=whisper-1
```

The Source tab shows **Post caption** and **Spoken transcript** separately for Facebook videos.

**Optional:** Use a larger model for better accuracy (slower): `$env:WHISPER_MODEL_SIZE="medium"` before starting the whisper script.

## License

Private — all rights reserved.
