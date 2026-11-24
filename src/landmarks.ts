export const landmarkCheckInXP = 50;

// Stable IDs keep existing stamps and XP when the city guide is reorganised.
export const landmarks = [
  {
    id: 'lappstiftet', name: 'Läppstiftet', neighborhood: 'Lilla Bommen · Centrum',
    icon: 'business-outline', color: '#FFE2DC',
    fact: 'Titta, ett rött och vitt hus som sträcker sig högt över vattnet! Det kallas Läppstiftet eftersom toppen liknar ett jättestort läppstift.',
    challenge: 'Stå bredvid din vuxen och sträck armarna lika högt som huset. Kan ni hitta både rött och vitt?',
    latitude: 57.7131, longitude: 11.9672,
  },
  {
    id: 'slottsskogen', name: 'Slottsskogen', neighborhood: 'Slottsskogen · Linnéstaden',
    icon: 'leaf-outline', color: '#E0EDDD',
    fact: 'Här finns en stor grön park mitt i staden. I djurparken bor bland annat sälar och älgar. Sälarna är riktiga simmästare!',
    challenge: 'Spana efter en säl tillsammans. Gör små simtag med armarna och hitta på ett namn åt er egen låtsassäl.',
    latitude: 57.6845, longitude: 11.9415,
  },
  {
    id: 'haga-skansen', name: 'Skansen Kronan', neighborhood: 'Haga · Skansberget',
    icon: 'shield-outline', color: '#EDE4FA',
    fact: 'På berget står ett gammalt stentorn med en stor guldkrona på taket. Förr skulle tornet hjälpa till att skydda Göteborg. Nu kan vi spana på kronan tillsammans!',
    challenge: 'Leta efter guldkronan från marken. Forma en egen krona med händerna och visa hur en kunglig vinkning ser ut.',
    latitude: 57.6965, longitude: 11.9583,
  },
  {
    id: 'poseidon', name: 'Poseidon på Götaplatsen', neighborhood: 'Götaplatsen · Lorensberg',
    icon: 'water-outline', color: '#DDF3F6',
    fact: 'Här står Poseidon, havets kung i gamla sagor. Han håller i en fisk och en snäcka. Runt honom finns fler spännande havsfigurer att upptäcka!',
    challenge: 'Stå kvar på marken bredvid din vuxen. Leta efter fisken och gör sedan varsin tokig fiskmin.',
    latitude: 57.6971, longitude: 11.9795,
  },
  {
    id: 'stockholm-stadshuset', name: 'Stadshuset', neighborhood: 'Kungsholmen · Hantverkargatan',
    icon: 'business-outline', color: '#FFF0CC',
    fact: 'Det här stora tegelhuset har ett torn med tre gyllene kronor högst upp. Här arbetar människor som bestämmer saker om Stockholm, som en stor planeringsstuga för staden!',
    challenge: 'Spana upp mot tornet tillsammans och räkna kronorna. Håll sedan upp lika många fingrar.',
    latitude: 59.3275, longitude: 18.0550,
  },
  {
    id: 'stockholm-slottet', name: 'Kungliga slottet', neighborhood: 'Gamla stan · Slottsbacken',
    icon: 'shield-outline', color: '#EDE4FA',
    fact: 'Ett riktigt slott mitt i staden! Här finns stora salar och massor av fönster. Slottet används vid kungliga besök och högtider, ungefär som ett väldigt stort kalashus.',
    challenge: 'Välj en rad med fönster och räkna fem tillsammans. Hitta sedan på er allra ståtligaste kungliga hälsning.',
    latitude: 59.3269, longitude: 18.0717,
  },
  {
    id: 'stockholm-stortorget', name: 'Stortorget', neighborhood: 'Gamla stan',
    icon: 'home-outline', color: '#FFE2DC',
    fact: 'Här står gamla hus i olika färger tätt tillsammans, nästan som böcker i en bokhylla. Det här är Stockholms äldsta torg. Tänk så många små och stora fötter som har gått här!',
    challenge: 'Välj varsitt hus och säg vilken färg det har. Vilken färg skulle ert eget sagohus ha?',
    latitude: 59.3249, longitude: 18.0707,
  },
  {
    id: 'stockholm-vasa', name: 'Vasamuseet', neighborhood: 'Djurgården · Galärvarvet',
    icon: 'boat-outline', color: '#DDF3F6',
    fact: 'Inne i museet finns Vasa, ett jättestort gammalt träskepp. På museets tak sticker tre master upp och visar hur högt skeppet en gång var. Ett hus med skeppsmössa!',
    challenge: 'Titta på museet utifrån och leta efter masterna på taket. Stå bredvid varandra och låtsas styra ett stort skepp.',
    latitude: 59.3280, longitude: 18.0914,
  },
] as const;

// These four former Göteborg entries are no longer shown in the four-stop guide.
// Keep their saved IDs valid so an upgrade never removes earned XP or rewards.
const previousLandmarkIds = ['alvsborgsbron', 'feskekorka', 'liseberg', 'sodra-skargarden'] as const;

export type Landmark = Omit<typeof landmarks[number], 'name' | 'neighborhood' | 'fact' | 'challenge'> & {
  name: string; neighborhood: string; fact: string; challenge: string;
};

export function restoreLandmarkVisits(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => landmarks.some(place => place.id === id) || previousLandmarkIds.some(previous => previous === id)))]
    : [];
}

export function landmarkXP(visits: unknown): number {
  return restoreLandmarkVisits(visits).length * landmarkCheckInXP;
}

export function landmarkMapURL(place: Landmark, platform: string): string {
  const coordinates = place.latitude + ',' + place.longitude;
  return platform === 'ios'
    ? 'https://maps.apple.com/?daddr=' + coordinates + '&q=' + encodeURIComponent(place.name)
    : 'https://www.google.com/maps/dir/?api=1&destination=' + coordinates;
}
