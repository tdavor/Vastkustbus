const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file, mocks = {}) {
  const full = path.resolve(file);
  if (cache.has(full) && !Object.keys(mocks).length) return cache.get(full);
  const exports = {};
  if (!Object.keys(mocks).length) cache.set(full, exports);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', code)(exports, name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(full), name + '.ts'));
    throw Error('Unexpected import ' + name);
  });
  return exports;
}
const { editMemory, restoreFamily, replacePlayer } = load('src/journal.ts');
const { initialRewards } = load('src/rewards.ts');
const memory = { id: 'm1', missionId: 1, xp: 42, date: '2026-11-23T12:00:00Z', photo: 'original.jpg' };
const player = { id: 'p1', profile: { name: 'Child', avatar: 'moose' }, memories: [memory], rewards: initialRewards };
const other = { ...player, id: 'p2' };
const family = { version: 2, language: 'sv', activeId: 'p1', players: [player, other] };
const edited = replacePlayer(family, 'p1', value => editMemory(value, 'm1', { story: '  We saw a seal!  ', coloredPhoto: 'artwork-123.jpg', xp: 9999 }));
assert.equal(edited.players[0].memories[0].story, 'We saw a seal!');
assert.equal(edited.players[0].memories[0].xp, 42);
assert.equal(edited.players[0].memories[0].photo, memory.photo);
assert.equal(edited.players[0].memories[0].date, memory.date);
assert.equal(edited.players[0].rewards, player.rewards);
assert.equal(edited.players[1], other);
assert.equal(memory.story, undefined, 'old record is immutable');
assert.throws(() => editMemory(player, 'missing', { story: 'x' }));
assert.throws(() => editMemory(player, 'm1', { coloredPhoto: '../original.jpg' }));
assert.equal(editMemory(player, 'm1', { story: 'a'.repeat(800) }).memories[0].story.length, 600);
const restored = restoreFamily(JSON.parse(JSON.stringify(edited)));
assert.equal(restored.players[0].memories[0].coloredPhoto, 'artwork-123.jpg');
assert.equal(restored.players[0].memories[0].story, 'We saw a seal!');
assert.equal(restored.players[0].memories[0].xp, 42);
assert.equal(editMemory(edited.players[0], 'm1', { story: '' }).memories[0].story, undefined);
const legacy = restoreFamily({ version: 1, language: 'en', profile: player.profile, memories: [memory], rewards: initialRewards });
assert.equal(legacy.players[0].memories[0].photo, 'original.jpg');

const { familyBookHTML } = load('src/family-book-html.ts');
const image = 'data:image/jpeg;base64,YQ==';
const malicious = '<script>alert("x")</script>&';
const html = familyBookHTML(malicious, malicious, 1, [{ title: malicious, date: malicious, place: malicious, story: malicious, image, kind: 'photo' }], 'sv');
assert(!html.includes('<script>'));
assert(html.includes('&lt;script&gt;'));
assert(html.includes('lang="sv"') && html.includes('size:A4 portrait'));
assert.equal((html.match(/<section /g) || []).length, 2);
assert(!/https?:\/\//.test(html));
assert.throws(() => familyBookHTML('x', 'x', 13, [], 'en'));
assert.throws(() => familyBookHTML('x', 'x', 1, [{ image: 'file:///private/photo.jpg', kind: 'photo' }], 'en'));

let capturedHTML, deleted = [], resized = [], modelCalls = 0;
class MockFile {
  constructor(uri) { this.uri = uri; }
  get exists() { return true; }
  async base64() { return 'YQ=='; }
  delete() { deleted.push(this.uri); }
}
let temporaryId = 0;
const { generateFamilyBook, BookCancelled } = load('src/family-book.ts', {
  'expo-file-system': { File: MockFile },
  'expo-image-manipulator': { SaveFormat: { JPEG: 'jpeg' }, manipulateAsync: async (uri, actions) => { resized.push(actions[0].resize); return { uri: 'file:///temporary/image-' + (++temporaryId) + '.jpg' }; } },
  'expo-print': { printToFileAsync: async ({ html }) => { capturedHTML = html; return { uri: 'file:///temporary/book.pdf' }; } },
  'react-native': { Image: { getSize: (uri, resolve) => resolve(2000, 1500) } },
  './coloring': { createColoring: async () => { modelCalls++; return { uri: 'file:///private/drawing.png' }; } },
  './family-book-html': load('src/family-book-html.ts'),
  './memory': { dateLabel: () => '23 nov. 2026', placeLabel: () => 'Göteborg' },
  './missions': { missions: [{ id: 1, title: { sv: 'Äventyr', en: 'Adventure' } }] },
  './store': { photoFile: name => ({ uri: 'file:///private/' + name }) }
});
(async () => {
  const opts = { memories: [{ ...memory, story: malicious, coloredPhoto: 'artwork-123.jpg' }], title: 'Book', name: 'Child', language: 'sv', drawings: true, artwork: true, active: () => true, progress: () => {} };
  assert.equal(await generateFamilyBook(opts), 'file:///temporary/book.pdf');
  assert.equal((capturedHTML.match(/<section /g) || []).length, 4, 'cover + photo/story + drawing + artwork');
  assert.equal(modelCalls, 1);
  assert(resized.every(size => Math.max(size.width, size.height) <= 1000));
  assert.equal(deleted.length, 2);
  assert(deleted.every(uri => uri.startsWith('file:///temporary/')), 'only temporary resized copies are deleted');
  modelCalls = 0;
  await generateFamilyBook({ ...opts, drawings: false, artwork: false });
  assert.equal(modelCalls, 0, 'optional drawing generation is truly skipped');
  assert.equal((capturedHTML.match(/<section /g) || []).length, 2);
  await generateFamilyBook({ ...opts, language: 'en', memories: [{ ...memory, missionId: 0, landmarkId: 'stockholm-slottet' }], drawings: false, artwork: false });
  assert(capturedHTML.includes('The Royal Palace'), 'city photos retain their landmark title in the exported album');
  await assert.rejects(generateFamilyBook({ ...opts, active: () => false }), BookCancelled);
  await assert.rejects(generateFamilyBook({ ...opts, memories: Array(13).fill(memory) }), /Invalid selection/);
  console.log('Memory edits, legacy restore, XP isolation, safe PDF HTML, page selection, resize/cleanup and cancellation checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
