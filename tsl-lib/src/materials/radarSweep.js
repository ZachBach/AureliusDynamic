/**
 * RADAR SWEEP — a PPI scope. The beam is one angular position with an
 * exponential phosphor tail trailing it, built by taking the fract() of the
 * angle relative to the sweep so the decay wraps seamlessly at ±π instead of
 * tearing there.
 *
 * @cost    see REGISTRY materials/radarSweep
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { radialPulse } from '../pattern/radialPulse.js';
import { gridLines } from '../pattern/grid.js';
import { vignette } from '../pattern/vignette.js';

export const name = 'RADAR SWEEP';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const q = TSL.uv().sub(0.5).mul(2);
  const rel = TSL.atan(q.y, q.x).sub(clock.mul(0.9)).mul(1 / (Math.PI * 2)).fract();
  const beam = TSL.smoothstep(0.0, 0.35, rel).pow(6);
  const rings = radialPulse(TSL, q, { freq: 12, sharpness: 8 });
  const grat = gridLines(TSL, TSL.uv(), { cells: 8, thickness: 0.006, soft: 0.004 });
  mat.colorNode = brand.void
    .add(brand.cyan.mul(rings.mul(0.18)))
    .add(brand.cyan.mul(grat.mul(0.25)))
    .add(brand.cyan.mul(beam.mul(1.6)))
    .mul(vignette(TSL, q, { inner: 0.5, outer: 1.02 }));
  return { impl: 'native' };
};

export const source = () => `const rel = atan(q.y, q.x)
  .sub(clock.mul(.9))
  .mul(1 / TAU).fract();       // wraps at ±π cleanly
const beam = smoothstep(0, .35, rel).pow(6);
const rings = radialPulse(q,
  { freq: 12, sharpness: 8 });
colorNode = void
  .add(cyan.mul(rings.mul(.18)))
  .add(cyan.mul(gridLines(uv()).mul(.25)))
  .add(cyan.mul(beam.mul(1.6)))
  .mul(vignette(q));`;