import { landmarks, restoreLandmarkVisits, type Landmark } from './landmarks';
import type { Icon } from './ui';

type LandmarkId = Landmark['id'];
export type City = {
  id: string; countryId: string; name: string; description: string;
  en: { name: string; description: string };
  icon: Icon; color: string; landmarkIds: readonly LandmarkId[];
};

// Add a country here and cities below; the navigation and counters are data-driven.
export const countries = [
  { id: 'sweden', name: 'Sverige', en: { name: 'Sweden', description: 'From harbours and parks to palaces and old squares. Which city would you like to explore together?' }, description: 'Från hamnar och parker till slott och gamla torg. Vilken stad vill ni lära känna tillsammans?', icon: 'flag-outline', color: '#FFF0CC' },
] as const;

export const cities: readonly City[] = [
  {
    id: 'gothenburg', countryId: 'sweden', name: 'Göteborg',
    en: { name: 'Gothenburg', description: 'Welcome to the city by the sea! Discover a house shaped like a lipstick, animals in a park, a golden crown on a tower and the sea king from old stories.' },
    description: 'Välkommen till staden vid havet! Här väntar ett hus som liknar ett läppstift, djur i en park, en guldkrona högt på ett torn och sagornas havskung.',
    icon: 'boat-outline', color: '#DDF3F6',
    landmarkIds: ['lappstiftet', 'slottsskogen', 'haga-skansen', 'poseidon'],
  },
  {
    id: 'stockholm', countryId: 'sweden', name: 'Stockholm',
    en: { name: 'Stockholm', description: 'Welcome to the capital of Sweden! There is water between the islands, a real palace and old houses in cheerful colours. Come and discover the city’s little secrets.' },
    description: 'Välkommen till Sveriges huvudstad! Här finns vatten mellan öarna, ett riktigt slott och gamla hus i glada färger. Följ med och leta efter stadens små hemligheter.',
    icon: 'business-outline', color: '#EDE4FA',
    landmarkIds: ['stockholm-stadshuset', 'stockholm-slottet', 'stockholm-stortorget', 'stockholm-vasa'],
  },
];

export function cityLandmarks(city: City): Landmark[] {
  return city.landmarkIds.map(id => {
    const place = landmarks.find(item => item.id === id);
    if (!place) throw new Error('Unknown city landmark: ' + id);
    return place;
  });
}

export function cityProgress(city: City, visits: unknown): number {
  const restored = restoreLandmarkVisits(visits);
  return city.landmarkIds.filter(id => restored.includes(id)).length;
}
