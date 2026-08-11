/**
 * CRT SCREEN — the shadow mask done properly: phosphor triads striping across
 * x at a much higher frequency than the scanlines running down y. Both are
 * multiplicative over the signal, never added, so the mask darkens the tube
 * rather than glowing on top of it.
 *
 * @cost    see REGISTRY materials/crtScreen
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { scanlines } from '../pattern/scanlines.js';
import { stripes } from '../pattern/stripes.js';
import { flicker } from '../pattern/flicker.js';
import { vignette } from '../pattern/vignette.js';

export const name = 'CRT SCREEN';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const uv = TSL.uv();
  const triad = stripes(TSL, uv.x, { freq: 160, duty: 0.34, soft: 0.12 });
  const lines = scanlines(TSL, uv.y, { freq: 300, sharpness: 1, clock, speed: 0.4 });
  const signal = fbm(TSL, TSL.vec3(uv.x.mul(3), uv.y.mul(3), clock.mul(0.4)), { octaves: 3 })
    .mul(0.5).add(0.5);
  mat.colorNode = brand.void.mul(0.5)
    .add(brand.cyan.mul(signal.mul(0.9)))
    .add(brand.ice.mul(TSL.smoothstep(0.72, 0.95, signal).mul(0.6)))
    .mul(triad.mul(0.45).add(0.62))
    .mul(lines.mul(0.35).add(0.72))
    .mul(flicker(TSL, clock, { rate: 2.3, depth: 0.1 }))
    .mul(vignette(TSL, uv.sub(0.5).mul(2), { inner: 0.35, outer: 1.15 }));
  return { impl: 'native' };
};

export const source = () => `const triad = stripes(uv().x,
  { freq: 160, duty: .34 });   // phosphor mask
const lines = scanlines(uv().y,
  { freq: 300, clock });
const signal = fbm(vec3(uv().mul(3), clock.mul(.4)))
  .mul(.5).add(.5);
colorNode = void.mul(.5)
  .add(cyan.mul(signal.mul(.9)))
  .mul(triad.mul(.45).add(.62))  // mask darkens,
  .mul(lines.mul(.35).add(.72))  //   never adds
  .mul(flicker(clock, { rate: 2.3 }))
  .mul(vignette(cuv));`;
