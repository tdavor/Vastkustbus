# 🌊🌲 Västkustbus – Utomhusäventyr för föräldrar och förskolebarn

**[Ladda ner Android-APK / Download Android APK (v1.2.1)](https://github.com/tdavor/Vastkustbus/releases/download/v1.2.1/Vastkustbus-v1.2.1.apk)**

**Västkustbus** är en offline-först Android-app skapad för föräldrar och förskolebarn (3–6 år). Målet är att minska skärmtiden genom att använda mobilen enbart som en "fickkompass" och kamera, medan själva leken sker ute i naturen och staden – med fokus på **Göteborg och Västkusten**.

---

## 🎮 Hur spelet fungerar (Spelupplägg)

Spelet är utformat för att vara extremt enkelt att använda utomhus utan att ta fokus från barnet:

1. **Skapa en utforskarprofil:** Vid första start väljer föräldern och barnet ett namn samt en nordisk djuravatar (**Älg, Säl, Räv eller Lunnefågel**).
2. **Välj uppdrag:** Föräldern väljer en kategori (eller slumpar fram ett uppdrag), läser upp uppgiften för barnet på 5 sekunder och stoppar sedan tillbaka telefonen i fickan.
3. **Utforska och lös uppgiften:** Barnet och föräldern genomför aktiviteten tillsammans (t.ex. letar efter ett löv större än handen, bygger ett insektshotell eller vinkar till en blå spårvagn).
4. **Dokumentera & Samla XP:** När uppdraget är klart tar föräldern ett foto på resultatet eller barnet. Appen sparar automatiskt GPS-platsen och delar ut erfarenhetspoäng (**XP**).
5. **Gå upp i nivå & Dela minnen:** Varje **150 XP** tar barnet till en ny nivå. Alla äventyr sparas i en lokal minnesbok där föräldern med ett klick kan skapa ett färdigt "Västkustbus-vykort" och dela det på Facebook eller andra sociala medier.

---

## 🗺️ Uppdragskategorier & Poängsystem

Appen innehåller **20 förinlagda uppdrag** anpassade för förskolebarn i Göteborg, indelade i tre kategorier:

* 🌲 **Skog & Park (Slottsskogen, Delsjön, Botaniska, Änggårdsbergen):** Fokus på natur, känsel och balans (t.ex. *Insektshotell*, *Krama ett träd*, *Kott-bowling*, *Hitta djur i Slottsskogen*).
* 🌊 **Vid Havet & Vatten (Skärgården, Långedrag, Röda Sten):** Fokus på vatten, stenar och kustmiljö (t.ex. *Stentorn*, *Snäck- & krabbjakt*, *Vinka till Älvsnabben*, *Lyssna på vinden*).
* 🏘️ **Grannskap & Stadspromenad (Haga, Linné, Kvarteret):** Uppdrag som fungerar överallt (t.ex. *Hoppa i vattenpölar*, *Färgjakt: Gult*, *Skuggmonster*, *Härma en staty*).

### Poäng (XP) och Nivåer

Första gången ger full XP. Upprepade uppdrag ger hälften. Skattkistan låser upp belöningar vid 300, 600, 1000 och 1500 XP.
* **Enkla uppdrag:** 100 XP (t.ex. hitta en rund sten, titta på molnformer).
* **Medelsvåra uppdrag:** 150 XP (t.ex. balansera på en stock, bygga stentorn).
* **Större äventyr:** 200 XP (t.ex. bygga ett insektshotell, hitta ett lejon/staty).
* **Nivåsystem:** Var 150:e XP låser upp en ny utforskarnivå med tillhörande titel på vykortet.

---

## 🔒 Integritet & Offline-funktion

* **100 % Lokal lagring:** All data, inklusive foton, XP, nivåer och GPS-koordinater, sparas enbart lokalt på förälderns telefon via `AsyncStorage` och `expo-file-system`.
* **Ingen molnlagring eller konton:** Inga bilder laddas upp till någon server och inga barnprofiler delas publikt.
* **Fungerar utan täckning:** Perfekt för skogspromenader kring Delsjön eller ute i skärgården där mobiltäckningen kan vara svag.

---

## 🛠️ Teknikstack

* **Ramverk:** React Native med Expo (TypeScript) & Expo Router
* **Lokal databas & filsystem:** `@react-native-async-storage/async-storage`, `expo-file-system`
* **Kamera & Plats:** `expo-image-picker`, `expo-location`
* **Vykortsgenerator & Delning:** `react-native-view-shot`, `expo-sharing`

---
---

# 🌊🌲 Västkustbus – Outdoor Adventure App for Parents & Preschoolers

**Västkustbus** *(Swedish for "West Coast Play/Mischief")* is an offline-first Android mobile application created for parents and preschool children (ages 3–6). The goal is to minimize screen time by using the smartphone strictly as a "pocket compass" and camera, while the real play happens outdoors in nature and the city—focused on **Gothenburg and the Swedish West Coast**.

---

## 🎮 How the Game Works (Gameplay Loop)

The app is designed to be effortless to use outdoors without taking attention away from the child:

1. **Create an Explorer Profile:** On first launch, the parent and child enter a name and pick a Nordic animal avatar (**Moose, Seal, Fox, or Puffin**).
2. **Pick a Mission:** The parent selects a category (or shuffles a random task), reads the mission aloud in 5 seconds, and puts the phone back in their pocket.
3. **Explore & Complete Together:** Parent and child complete the activity together (e.g., finding a leaf bigger than their hand, building a bug hotel, or waving at a blue tram).
4. **Capture & Earn XP:** Once completed, the parent snaps a photo of the discovery or the child. The app automatically logs the GPS coordinates and awards Experience Points (**XP**).
5. **Level Up & Share Memories:** Every **150 XP** advances the child to a new Explorer Level. All completed missions are saved in a private Memory Book, where parents can generate a styled "Västkustbus Postcard" with one tap and share it on Facebook or other social apps.

---

## 🗺️ Mission Categories & Scoring System

The app comes pre-loaded with **20 Gothenburg-inspired preschool missions**, divided into three categories:

* 🌲 **Forest & Parks (Slottsskogen, Delsjön, Botaniska, Änggårdsbergen):** Focuses on nature, sensory exploration, and balance (e.g., *Bug Hotel*, *Tree Hugger*, *Pinecone Bowling*, *Animal Spotter*).
* 🌊 **By the Sea & Water (Archipelago, Långedrag, Röda Sten):** Focuses on coastal play and water (e.g., *Stone Tower*, *Shell & Crab Hunt*, *Wave at Älvsnabben Ferry*, *Wind Listener*).
* 🏘️ **Neighborhood & City Walk (Haga, Linné, Anywhere):** Everyday missions playable anywhere (e.g., *Puddle Jumper*, *Color Hunt: Yellow*, *Shadow Monster*, *Statue Pose*).

### Points (XP) & Leveling
* **Quick Tasks:** 100 XP (e.g., finding the roundest pebble, spotting cloud shapes).
* **Active Challenges:** 150 XP (e.g., balancing on a fallen log, stacking 4 stones).
* **Big Adventures:** 200 XP (e.g., building a bug hotel, finding a city statue).
* **Level Progression:** Every 150 XP unlocks a new level and updates the child's explorer title on shareable postcards.

---

## 🔒 Privacy & Offline-First Design

* **100% Local Storage:** All data—including photos, XP, levels, and GPS coordinates—is stored exclusively on the parent's device using `AsyncStorage` and `expo-file-system`.
* **No Cloud or Accounts:** No photos are uploaded to external servers, and no child profiles or live locations are ever shared publicly.
* **Works Without Signal:** Ideal for hikes around Delsjön or boat trips in the Gothenburg archipelago where mobile reception may be limited.

---

## 🛠️ Tech Stack

* **Framework:** React Native with Expo (TypeScript) & Expo Router
* **Local Storage:** `@react-native-async-storage/async-storage`, `expo-file-system`
* **Camera & GPS:** `expo-image-picker`, `expo-location`
* **Postcard Generator & Sharing:** `react-native-view-shot`, `expo-sharing`

ENGLISH


# 🌊🌲 Västkustbus – Outdoor Adventure App for Parents & Preschoolers

**Västkustbus** *(Swedish for "West Coast Play/Mischief")* is an offline-first Android mobile application created for parents and preschool children (ages 3–6). The goal is to minimize screen time by using the smartphone strictly as a "pocket compass" and camera, while the real play happens outdoors in nature and the city—focused on **Gothenburg and the Swedish West Coast**.

---

## 🎮 How the Game Works (Gameplay Loop)

The app is designed to be effortless to use outdoors without taking attention away from the child:

1. **Create an Explorer Profile:** On first launch, the parent and child enter a name and pick a Nordic animal avatar (**Moose, Seal, Fox, or Puffin**).
2. **Pick a Mission:** The parent selects a category (or shuffles a random task), reads the mission aloud in 5 seconds, and puts the phone back in their pocket.
3. **Explore & Complete Together:** Parent and child complete the activity together (e.g., finding a leaf bigger than their hand, building a bug hotel, or waving at a blue tram).
4. **Capture & Earn XP:** Once completed, the parent snaps a photo of the discovery or the child. The app automatically logs the GPS coordinates and awards Experience Points (**XP**).
5. **Level Up & Share Memories:** Every **150 XP** advances the child to a new Explorer Level. All completed missions are saved in a private Memory Book, where parents can generate a styled "Västkustbus Postcard" with one tap and share it on Facebook or other social apps.

---

## 🗺️ Mission Categories & Scoring System

The app comes pre-loaded with **20 Gothenburg-inspired preschool missions**, divided into three categories:

* 🌲 **Forest & Parks (Slottsskogen, Delsjön, Botaniska, Änggårdsbergen):** Focuses on nature, sensory exploration, and balance (e.g., *Bug Hotel*, *Tree Hugger*, *Pinecone Bowling*, *Animal Spotter*).
* 🌊 **By the Sea & Water (Archipelago, Långedrag, Röda Sten):** Focuses on coastal play and water (e.g., *Stone Tower*, *Shell & Crab Hunt*, *Wave at Älvsnabben Ferry*, *Wind Listener*).
* 🏘️ **Neighborhood & City Walk (Haga, Linné, Anywhere):** Everyday missions playable anywhere (e.g., *Puddle Jumper*, *Color Hunt: Yellow*, *Shadow Monster*, *Statue Pose*).

### Points (XP) & Leveling
* **Quick Tasks:** 100 XP (e.g., finding the roundest pebble, spotting cloud shapes).
* **Active Challenges:** 150 XP (e.g., balancing on a fallen log, stacking 4 stones).
* **Big Adventures:** 200 XP (e.g., building a bug hotel, finding a city statue).
* **Level Progression:** Every 150 XP unlocks a new level and updates the child's explorer title on shareable postcards.

---

## 🔒 Privacy & Offline-First Design

* **100% Local Storage:** All data—including photos, XP, levels, and GPS coordinates—is stored exclusively on the parent's device using `AsyncStorage` and `expo-file-system`.
* **No Cloud or Accounts:** No photos are uploaded to external servers, and no child profiles or live locations are ever shared publicly.
* **Works Without Signal:** Ideal for hikes around Delsjön or boat trips in the Gothenburg archipelago where mobile reception may be limited.

---

## 🛠️ Tech Stack

* **Framework:** React Native with Expo (TypeScript) & Expo Router
* **Local Storage:** `@react-native-async-storage/async-storage`, `expo-file-system`
* **Camera & GPS:** `expo-image-picker`, `expo-location`
* **Postcard Generator & Sharing:** `react-native-view-shot`, `expo-sharing`

---

## 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd vastkustbus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app:**
   ```bash
   npx expo start
   ```
   Scan the QR code with the **Expo Go** app on your Android device.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

## Offline coloring model (Android 1.5.0)

The album uses **Informative Drawings, style 1** by Caroline Chan et al.
Photos and resulting PNGs stay in private app storage. The original photo is never
replaced. Inference runs off the JS/UI thread through a local Expo module and ONNX
Runtime Android 1.23.2 (CPU, two threads). The model is packaged in the APK; no
runtime model download or account is needed. Expo Go does not include this module;
use a standalone or development Android build.

The 0–100 detail slider is **post-processing**, not a model parameter. At 100 it
preserves the original model pixels. Lower values fade weak gray lines through a
white-point adjustment; they do not semantically remove clothing patterns or
background objects. Adjusting the slider reuses the cached model output. Printing
and sharing always use the currently displayed, fully loaded PNG.

### Build the model before Android prebuild

Use Python 3.12. The export downloads the author's style-1 weights from a pinned
Hugging Face revision and checks SHA-256 before loading with `weights_only=True`.
Weights and generated ONNX are ignored by git. The build fails explicitly if the
model asset is missing; there is no fallback to the former edge filter.

```sh
python -m pip install --index-url https://download.pytorch.org/whl/cpu torch==2.15.0
python -m pip install onnx==1.20.1 onnxruntime==1.23.2
python scripts/prepare-drawing-model.py
python scripts/check-drawing-model.py
npm ci
npx expo prebuild --platform android --no-install
cd android
./gradlew :informative-drawings:testReleaseUnitTest :app:assembleRelease
```

The export check compares portrait and landscape tensor sizes with the original
PyTorch generator. CI also runs the Kotlin detail-control tests and builds/signs a
standalone APK. Inference quality, latency, print dialog and low-memory behavior
should additionally be checked on a physical Android device before release.

Upstream: https://github.com/carolineec/informative-drawings
Author demo/weights: https://huggingface.co/spaces/carolineec/informativedrawings
MIT copyright/license notices are retained in `scripts/drawings/LICENSE.txt` and
inside the Android asset bundle. ONNX Runtime is distributed under its MIT license.

## Family memories (1.6.0)

- **Our story:** an optional 600-character note on each memory. Saving a note does
  not complete another mission or change XP/rewards. Saved notes also appear on
  the shareable postcard. Unsaved edits are guarded when leaving the detail view.
- **Colored artwork:** photograph or choose an image of the child's finished
  coloring page. A normalized JPEG is saved separately from the original mission
  photo and model drawing. A replacement becomes active only after journal
  persistence succeeds; failed writes remove the new copy and preserve the old.
- **Family PDF:** select up to 12 memories in the album, enter a book title, and
  optionally include coloring pages and finished artwork. Pages are chronological.
  The A4 book has a cover and a photo/story page per memory, plus optional drawing
  and artwork pages. Photos are resized for memory usage; model PNGs retain their
  original pixels. All content is embedded locally; user text is HTML-escaped.
  Drawing generation is sequential and reuses existing caches. The screen shows
  progress and offers PDF sharing/saving and printing after creation.

Books stay in private app storage until a parent chooses a sharing destination.
Resetting the game deletes private exported books along with memory photos and
artwork. A reset or missing player/memory prevents a late export from being saved
back into the app. Copies previously saved through other apps are outside the
app's reset scope. The journal remains version 2 with optional memory fields, so
existing player profiles and completed missions need no destructive migration.

Validation: `node scripts/check-family-book.cjs` checks legacy restore, immutable
edits/XP isolation, escaping, export page choices, resized temporary-file cleanup,
selection limits and cancellation. Camera, PDF pagination and print services also
need a physical-device smoke test.
