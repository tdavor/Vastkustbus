const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  new Function('exports', 'require', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports, name => {
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
    throw Error('Unexpected import ' + name);
  });
  return exports;
}
const { countries, cities, cityLandmarks, cityProgress } = load('src/cities.ts');
const { landmarks, landmarkMapURL, landmarkXP, restoreLandmarkVisits } = load('src/landmarks.ts');
const { restoreFamily, visitLandmark, replacePlayer } = load('src/journal.ts');
const { initialRewards, reachedMilestones } = load('src/rewards.ts');
assert.deepEqual(countries.map(c => c.id), ['sweden']);
assert.deepEqual(cities.map(c => c.id), ['gothenburg', 'stockholm']);
const ids = new Set();
for (const city of cities) {
  assert(countries.some(country => country.id === city.countryId));
  const places = cityLandmarks(city);
  assert.equal(places.length, 4);
  assert(city.description.length > 25);
  for (const place of places) {
    assert(!ids.has(place.id), 'globally unique IDs prevent cross-city XP collisions'); ids.add(place.id);
    assert(place.fact.length > 30 && place.fact.length < 330);
    assert(place.challenge.length > 20 && place.challenge.length < 220);
    assert(place.latitude > 55 && place.latitude < 70 && place.longitude > 10 && place.longitude < 25);
    const coordinates = place.latitude + ',' + place.longitude;
    assert.equal(new URL(landmarkMapURL(place, 'android')).searchParams.get('destination'), coordinates);
    assert.equal(new URL(landmarkMapURL(place, 'ios')).searchParams.get('daddr'), coordinates);
    assert.equal(new URL(landmarkMapURL(place, 'ios')).searchParams.get('q'), place.name);
  }
}
assert.equal(ids.size, landmarks.length);
const oldIds = ['lappstiftet', 'slottsskogen', 'alvsborgsbron', 'feskekorka', 'haga-skansen', 'poseidon', 'liseberg', 'sodra-skargarden'];
const memory = { id:'m', missionId:1, xp:25, date:'2026-11-24', photo:'kept.jpg', story:'Our day' };
const oldPlayer = { id:'old', profile:{name:'Child',avatar:'fox'}, memories:[memory], rewards:initialRewards, visitedLandmarks:oldIds };
const otherPlayer = { ...oldPlayer, id:'other', visitedLandmarks:[] };
let family = restoreFamily(JSON.parse(JSON.stringify({version:2,language:'sv',activeId:'old',players:[oldPlayer,otherPlayer]})));
assert.deepEqual(family.players[0].visitedLandmarks, oldIds);
assert.equal(landmarkXP(family.players[0].visitedLandmarks), 400, 'all eight old visits retain their XP');
assert.equal(cityProgress(cities[0], oldIds), 4, 'city counter excludes retired visits');
assert.equal(cityProgress(cities[1], oldIds), 0, 'Göteborg visits never count in Stockholm');
assert.deepEqual(family.players[0].rewards.unlocked, reachedMilestones(425));
assert.equal(visitLandmark(family.players[0], 'poseidon'), family.players[0], 'no repeat XP after migration');
assert.throws(() => visitLandmark(family.players[0], 'missing'));
assert.throws(() => visitLandmark(family.players[0], 'feskekorka'), 'retired places cannot earn new XP');
for (const place of cityLandmarks(cities[1])) {
  const previous = family.players[0];
  family = replacePlayer(family, 'old', player => visitLandmark(player, place.id));
  assert.equal(landmarkXP(family.players[0].visitedLandmarks) - landmarkXP(previous.visitedLandmarks), 50);
  assert.equal(visitLandmark(family.players[0], place.id), family.players[0]);
}
assert.equal(cityProgress(cities[1], family.players[0].visitedLandmarks), 4);
assert.equal(landmarkXP(family.players[0].visitedLandmarks), 600);
assert.equal(landmarkXP(family.players[1].visitedLandmarks), 0, 'check-ins remain per child');
assert.deepEqual(family.players[0].memories, [memory], 'missions/photos/stories are untouched');
const persisted = restoreFamily(JSON.parse(JSON.stringify(family)));
assert.equal(landmarkXP(persisted.players[0].visitedLandmarks), 600);
assert.equal(cityProgress(cities[1], persisted.players[0].visitedLandmarks), 4);
assert.deepEqual(restoreLandmarkVisits(['poseidon','poseidon','stockholm-vasa','bad',null,5]), ['poseidon','stockholm-vasa']);
assert.equal(cityProgress(cities[0], null), 0);
const v1 = restoreFamily({version:1,language:'sv',profile:oldPlayer.profile,memories:[memory],visitedLandmarks:oldIds,rewards:initialRewards});
assert.equal(landmarkXP(v1.players[0].visitedLandmarks), 400, 'original single-child journals also migrate without XP loss');
console.log('City guide: country/city catalogue, map URLs, per-city counters, legacy XP, duplicate check-ins, rewards, child isolation and persistence passed.');

const { guideCopy, englishLandmarks, localizeCity, localizeCountry, localizeLandmark } = load('src/city-copy.ts');
assert.deepEqual(Object.keys(guideCopy.en).sort(), Object.keys(guideCopy.sv).sort(), 'all guide labels need both languages');
assert.deepEqual(Object.keys(englishLandmarks).sort(), landmarks.map(p => p.id).sort(), 'English descriptions cover every landmark');
for (const language of ['sv','en']) {
  for (const city of cities) {
    const translated = localizeCity(city, language);
    assert(translated.name && translated.description);
    assert.deepEqual(translated.landmarkIds, city.landmarkIds);
    for (const place of cityLandmarks(city)) {
      const translatedPlace = localizeLandmark(place, language);
      assert.equal(translatedPlace.id, place.id);
      assert.equal(translatedPlace.latitude, place.latitude);
      assert.equal(translatedPlace.longitude, place.longitude);
      assert(translatedPlace.fact.length > 30 && translatedPlace.challenge.length > 20);
    }
  }
}
assert.equal(localizeCountry(countries[0], 'en').name, 'Sweden');
assert.equal(localizeCountry(countries[0], 'sv').name, 'Sverige');
assert.equal(localizeCity(cities[0], 'en').name, 'Gothenburg');
assert.equal(localizeCity(cities[0], 'sv').name, 'Göteborg');

// Render actual guide screens with lightweight host/hook mocks: this catches
// hard-coded text in components, not just missing dictionary entries.
let language = 'en', params = {};
const uiCache = new Map();
function renderLoad(file) {
  file = path.resolve(file);
  if (uiCache.has(file)) return uiCache.get(file);
  if (file.endsWith('/src/ui.tsx')) return { Button:'Button',Page:'Page',styles:{},colors:{} };
  if (file.endsWith('/src/store.tsx')) return { useJournal:()=>({journal:{language,profile:{name:'Alex'},memories:[],visitedLandmarks:['poseidon']},activePlayerId:'child',checkInLandmark:async()=>50}) };
  if (file.endsWith('/src/parent-gate.tsx')) return { useParentalGate:()=>({authorize:async()=>true}) };
  const exports = {}; uiCache.set(file,exports);
  new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(exports,name=>{
    if(name==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'};
    if(name==='react')return {useState:value=>[value,()=>{}],useRef:value=>({current:value})};
    if(name==='react-native')return {Text:'Text',View:'View',Platform:{OS:'android'},Linking:{openURL:async()=>{}}};
    if(name==='expo-router')return {router:{back(){},push(){}},useLocalSearchParams:()=>params};
    if(name==='@expo/vector-icons/Ionicons')return {default:'Icon'};
    if(name.startsWith('.')){
      const base=path.resolve(path.dirname(file),name);
      return renderLoad(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');
    }
    throw Error('Unexpected screen import '+name);
  });
  return exports;
}
function visibleText(node) {
  if(node==null||typeof node==='boolean')return '';
  if(typeof node==='string'||typeof node==='number')return String(node);
  if(Array.isArray(node))return node.map(visibleText).join(' ');
  if(typeof node.type==='function')return visibleText(node.type(node.props));
  return [node.props?.title,visibleText(node.props?.children)].filter(Boolean).join(' ');
}
const landing=renderLoad('app/discover-city/index.tsx').default;
const country=renderLoad('app/discover-city/[countryId].tsx').default;
const cityPage=renderLoad('app/city/[id].tsx').default;
const legacyPage=renderLoad('app/discover-gothenburg.tsx').default;
for (const selected of ['en','sv','en']) {
  language=selected;
  const t=guideCopy[language];
  assert(visibleText(landing()).includes(t.title));
  assert(visibleText(landing()).includes(localizeCountry(countries[0],language).name));
  params={countryId:'sweden'};
  const countryText=visibleText(country());
  for(const city of cities)assert(countryText.includes(localizeCity(city,language).description));
  for(const city of cities){
    params={id:city.id};const text=visibleText(cityPage());
    assert(text.includes(localizeCity(city,language).description));
    assert(text.includes(t.map));assert(text.includes(t.checkIn));assert(text.includes(t.photo));
    assert(text.includes(t.progress(city.id==='gothenburg'?1:0,4)));
    for(const place of cityLandmarks(city)){
      const translated=localizeLandmark(place,language);
      assert(text.includes(translated.fact));assert(text.includes(translated.challenge));
      if(language==='en')assert(!text.includes(place.fact),'Swedish facts must not leak into the English screen');
    }
    if(city.id==='gothenburg')assert(text.includes(t.stamp)&&text.includes(t.visited));
  }
  assert(visibleText(legacyPage()).includes(localizeCity(cities[0],language).description));
  params={id:'invalid'};assert(visibleText(cityPage()).includes(t.cityMissing));
  params={countryId:'invalid'};assert(visibleText(country()).includes(t.countryMissing));
}
console.log('SV/EN guide rendering passed: landing, countries, both cities, all eight descriptions/challenges, buttons, visited stamps, progress, missing pages, legacy links and language switching.');
