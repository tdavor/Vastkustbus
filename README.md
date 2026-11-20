# 🌊🌲 Västkustbus – Utomhusäventyr för föräldrar och förskolebarn

**[Ladda ner Android-APK / Download Android APK (v1.1.1)](https://github.com/tdavor/Vastkustbus/releases/download/v1.1.1/Vastkustbus-v1.1.1.apk)**

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
