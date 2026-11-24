const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const crypto = require('node:crypto');
const configure = require('../app.config.js');
process.env.EXPO_PUBLIC_DISTRIBUTION = 'play';
const play = configure();
assert.equal(play.android.package, 'se.minnetrail.app');
for (const permission of ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','ACCESS_BACKGROUND_LOCATION','REQUEST_INSTALL_PACKAGES']) {
  assert(!play.android.permissions.includes(permission));
  assert(play.android.blockedPermissions.includes('android.permission.' + permission));
}
assert(!play.plugins.some(p => (Array.isArray(p) ? p[0] : p) === 'expo-location'));
process.env.EXPO_PUBLIC_DISTRIBUTION = 'github';
assert(configure().android.permissions.includes('REQUEST_INSTALL_PACKAGES'));
assert(configure().android.permissions.includes('ACCESS_FINE_LOCATION'));
delete process.env.EXPO_PUBLIC_DISTRIBUTION;
function moduleLoad(file, mocks) {
  const e = {};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('exports','require','fetch',code)(e,name=>{
    if (name in mocks) return mocks[name];
    throw Error('Unexpected import ' + name);
  },()=>{throw Error('A Play build must not request a GitHub update');});
  return e;
}
const pin = moduleLoad('src/parent-pin.ts',{});
assert(pin.validPIN('172903')); assert(!pin.validPIN('12345')); assert(!pin.validPIN('1234567')); assert(!pin.validPIN('ABC123'));
assert.throws(()=>pin.restorePIN('{"salt":"x","hash":"x"}'));
assert(pin.matchesPIN('a'.repeat(64),'a'.repeat(64))); assert(!pin.matchesPIN('a'.repeat(64),'b'.repeat(64)));
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(playBuild, initialRecord) {
  let cursor=0, slots=[], pendingEffects=[], tree, failSave=false, delayedHash;
  let storage=initialRecord, reads=0, writes=0, listener, player='p1';
  const react={
    createContext:()=>({Provider:'Provider'}),
    useContext:()=>tree.props.value,
    useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}];},
    useRef:initial=>{const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useCallback:(callback,deps)=>{const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i].deps[j]))slots[i]={deps,value:callback};return slots[i].value;},
    useEffect:(callback,deps)=>{const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i].deps[j]))pendingEffects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:callback()};});},
  };
  const state={currentState:'active',addEventListener:(_,callback)=>{listener=callback;return{remove:()=>{listener=undefined}}}};
  const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const copy=new Proxy({}, {get:(_,key)=>String(key)});
  const mod=moduleLoad('src/parent-gate.tsx',{
    'react':react,'react/jsx-runtime':jsx,
    '@react-native-async-storage/async-storage':{default:{getItem:async()=>{reads++;return storage},setItem:async(_,value)=>{if(failSave)throw Error('disk full');storage=value;writes++;}}},
    'expo-crypto':{CryptoDigestAlgorithm:{SHA256:'SHA256'},randomUUID:()=>crypto.randomUUID(),digestStringAsync:async(_,value)=>{if(delayedHash)await delayedHash;return crypto.createHash('sha256').update(value).digest('hex');}},
    'react-native':{AppState:state,Modal:'Modal',Text:'Text',TextInput:'TextInput',View:'View'},
    './distribution':{isPlayBuild:playBuild},'./parent-pin':pin,'./store':{useJournal:()=>({journal:{language:'sv'},activePlayerId:player})},
    './text':{copy:{sv:copy}},'./ui':{Button:'Button',Page:'Page',Text:'Text',colors:{},styles:{}}
  });
  function render(){cursor=0;tree=mod.ParentGateProvider({children:'APP'});const effects=pendingEffects;pendingEffects=[];effects.forEach(f=>f());return tree;}
  function nodes(node=tree,result=[]){if(node&&typeof node==='object'){result.push(node);const children=node.props?.children;for(const child of Array.isArray(children)?children:[children])if(child!==undefined)nodes(child,result);}return result;}
  async function input(value){nodes().find(x=>x.type==='TextInput').props.onChangeText(value);render();}
  async function submit(){const buttons=nodes().filter(x=>x.type==='Button');buttons[0].props.onPress();await flush();render();}
  async function start(){render();await flush();render();}
  return{render,start,input,submit,nodes,api:()=>tree.props.value,record:()=>storage,reads:()=>reads,writes:()=>writes,
    modal:()=>nodes().find(x=>x.type==='Modal').props,
    background:()=>{state.currentState='background';listener?.('background');render();},
    foreground:()=>{state.currentState='active';listener?.('active');render();},
    setFail:value=>failSave=value,
    deferHash:promise=>delayedHash=promise,
    player:value=>{player=value;render();},
    cleanup:()=>{for(const slot of slots)slot?.cleanup?.();},
  };
}
(async()=>{
  const h=harness(true,null);await h.start();assert(h.modal().visible);assert.equal(await h.api().authorize('sharing'),false);
  await h.input('172903');await h.submit();assert.equal(h.record(),null);
  await h.input('172903');h.setFail(true);await h.submit();assert.equal(h.record(),null);assert(h.modal().visible);
  h.setFail(false);await h.submit();assert(h.record());assert(!h.record().includes('172903'));assert(!h.modal().visible);assert.equal(h.writes(),1);
  let answer;let request=h.api().authorize('sharing').then(v=>answer=v);h.render();
  assert(h.modal().visible);await h.input('000000');await h.submit();assert.equal(answer,undefined);
  h.modal().onRequestClose();h.render();await request;assert.equal(answer,false);
  request=h.api().authorize('sharing');h.render();await h.input('172903');await h.submit();assert.equal(await request,true);assert(!h.modal().visible);
  request=h.api().authorize('external');h.render();assert(h.modal().visible,'one successful PIN cannot authorize a second action');
  h.background();assert.equal(await request,false);h.foreground();
  request=h.api().authorize('sharing');h.render();let resolveHash;h.deferHash(new Promise(r=>resolveHash=r));await h.input('172903');
  const submitting=h.submit();h.background();resolveHash();await submitting;assert.equal(await request,false,'late crypto must not authorize after background');h.deferHash(undefined);h.foreground();
  request=h.api().authorize('sharing');h.render();h.player('p2');assert.equal(await request,false);
  request=h.api().authorize('sharing');h.render();h.cleanup();assert.equal(await request,false);
  const originalNow=Date.now;let now=originalNow();Date.now=()=>now;
  try {
    const limited=harness(true,h.record());await limited.start();
    for(let i=0;i<5;i++){const denied=limited.api().authorize('sharing');limited.render();await limited.input('000000');await limited.submit();limited.modal().onRequestClose();limited.render();assert.equal(await denied,false);}
    const attempt=limited.api().authorize('sharing');limited.render();await limited.input('172903');await limited.submit();assert(limited.modal().visible,'correct PIN must still respect the temporary lockout');
    now+=60001;await limited.submit();assert.equal(await attempt,true);limited.cleanup();
  } finally {Date.now=originalNow;}
  const github=harness(false,null);await github.start();assert.equal(github.reads(),0);assert.equal(await github.api().authorize('sharing'),true);assert(!github.modal().visible);
  const corrupt=harness(true,'bad JSON');await corrupt.start();assert.equal(await corrupt.api().authorize('external'),false);assert(corrupt.nodes().some(n=>n.type==='Button'&&n.props.title==='retry'));
  console.log('Play config and parent gate checks passed: permission exclusion, existing APK mode, PIN confirmation/hash storage, write failure, wrong PIN/cancel, one action per PIN, background/profile/unmount cancellation and corrupt storage fail-closed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
