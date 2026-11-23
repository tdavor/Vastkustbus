import { File } from 'expo-file-system';
import * as Print from 'expo-print';

export function printableImageHTML(base64: string, png: boolean): string {
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) throw new Error('Invalid image data');
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>@page{size:A4 portrait;margin:10mm}html,body{margin:0;padding:0;background:white}'
    + 'body{width:190mm;height:276mm;display:flex;align-items:center;justify-content:center}'
    + 'img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body>'
    + '<img alt="" src="data:image/' + (png ? 'png' : 'jpeg') + ';base64,' + base64 + '"></body></html>';
}

export async function printImage(uri: string): Promise<void> {
  const file = new File(uri);
  await Print.printAsync({ html: printableImageHTML(await file.base64(), uri.toLowerCase().endsWith('.png')) });
}
