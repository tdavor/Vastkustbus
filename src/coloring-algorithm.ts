// This code runs inside the local WebView. Keep it self-contained so the same
// pixel processor can be exercised outside Android without a second algorithm.
export const coloringAlgorithm = String.raw`
function outlinePixels(rgba, width, height, detailed) {
  const size = width * height;
  const gray = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const p = i * 4;
    gray[i] = rgba[p] * 0.299 + rgba[p + 1] * 0.587 + rgba[p + 2] * 0.114;
  }

  // Repeated separable Gaussian smoothing suppresses photographic grain.
  const temporary = new Float32Array(size);
  const kernel = [1, 4, 6, 4, 1];
  for (let pass = 0; pass < (detailed ? 1 : 3); pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = -2; k <= 2; k++) {
          value += gray[y * width + Math.max(0, Math.min(width - 1, x + k))] * kernel[k + 2];
        }
        temporary[y * width + x] = value / 16;
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = -2; k <= 2; k++) {
          value += temporary[Math.max(0, Math.min(height - 1, y + k)) * width + x] * kernel[k + 2];
        }
        gray[y * width + x] = value / 16;
      }
    }
  }

  const strength = new Float32Array(size);
  const direction = new Int32Array(size);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      const gx = -gray[p - width - 1] + gray[p - width + 1]
        - 2 * gray[p - 1] + 2 * gray[p + 1] - gray[p + width - 1] + gray[p + width + 1];
      const gy = -gray[p - width - 1] - 2 * gray[p - width] - gray[p - width + 1]
        + gray[p + width - 1] + 2 * gray[p + width] + gray[p + width + 1];
      const ax = Math.abs(gx), ay = Math.abs(gy);
      strength[p] = ax + ay;
      direction[p] = ay < ax * 0.414 ? 1 : ay > ax * 2.414 ? width : gx * gy > 0 ? width + 1 : width - 1;
    }
  }

  const edges = new Float32Array(size);
  const histogram = new Int32Array(2041);
  let candidates = 0;
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const p = y * width + x, step = direction[p], value = strength[p];
      if (value >= 15 && value >= strength[p - step] && value > strength[p + step]) {
        edges[p] = value;
        histogram[Math.min(2040, Math.round(value))]++;
        candidates++;
      }
    }
  }
  let high = detailed ? 45 : 70;
  let accumulated = 0;
  const target = candidates * (detailed ? 0.65 : 0.82);
  for (let level = 0; level < histogram.length; level++) {
    accumulated += histogram[level];
    if (accumulated >= target) { high = Math.max(high, level); break; }
  }

  // Hysteresis connects faint outlines to strong outlines, then removes specks.
  const low = high * 0.42;
  const marked = new Uint8Array(size);
  const queue = new Int32Array(size);
  let tail = 0;
  for (let p = 0; p < size; p++) {
    if (edges[p] >= high) { marked[p] = 1; queue[tail++] = p; }
  }
  const offsets = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];
  for (let head = 0; head < tail; head++) {
    const p = queue[head];
    for (const offset of offsets) {
      const neighbor = p + offset;
      if (neighbor >= 0 && neighbor < size && !marked[neighbor] && edges[neighbor] >= low) {
        marked[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }
  }
  const seen = new Uint8Array(size);
  for (let p = 0; p < size; p++) {
    if (!marked[p] || seen[p]) continue;
    let count = 1;
    queue[0] = p;
    seen[p] = 1;
    for (let head = 0; head < count; head++) {
      for (const offset of offsets) {
        const neighbor = queue[head] + offset;
        if (neighbor >= 0 && neighbor < size && marked[neighbor] && !seen[neighbor]) {
          seen[neighbor] = 1;
          queue[count++] = neighbor;
        }
      }
    }
    if (count < (detailed ? 10 : 22)) {
      for (let i = 0; i < count; i++) marked[queue[i]] = 0;
    }
  }

  // A small dilation makes the black contours comfortable to color on paper.
  const output = new Uint8ClampedArray(size * 4);
  output.fill(255);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (!marked[p]) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const index = (p + dy * width + dx) * 4;
          output[index] = output[index + 1] = output[index + 2] = 0;
        }
      }
    }
  }
  return output;
}
`;

export function coloringHTML(base64: string, detailed: boolean): string {
  const source = JSON.stringify('data:image/jpeg;base64,' + base64);
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src data:; script-src &#39;unsafe-inline&#39;">'
    + '</head><body><script>' + coloringAlgorithm
    + '\nconst photo = new Image(); photo.onerror = () => window.ReactNativeWebView.postMessage(JSON.stringify({error:true}));'
    + 'photo.onload = () => { try { const scale = Math.min(1, ' + (detailed ? 1600 : 1280) + ' / Math.max(photo.width, photo.height));'
    + 'const canvas = document.createElement("canvas"); canvas.width = Math.max(8, Math.round(photo.width * scale)); canvas.height = Math.max(8, Math.round(photo.height * scale));'
    + 'const context = canvas.getContext("2d"); context.drawImage(photo,0,0,canvas.width,canvas.height);'
    + 'const input = context.getImageData(0,0,canvas.width,canvas.height);'
    + 'const result = outlinePixels(input.data,canvas.width,canvas.height,' + detailed + ');'
    + 'context.putImageData(new ImageData(result,canvas.width,canvas.height),0,0);'
    + 'window.ReactNativeWebView.postMessage(JSON.stringify({image:canvas.toDataURL("image/png"),width:canvas.width,height:canvas.height}));'
    + '} catch(error) { window.ReactNativeWebView.postMessage(JSON.stringify({error:true})); }}; photo.src = ' + source + ';'
    + '</script></body></html>';
}
