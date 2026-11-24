import type { Memory } from './journal';
import { cities } from './cities';
import { localizeCity, localizeLandmark } from './city-copy';
import { landmarks } from './landmarks';
import { missions, type Language } from './missions';
import { copy } from './text';

export function memoryTitle(memory: Memory, language: Language): string {
  const landmark = memory.landmarkId && landmarks.find(place => place.id === memory.landmarkId);
  if (landmark) return localizeLandmark(landmark, language).name;
  return missions.find(mission => mission.id === memory.missionId)?.title[language] ?? copy[language].mission;
}

export function memoryCity(memory: Memory, language: Language): string {
  const city = memory.landmarkId && cities.find(city => city.landmarkIds.some(id => id === memory.landmarkId));
  return city ? localizeCity(city, language).name : copy[language].city;
}
