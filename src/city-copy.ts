import type { City, countries } from './cities';
import type { Landmark } from './landmarks';
import type { Language } from './missions';

export const guideCopy = {
  sv: {
    title: 'Lär känna din stad', back: 'Tillbaka',
    photo: 'Ta ett foto', choosePhoto: 'Välj ett foto', photoIntro: 'Fotografera er upptäckt tillsammans. Bilden sparas i samma minnesbok som era andra uppdrag.',
    photoSaved: 'Fotot är sparat i minnesboken!', album: 'Öppna minnesboken', photoCount: (count: number) => 'Fotominnen: ' + count,
    savedXP: (xp: number) => xp ? '+' + xp + ' XP för ert första besök!' : 'Ni har redan fått XP för den här platsen. Nu har ni ett nytt minne!',
    photoSave: 'Spara fotot i minnesboken', photoSaving: 'Sparar fotot...', pickerError: 'Fotot kunde inte öppnas. Försök igen.',
    intro: 'Välj ett land och sedan en stad. Upptäck kända platser med små uppdrag för dig och din vuxen!',
    countryMissing: 'Landet hittades inte', cityMissing: 'Staden hittades inte',
    citiesAvailable: (count: number) => 'Städer att upptäcka: ' + count,
    discover: (name: string) => 'Upptäck ' + name,
    hint: 'Läs tillsammans, prova en mini-utmaning och checka in när ni är där. Uppdragen kan göras utomhus utan att köpa entré.',
    progress: (count: number, total: number) => 'Upptäckta platser: ' + count + ' / ' + total,
    firstVisit: (name: string) => 'Varje plats ger 50 XP första gången för ' + name + '.',
    earned: (name: string) => 'Hurra! Ni har upptäckt ' + name + ' och fått +50 XP!',
    visitedNotice: 'Platsen är redan besökt.', saveError: 'Besöket kunde inte sparas. Försök igen.',
    mapError: 'Kartan kunde inte öppnas. Försök igen.', stamp: '★ Besökt!',
    fact: 'Visste du att...', challenge: 'Mini-utmaning', map: 'Öppna i kartan',
    visited: 'Redan besökt', saving: 'Sparar besöket...', checkIn: 'Checka in (+50 XP)',
  },
  en: {
    title: 'Discover your city', back: 'Back',
    photo: 'Take a photo', choosePhoto: 'Choose a photo', photoIntro: 'Photograph your discovery together. The picture goes into the same memory album as your other missions.',
    photoSaved: 'Photo saved in your memory album!', album: 'Open memory album', photoCount: (count: number) => 'Photo memories: ' + count,
    savedXP: (xp: number) => xp ? '+' + xp + ' XP for your first visit!' : 'You have already earned XP for this place. Now you have a new memory!',
    photoSave: 'Save photo to memory album', photoSaving: 'Saving photo...', pickerError: 'Could not open the photo. Please try again.',
    intro: 'Choose a country, then a city. Discover famous places with little challenges for you and your grown-up!',
    countryMissing: 'Country not found', cityMissing: 'City not found',
    citiesAvailable: (count: number) => 'Cities to discover: ' + count,
    discover: (name: string) => 'Discover ' + name,
    hint: 'Read together, try a mini-challenge and check in when you get there. You can do the challenges outdoors without buying an entrance ticket.',
    progress: (count: number, total: number) => 'Places discovered: ' + count + ' / ' + total,
    firstVisit: (name: string) => name + ' earns 50 XP for the first visit to each place.',
    earned: (name: string) => 'Hooray! You discovered ' + name + ' and earned +50 XP!',
    visitedNotice: 'You have already visited this place.', saveError: 'Could not save your visit. Please try again.',
    mapError: 'Could not open the map. Please try again.', stamp: '★ Visited!',
    fact: 'Did you know...', challenge: 'Mini-challenge', map: 'Open in maps',
    visited: 'Already visited', saving: 'Saving your visit...', checkIn: 'Check in (+50 XP)',
  },
};

type PlaceText = Pick<Landmark, 'name' | 'neighborhood' | 'fact' | 'challenge'>;
// Exhaustive IDs ensure future places cannot be added without English content.
export const englishLandmarks: Record<Landmark['id'], PlaceText> = {
  lappstiftet: {
    name: 'Läppstiftet (The Lipstick)', neighborhood: 'Lilla Bommen · City centre',
    fact: 'Look at the red and white house reaching high above the water! People call it The Lipstick because the top looks like a giant lipstick.',
    challenge: 'Stand beside your grown-up and stretch your arms as tall as the house. Can you find both red and white?',
  },
  slottsskogen: {
    name: 'Slottsskogen Park', neighborhood: 'Slottsskogen · Linnéstaden',
    fact: 'Here is a big green park right in the city. Seals and moose are among the animals living in its zoo. The seals are wonderful swimmers!',
    challenge: 'Look for a seal together. Make little swimming movements with your arms and invent a name for your own pretend seal.',
  },
  'haga-skansen': {
    name: 'Skansen Kronan', neighborhood: 'Haga · Skansberget',
    fact: 'An old stone tower stands on the hill with a big golden crown on its roof. Long ago, the tower helped protect Gothenburg. Now we can look for the crown together!',
    challenge: 'Look for the golden crown from the ground. Make a crown with your hands and show each other a royal wave.',
  },
  poseidon: {
    name: 'Poseidon at Götaplatsen', neighborhood: 'Götaplatsen · Lorensberg',
    fact: 'Here stands Poseidon, the sea king from old stories. He holds a fish and a shell. There are more wonderful sea creatures around him to discover!',
    challenge: 'Stay on the ground beside your grown-up. Look for the fish, then each make your funniest fish face.',
  },
  'stockholm-stadshuset': {
    name: 'Stockholm City Hall', neighborhood: 'Kungsholmen · Hantverkargatan',
    fact: 'This big brick building has a tower with three golden crowns at the very top. People who make decisions about Stockholm work here. It is like a huge planning hut for the city!',
    challenge: 'Look up at the tower together and count the crowns. Then hold up the same number of fingers.',
  },
  'stockholm-slottet': {
    name: 'The Royal Palace', neighborhood: 'Gamla stan · Slottsbacken',
    fact: 'A real palace in the middle of the city! It has grand halls and lots of windows. The palace is used for royal visits and celebrations, a little like a very big party house.',
    challenge: 'Choose a row of windows and count five together. Then invent your grandest royal greeting.',
  },
  'stockholm-stortorget': {
    name: 'Stortorget Square', neighborhood: 'Gamla stan · Old Town',
    fact: 'Old houses in different colours stand close together, almost like books on a shelf. This is the oldest square in Stockholm. Imagine all the little and big feet that have walked here!',
    challenge: 'Each choose a house and name its colour. What colour would your own fairy-tale house be?',
  },
  'stockholm-vasa': {
    name: 'The Vasa Museum', neighborhood: 'Djurgården · Galärvarvet',
    fact: 'Inside the museum is Vasa, a huge old wooden ship. Three masts rise from the museum roof to show how tall the ship once was. A house wearing a ship’s hat!',
    challenge: 'Look at the museum from outside and find the masts on its roof. Stand next to each other and pretend to steer a big ship.',
  },
};

export function localizeLandmark(place: Landmark, language: Language): Landmark {
  return language === 'en' ? { ...place, ...englishLandmarks[place.id] } : place;
}
export function localizeCity(city: City, language: Language): City {
  return language === 'en' ? { ...city, ...city.en } : city;
}
export function localizeCountry(country: typeof countries[number], language: Language) {
  return language === 'en' ? { ...country, ...country.en } : country;
}
