// PNG parity comparison for the bench: validity checks (blank/constant frame
// — the usual symptom of NaN or a dead shader) plus cross-backend pixel diff.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export const DEFAULT_TOLERANCE = {
  maxDiffPct: 0.5,     // % of pixels allowed to differ beyond pixelmatch's threshold
  pixelThreshold: 0.1, // pixelmatch perceptual per-pixel threshold (0..1)
  minContentPct: 2.0,  // % of pixels that must differ from the clear color
};

export const loadPng = (path) => PNG.sync.read(readFileSync(path));

// A frame is "valid" when it actually contains content: enough pixels differ
// from the background clear color, and the image isn't a single constant.
export function validate(png, { minContentPct = DEFAULT_TOLERANCE.minContentPct } = {}) {
  const { width, height, data } = png;
  const bg = [data[0], data[1], data[2]]; // corner pixel ≈ clear color
  let content = 0;
  const seen = new Set();
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (Math.abs(r - bg[0]) > 12 || Math.abs(g - bg[1]) > 12 || Math.abs(b - bg[2]) > 12) content++;
    if (seen.size < 8) seen.add((r >> 4) << 8 | (g >> 4) << 4 | (b >> 4));
  }
  const contentPct = (content / (width * height)) * 100;
  const ok = contentPct >= minContentPct && seen.size >= 3;
  return { ok, contentPct: +contentPct.toFixed(2), distinctColors: seen.size };
}

// Diff two same-size PNGs; optionally write the pixelmatch heat map.
export function diff(pathA, pathB, tolerance = {}, diffOutPath = null) {
  const t = { ...DEFAULT_TOLERANCE, ...tolerance };
  const a = loadPng(pathA), b = loadPng(pathB);
  if (a.width !== b.width || a.height !== b.height) {
    return { pass: false, error: `size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const va = validate(a, t), vb = validate(b, t);
  const out = diffOutPath ? new PNG({ width: a.width, height: a.height }) : null;
  const diffPixels = pixelmatch(a.data, b.data, out && out.data, a.width, a.height,
    { threshold: t.pixelThreshold });
  if (out) writeFileSync(diffOutPath, PNG.sync.write(out));
  const diffPct = +((diffPixels / (a.width * a.height)) * 100).toFixed(3);
  return {
    pass: va.ok && vb.ok && diffPct <= t.maxDiffPct,
    diffPct,
    diffPixels,
    validity: { a: va, b: vb },
    tolerance: { maxDiffPct: t.maxDiffPct, pixelThreshold: t.pixelThreshold },
  };
}
