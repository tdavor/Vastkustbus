const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exportsObject = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/hold-to-confirm.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(exportsObject);
let now = 0, complete = 0, progress = 0, serial = 0;
const tasks = new Map();
const hold = exportsObject.createHold(() => complete++, value => progress = value, () => now,
  callback => { tasks.set(++serial, callback); return serial; }, id => tasks.delete(id));
function advance(ms) { now += ms; const pending = [...tasks.values()]; tasks.clear(); pending.forEach(callback => callback()); }
hold.begin(); advance(2999); assert.equal(complete, 0); assert.ok(progress < 1);
hold.cancel(); advance(5000); assert.equal(complete, 0); assert.equal(progress, 0);
hold.begin(); advance(1500); hold.cancel(); hold.begin(); advance(1500); assert.equal(complete, 0);
advance(1499); assert.equal(complete, 0); advance(1); assert.equal(complete, 1); assert.equal(progress, 1);
advance(5000); assert.equal(complete, 1); hold.cancel(); assert.equal(progress, 0);
hold.begin(); advance(1000); hold.cancel(); advance(3000); assert.equal(complete, 1); assert.equal(tasks.size, 0);
console.log('Reset hold checks passed: 3-second boundary, release/background cancellation, no accumulated presses, one callback and timer cleanup.');
