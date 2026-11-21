export const landmarkCheckInXP = 50;

export const landmarks = [
  {
    id: 'lappstiftet', name: 'Läppstiftet (Lilla Bommen)', neighborhood: 'Lilla Bommen · Centrum',
    icon: 'business-outline', color: '#FFE2DC',
    fact: "Göteborgarna kallar det här röd-vita huset för 'Läppstiftet' eftersom det ser ut precis som ett jättestort läppstift vid vattnet!",
    challenge: 'Titta ända upp till toppen och vinka till fiskmåsarna som flyger runt tornet.',
    latitude: 57.7131, longitude: 11.9672,
  },
  {
    id: 'slottsskogen', name: 'Slottsskogen (Barnens Zoo & Säldammen)', neighborhood: 'Slottsskogen · Linnéstaden',
    icon: 'leaf-outline', color: '#E0EDDD',
    fact: 'Mitt i stan finns en jättestor park där riktiga djur bor – som sälar, pingviner och skogens kung, älgen!',
    challenge: 'Hitta säldammen och prova att klappa händerna precis som en säl.',
    latitude: 57.6845, longitude: 11.9415,
  },
  {
    id: 'alvsborgsbron', name: 'Älvsborgsbron', neighborhood: 'Klippan · Majorna',
    icon: 'boat-outline', color: '#DDF3F6',
    fact: 'Den här gigantiska gröna bron är så hög att stora båtar och färjor kan åka rakt under den utan att nudda!',
    challenge: 'Räkna hur många bilar eller båtar som åker förbi medan ni tittar på bron.',
    latitude: 57.6908, longitude: 11.9016,
  },
  {
    id: 'feskekorka', name: 'Feskekôrka', neighborhood: 'Rosenlund · Vallgraven',
    icon: 'fish-outline', color: '#FFF0CC',
    fact: 'Det här huset ser ut precis som en gammal kyrka, men istället för kyrkklockor är det fullt av fiskar, krabbor och räkor från havet!',
    challenge: 'Gå längs kanalen utanför och leta efter båtar som guppar i vattnet.',
    latitude: 57.7011, longitude: 11.9578,
  },
  {
    id: 'haga-skansen', name: 'Haga & Skansen Kronan', neighborhood: 'Haga',
    icon: 'shield-outline', color: '#EDE4FA',
    fact: 'I Haga finns Göteborgs äldsta trähus och kanelbullar stora som tallrikar! Uppe på berget vaktar en gammal stenfästning med en guldkrona på taket.',
    challenge: 'Gå på kullerstenarna och spana upp mot guldkronan på toppen av kullen.',
    latitude: 57.6980, longitude: 11.9554,
  },
  {
    id: 'poseidon', name: 'Poseidon på Götaplatsen', neighborhood: 'Götaplatsen · Lorensberg',
    icon: 'water-outline', color: '#DDF3F6',
    fact: 'Längst upp på Avenyn står Poseidon – en jättestor staty av havets kung som håller i en stor fisk och en snäcka!',
    challenge: 'Ställ er vid fontänen och gör er roligaste fiskmin.',
    latitude: 57.6971, longitude: 11.9795,
  },
  {
    id: 'liseberg', name: 'Liseberg', neighborhood: 'Korsvägen · Heden',
    icon: 'sparkles-outline', color: '#FFE5EE',
    fact: 'I Göteborgs berömda nöjespark bor en snäll, grön kanin som älskar kramar och berg-och-dalbanor!',
    challenge: 'Spana efter det stora pariserhjulet eller tornen som sticker upp över träden.',
    latitude: 57.6952, longitude: 11.9924,
  },
  {
    id: 'sodra-skargarden', name: 'Södra Skärgården (Styrsö / Vrångö)', neighborhood: 'Södra skärgården',
    icon: 'sunny-outline', color: '#FFF4AE',
    fact: 'Bara en kort båttur från Saltholmen ligger magiska öar där inga bilar får köra – bara cyklar, flakmopeder och sjöfåglar!',
    challenge: 'Spana ut över vattnet efter en vit skärgårdsbåt.',
    latitude: 57.6612, longitude: 11.8425,
  },
] as const;

export type Landmark = typeof landmarks[number];

export function restoreLandmarkVisits(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => landmarks.some(place => place.id === id)))]
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
