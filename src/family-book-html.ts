import type { Language } from './missions';
import { copy } from './text';

export const maxBookMemories = 12;
export type BookPage = { title: string; date: string; place?: string; story?: string; image: string; kind: 'photo' | 'drawing' | 'artwork' };
export const escapeHTML = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export function familyBookHTML(title: string, name: string, count: number, pages: BookPage[], language: Language, labels?: { count: string; photo: string; story: string }) {
  const t = copy[language];
  if (!Number.isInteger(count) || count < 1 || count > maxBookMemories || !pages.length || pages.length > count * 3) throw new Error('Invalid book size');
  const heading = escapeHTML(title.trim().slice(0, 80) || t.defaultBookTitle);
  const sections = pages.map((page, index) => {
    if (!/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(page.image)) throw new Error('Invalid book image');
    const label = page.kind === 'photo' ? (labels?.photo ?? t.bookPhotos) : page.kind === 'drawing' ? t.bookDrawing : t.bookArtwork;
    return `<section class="page"><header><p class="eyebrow">${escapeHTML(label)}</p><h2>${escapeHTML(page.title)}</h2><p class="meta">${escapeHTML(page.date)}${page.place ? ' · ' + escapeHTML(page.place) : ''}</p></header>
      <img class="${page.story ? 'with-story' : 'full-photo'}" src="${page.image}" alt="${escapeHTML(label)}">
      ${page.story ? `<div class="story"><h3>${escapeHTML(labels?.story ?? t.ourStory)}</h3><p>${escapeHTML(page.story.slice(0, 600))}</p></div>` : ''}
      <footer>${heading} · ${index + 2}</footer></section>`;
  }).join('');
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
    <style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#173d30;font-family:Arial,sans-serif}.page{width:190mm;height:276mm;position:relative;break-after:page;page-break-after:always;padding:0 0 10mm;overflow-wrap:anywhere}.page:last-child{break-after:auto;page-break-after:auto}header{margin-bottom:5mm}h2{font-size:23px;line-height:1.2;margin:2mm 0}h3{font-size:16px;margin:3mm 0 1mm}.eyebrow,.meta{font-size:12px;margin:1mm 0}.eyebrow{text-transform:uppercase;letter-spacing:1px;color:#2d6a4f}img{display:block;margin:auto;width:100%;object-fit:contain}.with-story{height:135mm}.full-photo{height:213mm}.story p{white-space:normal;word-break:break-word;font-size:15px;line-height:20px;margin:0}footer{position:absolute;bottom:2mm;left:0;right:0;text-align:center;font-size:11px;color:#4d6559}.cover{padding:35mm 10mm;text-align:center;background:#f7faef;border:2mm solid #e0eddd}.cover h1{font-size:38px;line-height:1.2;margin:10mm 0;word-break:break-word}.cover p{font-size:20px;line-height:1.5}.cover .brand{font-size:22px;letter-spacing:2px;color:#2d6a4f}</style></head><body>
    <section class="page cover"><p class="brand">MINNETRAIL</p><h1>${heading}</h1><p>${escapeHTML(name.slice(0, 80))}</p><p>${count} ${escapeHTML(labels?.count ?? t.bookCount)}</p><footer>${escapeHTML(t.bookCredit)}</footer></section>${sections}</body></html>`;
}
