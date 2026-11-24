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
