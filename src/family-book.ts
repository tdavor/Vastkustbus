import { memoryTitle } from './memory-labels';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import { Image } from 'react-native';
import { createColoring } from './coloring';
import { familyBookHTML, maxBookMemories, type BookPage } from './family-book-html';
import { dateLabel, placeLabel } from './memory';
import { type Language } from './missions';
import { photoFile, type Memory } from './store';

export class BookCancelled extends Error {}

export async function inlineBookPhoto(uri: string, active: () => boolean, drawing = false) {
  if (drawing) {
    const data = await new File(uri).base64();
    if (!active()) throw new BookCancelled();
    return `data:image/png;base64,${data}`;
  }
  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
  if (!active()) throw new BookCancelled();
  const scale = Math.min(1, 1000 / Math.max(dimensions.width, dimensions.height));
  const image = await manipulateAsync(uri, [{ resize: {
    width: Math.max(1, Math.round(dimensions.width * scale)), height: Math.max(1, Math.round(dimensions.height * scale)),
  } }], { format: SaveFormat.JPEG, compress: 0.8 });
  const file = new File(image.uri);
  try {
    const data = await file.base64();
    if (!active()) throw new BookCancelled();
    return `data:image/jpeg;base64,${data}`;
  } finally { try { if (image.uri !== uri && file.exists) file.delete(); } catch {} }
}

export async function generateFamilyBook(options: {
  memories: Memory[]; name: string; title: string; language: Language;
  drawings: boolean; artwork: boolean;
  active: () => boolean; progress: (current: number, total: number) => void;
}) {
  const { memories, language, active } = options;
  if (!memories.length || memories.length > maxBookMemories) throw new Error('Invalid selection');
  const pages: BookPage[] = [];
  for (let index = 0; index < memories.length; index++) {
    if (!active()) throw new BookCancelled();
    options.progress(index + 1, memories.length);
    const memory = memories[index];
    const common = {
      title: memoryTitle(memory, language),
      date: dateLabel(memory, language), place: placeLabel(memory, language),
    };
    pages.push({ ...common, story: memory.story, kind: 'photo', image: await inlineBookPhoto(photoFile(memory.photo).uri, active) });
    if (options.drawings) {
      const drawing = await createColoring(memory.photo, 100);
      if (!active()) throw new BookCancelled();
      pages.push({ ...common, kind: 'drawing', image: await inlineBookPhoto(drawing.uri, active, true) });
    }
    if (options.artwork && memory.coloredPhoto) {
      pages.push({ ...common, kind: 'artwork', image: await inlineBookPhoto(photoFile(memory.coloredPhoto).uri, active) });
    }
  }
  if (!active()) throw new BookCancelled();
  options.progress(0, memories.length);
  const html = familyBookHTML(options.title, options.name, memories.length, pages, language);
  const result = await Print.printToFileAsync({ html, width: 595, height: 842 });
  if (!active()) { const file = new File(result.uri); if (file.exists) file.delete(); throw new BookCancelled(); }
  return result.uri;
}
