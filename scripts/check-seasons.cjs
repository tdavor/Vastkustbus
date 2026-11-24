const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
const cache = new Map();
function load(file, mocks = {}) {
  file = path.resolve(file);
  if (!Object.keys(mocks).length && cache.has(file)) return cache.get(file);
  const exports = {};
  if (!Object.keys(mocks).length) cache.set(file, exports);
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports, name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
    throw Error('Unexpected import ' + name);
  });
  return exports;
}
const s = load('src/seasons.ts');
const { restoreFamily } = load('src/journal.ts');
const { initialRewards } = load('src/rewards.ts');
assert(s.validVisitDate('2024-02-29'));
for (const date of ['2025-02-29', '2026-04-31', '2026-2-01', '2026-13-01', '', '2026-00-01']) assert(!s.validVisitDate(date), date);
for (const [date, season] of [['2026-02-28','winter'],['2026-03-01','spring'],['2026-05-31','spring'],['2026-06-01','summer'],['2026-08-31','summer'],['2026-09-01','autumn'],['2026-11-30','autumn'],['2026-12-01','winter']]) assert.equal(s.seasonForDate(date), season);
const memory = { id:'m1', missionId:1, xp:99, date:'2026-11-23', photo:'original.jpg' };
let player = { id:'p1', profile:{ name:'Child', avatar:'moose' }, memories:[memory], rewards:initialRewards };
player = s.addSeasonPlace(player, 'p', ' Our oak ', 'Beside the bench');
player = s.addSeasonPlace(player, 'other', 'Other place', '');
const visits = [['one','2026-04-01'],['old','2025-08-01'],['two','2026-07-01'],['three','2026-10-01'],['four','2026-12-01'],['five','2026-04-15'],['six','2026-04-15']];
for (const [id,date] of visits) player = s.addSeasonVisit(player, 'p', { id, date, photo:`season-${id}.jpg`, note:'<script>hello</script>' });
assert.equal(player.memories[0], memory);
assert.equal(player.memories[0].xp, 99);
assert.equal(player.rewards, initialRewards);
const place = player.seasonalPlaces[0];
assert.equal(place.visits.length, 7);
assert.equal(place.visits[0].id, 'one', 'reference is first saved photo, not earliest imported date');
const year = s.yearSummary(place, 2026);
assert.equal(Object.keys(year).length, 4);
assert.equal(year.spring.id, 'six', 'latest saved photo breaks same-day ties');
assert.equal(Object.keys(s.yearSummary(place, 2025)).length, 1);
assert(!Object.keys(s.yearSummary(place, 2027)).length);
assert.equal(s.addSeasonVisit(player,'p',place.visits[0]),player,'duplicate visit does not duplicate photos');
assert.throws(()=>s.addSeasonVisit(player,'missing',place.visits[0]));
assert.throws(()=>s.addSeasonVisit(player,'p',{id:'bad',date:'2026-02-30',photo:'season-bad.jpg',note:''}));
assert.throws(()=>s.addSeasonVisit(player,'p',{id:'bad',date:'2026-02-20',photo:'../photo.jpg',note:''}));
const restored = restoreFamily(JSON.parse(JSON.stringify({version:2,language:'sv',activeId:'p1',players:[player]})));
assert.equal(restored.players[0].seasonalPlaces[0].visits.length,7);
assert.equal(restored.players[0].memories[0].xp,99);
const legacy = restoreFamily({version:1,language:'en',profile:player.profile,memories:[memory],rewards:initialRewards});
assert.deepEqual(legacy.players[0].seasonalPlaces,[]);
const invalid = {...place,visits:[...place.visits,{id:'bad',date:'bad',photo:'../private.jpg'},place.visits[0]]};
assert.equal(s.restoreSeasonalPlaces([invalid])[0].visits.length,7);
const removed = s.removeSeasonVisit(player,'p','six');
assert.equal(removed.seasonalPlaces[0].visits.length,6);
assert.equal(removed.seasonalPlaces[1],player.seasonalPlaces[1]);
assert.equal(s.removeSeasonPlace(player,'p').seasonalPlaces[0].id,'other');

let capturedHTML, deleted=[];
class MockFile {constructor(uri){this.uri=uri;}get exists(){return true;}delete(){deleted.push(this.uri);}}
class BookCancelled extends Error {}
const {generateSeasonBook}=load('src/season-book.ts',{
  'expo-file-system':{File:MockFile},'expo-print':{printToFileAsync:async({html})=>{capturedHTML=html;return{uri:'file:///temporary/book.pdf'}}},
  './family-book':{BookCancelled,inlineBookPhoto:async(uri,active)=>{if(!active())throw new BookCancelled();return 'data:image/jpeg;base64,YQ==';}},
  './family-book-html':load('src/family-book-html.ts'),'./seasons':s,'./store':{photoFile:name=>({uri:'file:///private/'+name})},'./text':load('src/text.ts')
});
(async()=>{
  const book=await generateSeasonBook(place,2026,'Child','sv',()=>true);
  assert.equal(book.visitIds.length,4);
  assert(book.visitIds.includes('six') && !book.visitIds.includes('one') && !book.visitIds.includes('old'));
  assert.equal((capturedHTML.match(/<section /g)||[]).length,5,'cover + latest photo per season');
  assert(capturedHTML.includes('besök') && capturedHTML.includes('Årstidsfoto'));
  assert(capturedHTML.includes('&lt;script&gt;') && !capturedHTML.includes('<script>'));
  assert(!/https?:\/\//.test(capturedHTML));
  await assert.rejects(generateSeasonBook(place,2027,'Child','sv',()=>true),/No visits/);
  await assert.rejects(generateSeasonBook(place,2026,'Child','sv',()=>false),BookCancelled);
  console.log('Season dates/leap years/year isolation/reference/history/XP/restore/delete and safe seasonal PDF checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
