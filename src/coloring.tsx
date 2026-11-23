import { requireOptionalNativeModule } from 'expo-modules-core';
import { photoFile } from './store';

type DrawingResult = { uri: string; width?: number; height?: number };
type DrawingEngine = {
  createDrawing: (source: string, destination: string) => Promise<DrawingResult>;
  adjustDetail: (source: string, destination: string, detail: number) => Promise<DrawingResult>;
};
const engine = requireOptionalNativeModule<DrawingEngine>('InformativeDrawings');
const pending = new Map<string, Promise<DrawingResult>>();

export const drawingEngineAvailable = Boolean(engine);
export const normalizeDetail = (value: number) => Math.max(0, Math.min(100, Math.round(value / 5) * 5));
// New cache namespace: the former edge-filter PNGs must never be reused.
export function coloringFile(photo: string, detail = 100) {
  return photoFile(`informative-style1-v1-${normalizeDetail(detail)}-${encodeURIComponent(photo)}.png`);
}

async function once(key: string, action: () => Promise<DrawingResult>) {
  const existing = pending.get(key);
  if (existing) return existing;
  const task = action();
  pending.set(key, task);
  try { return await task; }
  finally { if (pending.get(key) === task) pending.delete(key); }
}

export async function createColoring(photo: string, detail: number): Promise<DrawingResult> {
  if (!engine) throw new Error('Drawing engine needs an Android build');
  const source = photoFile(photo);
  if (!source.exists) throw new Error('Memory no longer exists');
  const base = coloringFile(photo);
  await once(base.uri, async () => {
    if (base.exists && base.size > 0) return { uri: base.uri };
    return engine.createDrawing(source.uri, base.uri);
  });
  const amount = normalizeDetail(detail);
  if (amount === 100) return { uri: base.uri };
  const destination = coloringFile(photo, amount);
  return once(destination.uri, async () => {
    if (!source.exists) throw new Error('Memory no longer exists');
    if (destination.exists && destination.size > 0) return { uri: destination.uri };
    return engine.adjustDetail(base.uri, destination.uri, amount);
  });
}

export function discardColoring(photo: string, detail: number) {
  const file = coloringFile(photo, detail);
  if (file.exists) file.delete();
}
