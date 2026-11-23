const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const files = new Map([['photo.jpg', 100], ['coloring-v1-simple-photo.jpg.png', 100]]);
let baseCalls = 0, detailCalls = 0, fail = false;
const file = name => ({
  uri: 'file:///private/' + name,
  get exists() { return files.has(name); },
  get size() { return files.get(name) ?? 0; },
  delete() { files.delete(name); }
});
const native = {
  async createDrawing(source, destination) {
    baseCalls++;
    await new Promise(resolve => setTimeout(resolve, 5));
    if (fail) throw Error('native conversion failed');
    files.set(destination.split('/').pop(), 200);
    return { uri: destination, width: 768, height: 1024 };
  },
  async adjustDetail(source, destination, detail) {
    detailCalls++;
    assert(source.includes('informative-style1-v1-100-'));
    assert(detail >= 0 && detail <= 100);
    files.set(destination.split('/').pop(), 150);
    return { uri: destination };
  }
};
const exports2 = {};
const code = ts.transpileModule(fs.readFileSync('src/coloring.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('exports', 'require', code)(exports2, name => {
  if (name === 'expo-modules-core') return { requireOptionalNativeModule: () => native };
  if (name === './store') return { photoFile: file };
  throw Error('Unexpected import ' + name);
});
(async () => {
  const [a, b] = await Promise.all([exports2.createColoring('photo.jpg', 50), exports2.createColoring('photo.jpg', 50)]);
  assert.equal(baseCalls, 1, 'rapid slider requests share model inference');
  assert.equal(detailCalls, 1, 'same adjusted PNG is reused');
  assert.equal(a.uri, b.uri);
  assert(!a.uri.includes('coloring-v1-simple'), 'old filter cache is not reused');
  await exports2.createColoring('photo.jpg', 100);
  assert.equal(baseCalls, 1);
  assert.equal(detailCalls, 1, 'full-detail drawing is never postprocessed');
  await exports2.createColoring('photo.jpg', 25);
  assert.equal(baseCalls, 1, 'detail changes never rerun the model');
  assert.equal(files.get('photo.jpg'), 100, 'original photo stays intact');
  exports2.discardColoring('photo.jpg', 100);
  fail = true;
  await assert.rejects(exports2.createColoring('photo.jpg', 100));
  fail = false;
  await exports2.createColoring('photo.jpg', 100);
  assert.equal(baseCalls, 3, 'failed in-flight entry does not block retry');
  files.delete('photo.jpg');
  await assert.rejects(exports2.createColoring('photo.jpg', 50), /Memory no longer exists/);
  assert.equal(exports2.normalizeDetail(-10), 0);
  assert.equal(exports2.normalizeDetail(112), 100);
  assert.equal(exports2.normalizeDetail(52), 50);
  console.log('Coloring cache/concurrency/retry/reset/source-preservation checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
