import type { Player } from './journal';
import type { Language } from './missions';
import { copy } from './text';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SeasonVisit = { id: string; date: string; photo: string; note: string };
export type SeasonalPlace = { id: string; name: string; frameHint: string; visits: SeasonVisit[] };
export const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const seasonColors = { spring: '#E0EDDD', summer: '#FFF0AD', autumn: '#FCE0C3', winter: '#DDF3F6' };
const labels = { spring: 'seasonSpring', summer: 'seasonSummer', autumn: 'seasonAutumn', winter: 'seasonWinter' } as const;
export const seasonTitle = (season: Season, language: Language) => copy[language][labels[season]];
export function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validVisitDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
export function seasonForDate(value: string): Season {
  if (!validVisitDate(value)) throw new Error('Invalid visit date');
  const month = Number(value.slice(5, 7));
  return month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
}
export function visitDateLabel(value: string, language: Language) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function yearSummary(place: SeasonalPlace, year: number): Partial<Record<Season, SeasonVisit>> {
  const result: Partial<Record<Season, SeasonVisit>> = {};
  for (const visit of place.visits) {
    if (Number(visit.date.slice(0, 4)) !== year) continue;
    const season = seasonForDate(visit.date);
    if (!result[season] || visit.date >= result[season]!.date) result[season] = visit;
  }
  return result;
}
export function restoreSeasonalPlaces(value: unknown): SeasonalPlace[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(place => {
    if (!place || typeof place.id !== 'string' || !place.id || seen.has(place.id) || typeof place.name !== 'string' || !place.name.trim()) return [];
    seen.add(place.id);
    const visits = new Set<string>();
    return [{ id: place.id, name: place.name.trim().slice(0, 60), frameHint: typeof place.frameHint === 'string' ? place.frameHint.slice(0, 160) : '', visits: (Array.isArray(place.visits) ? place.visits : []).filter((visit: SeasonVisit) => {
      if (!visit || typeof visit.id !== 'string' || !visit.id || visits.has(visit.id) || typeof visit.date !== 'string' || !validVisitDate(visit.date) || typeof visit.photo !== 'string' || !/^season-[a-zA-Z0-9-]+\.jpg$/.test(visit.photo)) return false;
      visits.add(visit.id); return true;
    }).map((visit: SeasonVisit) => ({ id: visit.id, date: visit.date, photo: visit.photo, note: typeof visit.note === 'string' ? visit.note.slice(0, 400) : '' })) }];
  });
}
export function addSeasonPlace(player: Player, id: string, name: string, frameHint: string): Player {
  if (!id || !name.trim()) throw new Error('Place name is required');
  if (player.seasonalPlaces?.some(place => place.id === id)) return player;
  return { ...player, seasonalPlaces: [...(player.seasonalPlaces ?? []), { id, name: name.trim().slice(0, 60), frameHint: frameHint.trim().slice(0, 160), visits: [] }] };
}
export function addSeasonVisit(player: Player, placeId: string, visit: SeasonVisit): Player {
  if (!validVisitDate(visit.date) || !/^season-[a-zA-Z0-9-]+\.jpg$/.test(visit.photo) || !visit.id) throw new Error('Invalid visit');
  const place = player.seasonalPlaces?.find(item => item.id === placeId);
  if (!place) throw new Error('Place is unavailable');
  if (place.visits.some(item => item.id === visit.id)) return player;
  return { ...player, seasonalPlaces: player.seasonalPlaces!.map(item => item === place ? { ...place, visits: [...place.visits, { ...visit, note: visit.note.trim().slice(0, 400) }] } : item) };
}
export function removeSeasonPlace(player: Player, placeId: string): Player {
  if (!player.seasonalPlaces?.some(place => place.id === placeId)) throw new Error('Place is unavailable');
  return { ...player, seasonalPlaces: player.seasonalPlaces.filter(place => place.id !== placeId) };
}
export function removeSeasonVisit(player: Player, placeId: string, visitId: string): Player {
  const place = player.seasonalPlaces?.find(item => item.id === placeId);
  if (!place?.visits.some(visit => visit.id === visitId)) throw new Error('Visit is unavailable');
  return { ...player, seasonalPlaces: player.seasonalPlaces!.map(item => item === place ? { ...place, visits: place.visits.filter(visit => visit.id !== visitId) } : item) };
}
