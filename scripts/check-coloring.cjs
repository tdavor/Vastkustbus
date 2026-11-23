// Exercise the actual WebView processor, without a native device or network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  new Function('exports', 'require', js)(exports, name => {
    if (!(name in imports)) throw new Error('Unexpected import: ' + name);
    return imports[name];
  });
  return exports;
}
const algorithm = load('src/coloring-algorithm.ts');
const outline = new Function(algorithm.coloringAlgorithm + '; return outlinePixels;')();
for (const detailed of [false, true]) {
  const input = new Uint8ClampedArray(100 * 100 * 4).fill(255);
  assert(outline(input, 100, 100, detailed).every(value => value === 255));
  for (let y = 25; y < 75; y++) for (let x = 25; x < 75; x++) {
    const p = (y * 100 + x) * 4;
    input[p] = input[p + 1] = input[p + 2] = 0;
  }
  const original = input.slice();
  const output = outline(input, 100, 100, detailed);
  assert.deepEqual(input, original, 'original pixels stay intact');
  assert.equal(output[(50 * 100 + 50) * 4], 255, 'solid areas become colorable white');
  assert(output.some(value => value === 0), 'shape retains contours');
  for (let p = 0; p < output.length; p += 4) {
    assert(output[p] === 0 || output[p] === 255);
    assert.equal(output[p], output[p + 1]);
    assert.equal(output[p], output[p + 2]);
    assert.equal(output[p + 3], 255);
  }
  const html = algorithm.coloringHTML('YQ==', detailed);
  assert(html.includes('Content-Security-Policy'));
  assert(!/https?:\/\//.test(html));
  new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
}
const printing = load('src/printing.ts', { 'expo-file-system': {}, 'expo-print': {} });
const html = printing.printableImageHTML('YQ==', true);
assert(html.includes('size:A4 portrait'));
assert(html.includes('data:image/png;base64,YQ=='));
assert(printing.printableImageHTML('YQ==', false).includes('data:image/jpeg;'));
assert.throws(() => printing.printableImageHTML('\"><script>', true));
assert(!/https?:\/\//.test(html));
console.log('Coloring: blank pages, contours, source preservation, offline HTML and A4 printing passed.');
