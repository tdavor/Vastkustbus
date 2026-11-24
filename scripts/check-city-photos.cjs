const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const e={};cache.set(file,e);new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(e,n=>{if(n.startsWith('.'))return load(path.resolve(path.dirname(file),n+'.ts'));throw Error(n);});return e;}
const {appendCityPhoto,persistCityPhoto}=load('src/city-photo.ts');
const {initialRewards,totalXP}=load('src/rewards.ts');
const {restoreFamily,visitLandmark,editMemory}=load('src/journal.ts');
const {landmarkXP}=load('src/landmarks.ts');
const {memoryTitle,memoryCity}=load('src/memory-labels.ts');
const {guideCopy}=load('src/city-copy.ts');
const original={id:'old-photo',missionId:1,xp:42,date:'2026-11-24T10:00:00Z',photo:'original.jpg'};
const player={id:'p1',profile:{name:'Alex',avatar:'fox'},memories:[original],rewards:initialRewards};
const second={...player,id:'p2',memories:[]};
const draft={id:'one',date:'2026-11-24T12:00:00Z',photo:'city-one.jpg'};
const first=appendCityPhoto(player,'stockholm-slottet',draft);
assert.equal(first.memories.length,2);assert.equal(first.memories[1],original);
assert.equal(first.memories[0].xp,0);assert.equal(totalXP(first.memories)+landmarkXP(first.visitedLandmarks),92);
assert.equal(memoryTitle(first.memories[0],'en'),'The Royal Palace');assert.equal(memoryTitle(first.memories[0],'sv'),'Kungliga slottet');
assert.equal(memoryCity(first.memories[0],'en'),'Stockholm');
assert.equal(appendCityPhoto(first,'stockholm-slottet',draft),first,'retry is idempotent');
const again=appendCityPhoto(first,'stockholm-slottet',{...draft,id:'two',photo:'city-two.png'});
assert.equal(again.memories.length,3);assert.equal(landmarkXP(again.visitedLandmarks),50);
const checked=visitLandmark(player,'poseidon');const afterCheckIn=appendCityPhoto(checked,'poseidon',draft);
assert.equal(landmarkXP(afterCheckIn.visitedLandmarks),50,'photo after check-in never doubles XP');
assert.throws(()=>appendCityPhoto(player,'missing',draft));assert.throws(()=>appendCityPhoto(player,'poseidon',{...draft,photo:'../file.jpg'}));
assert.throws(()=>appendCityPhoto(first,'poseidon',draft),'duplicate ID cannot be reassigned');
const withStory=editMemory(again,'one',{story:'Our palace visit',coloredPhoto:'artwork-one.jpg'});
const restored=restoreFamily(JSON.parse(JSON.stringify({version:2,language:'en',activeId:'p1',players:[withStory,second]})));
assert.equal(restored.players[0].memories[1].landmarkId,'stockholm-slottet');assert.equal(restored.players[0].memories[1].story,'Our palace visit');
assert.equal(restored.players[0].memories[1].coloredPhoto,'artwork-one.jpg');assert.equal(landmarkXP(restored.players[0].visitedLandmarks),50);
assert.equal(restored.players[1].memories.length,0);

(async()=>{
 let state={version:2,language:'en',activeId:'p1',players:[player,second]},copied=0,removed=0;
 const options={playerId:'p1',landmarkId:'poseidon',draft,update:async change=>{state=change(state)},copyPhoto:()=>copied++,removePhoto:()=>removed++};
 assert.equal((await persistCityPhoto(options)).earned,50);assert.equal(copied,1);assert.equal(state.players[1],second);
 assert.equal((await persistCityPhoto(options)).earned,0);assert.equal(copied,1);
 const before=state;
 await assert.rejects(persistCityPhoto({...options,draft:{...draft,id:'failed',photo:'city-failed.jpg'},update:async change=>{change(state);throw Error('disk full')}}),/disk full/);
 assert.equal(state,before);assert.equal(removed,1,'remove copied file if journal persistence fails');
 await assert.rejects(persistCityPhoto({...options,draft:{...draft,id:'copy-failed'},copyPhoto:()=>{throw Error('copy failed')}}),/copy failed/);
 assert.equal(state,before);assert.equal(removed,1);
 state={...state,activeId:'p2'};const count=copied;
 await assert.rejects(persistCityPhoto({...options,draft:{...draft,id:'wrong-child'}}),/Player changed/);assert.equal(copied,count);

 // Exercise real camera/picker/save screen handlers with hook and native host mocks.
 let slots=[],cursor=0,aliveEffects=[],uuid=0,cameraCalls=0,libraryCalls=0,saves=0,route;
 let permission={granted:true,canAskAgain:true},camera=async()=>({canceled:true}),library=async()=>({canceled:true});
 let currentPlayer='p1',language='en';
 let family={version:2,language:'en',activeId:'p1',players:[player,second]};
 const native={Text:'Text',Image:'Image',Alert:{alert(){}},Linking:{openSettings:async()=>{}},BackHandler:{addEventListener:()=>({remove(){}})}};
 const hooks={
  useRef:v=>{const n=cursor++;return slots[n]??(slots[n]={current:v})},
  useState:v=>{const n=cursor++;if(!(n in slots))slots[n]=typeof v==='function'?v():v;return[slots[n],next=>{slots[n]=typeof next==='function'?next(slots[n]):next}]},
  useEffect:(fn,deps)=>{const n=cursor++;if(!(n in slots)){slots[n]=deps;aliveEffects.push(fn())}},
 };
 const mocks={
  'expo-crypto':{randomUUID:()=>String(++uuid)},
  'expo-image-picker':{requestCameraPermissionsAsync:async()=>permission,launchCameraAsync:async()=>{cameraCalls++;return camera()},launchImageLibraryAsync:async()=>{libraryCalls++;return library()}},
  'expo-router':{router:{back(){},replace:p=>route=p},useLocalSearchParams:()=>({id:'stockholm-slottet'})},
  react:hooks,'react-native':native,
  '../../src/store':{useJournal:()=>({journal:{language,profile:player.profile},activePlayerId:currentPlayer,saveCityPhoto:async(owner,id,uri,d)=>{saves++;return persistCityPhoto({playerId:owner,landmarkId:id,draft:d,update:async change=>{family=change({...family,activeId:currentPlayer})},copyPhoto:()=>{},removePhoto:()=>{}})}})},
  '../../src/ui':{Button:'Button',Page:'Page',styles:{}},
  'react/jsx-runtime':{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'Fragment'},
 };
 const screen={};const file=path.resolve('app/landmark-photo/[id].tsx');
 new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(screen,n=>{if(n in mocks)return mocks[n];if(n.startsWith('.'))return load(path.resolve(path.dirname(file),n+'.ts'));throw Error(n)});
 function render(){cursor=0;return screen.default()}
 function nodes(node){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(nodes);return[node,...nodes(node.props?.children)]}
 function button(title){const b=nodes(render()).find(n=>n.type==='Button'&&n.props.title===title);assert(b,'Missing button: '+title);return b.props}
 async function flush(){await new Promise(resolve=>setImmediate(resolve))}
 async function press(title){button(title).onPress();await flush()}
 function text(){return nodes(render()).map(n=>n.props?.children).filter(v=>typeof v==='string').join(' ')}
 function reset(){slots=[];cursor=0;aliveEffects=[];currentPlayer='p1';permission={granted:true,canAskAgain:true};}
 reset();permission={granted:false,canAskAgain:true};await press(guideCopy.en.photo);assert.equal(cameraCalls,0);assert.equal(saves,0);
 reset();await press(guideCopy.en.photo);assert(!nodes(render()).some(n=>n.type==='Image'));assert.equal(saves,0,'camera cancellation creates no album entry');
 camera=async()=>({canceled:false,assets:[{uri:'file:///camera.jpg',mimeType:'image/jpeg'}]});
 reset();await press(guideCopy.en.photo);assert(nodes(render()).some(n=>n.type==='Image'));assert.equal(saves,0,'preview does not save automatically');
 await press(guideCopy.en.photoSave);assert.equal(saves,1);assert.equal(family.players[0].memories[0].landmarkId,'stockholm-slottet');assert(text().includes(guideCopy.en.photoSaved));
 button(guideCopy.en.album).onPress();assert.equal(route,'/book');
 library=async()=>({canceled:false,assets:[{uri:'file:///chosen.png',mimeType:'image/png'}]});
 reset();language='sv';await press(guideCopy.sv.choosePhoto);assert.equal(libraryCalls,1);await press(guideCopy.sv.photoSave);assert(text().includes(guideCopy.sv.savedXP(0)));assert.equal(landmarkXP(family.players[0].visitedLandmarks),50);
 language='en';reset();let resolve;camera=()=>new Promise(r=>resolve=r);
 const pending=button(guideCopy.en.photo).onPress();await Promise.resolve();const calls=cameraCalls;
 await press(guideCopy.en.photo);assert.equal(cameraCalls,calls,'double tap opens only one camera');
 currentPlayer='p2';render();resolve({canceled:false,assets:[{uri:'file:///late.jpg'}]});await pending;await flush();
 assert(!nodes(render()).some(n=>n.type==='Image'),'late camera result cannot attach to another child');
 reset();const late=button(guideCopy.en.photo).onPress();await Promise.resolve();for(const cleanup of aliveEffects)if(typeof cleanup==='function')cleanup();resolve({canceled:false,assets:[{uri:'file:///late.jpg'}]});await late;await flush();assert(!nodes(render()).some(n=>n.type==='Image'));
 console.log('City photos passed: camera/picker, denial/cancel/preview/save, double taps, stale profile/unmount, album navigation, bilingual labels, one-time XP, persistence, rollback and existing-memory preservation.');
})().catch(e=>{console.error(e);process.exitCode=1});
