import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import { BookCancelled, inlineBookPhoto } from './family-book';
import { familyBookHTML, type BookPage } from './family-book-html';
import type { Language } from './missions';
import { seasonForDate, seasonTitle, visitDateLabel, yearSummary, type SeasonalPlace } from './seasons';
import { photoFile } from './store';
import { copy } from './text';

export async function generateSeasonBook(place: SeasonalPlace, year: number | undefined, name: string, language: Language, active: () => boolean) {
  const visits = Object.values(yearSummary(place, year)).sort((a, b) => a.date.localeCompare(b.date));
  if (!visits.length) throw new Error('No visits');
  const pages: BookPage[] = [];
  for (const visit of visits) {
    if (!active()) throw new BookCancelled();
    pages.push({ title: seasonTitle(seasonForDate(visit.date), language), date: visitDateLabel(visit.date, language),
      place: place.name, story: visit.note, kind: 'photo', image: await inlineBookPhoto(photoFile(visit.photo).uri, active) });
  }
  if (!active()) throw new BookCancelled();
  const t = copy[language];
  const html = familyBookHTML(`${place.name} · ${year ?? t.seasonAllYears}`, name, visits.length, pages, language, { count: t.seasonBookCount, photo: t.seasonPhoto, story: t.seasonNote });
  const result = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (!active()) { const file = new File(result.uri); if (file.exists) file.delete(); throw new BookCancelled(); }
  return { uri: result.uri, visitIds: visits.map(visit => visit.id) };
}
