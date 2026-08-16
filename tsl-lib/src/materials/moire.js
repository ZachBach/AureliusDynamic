/**
 * MOIRÉ — two identical rulings, one turned by a slow angle. The wide dark
 * rosettes that swim across the surface are at a frequency neither ruling
 * contains and the shader never evaluates: they are the beat between two
 * gratings, drawn entirely by the multiply. Turning the sampling rate into
 * visible structure is the same effect that makes a striped shirt shimmer on
 * camera, which is why the softness here is deliberately generous — a hard
 * step would alias the beat into noise instead of showing it.
 *
 * @cost    see REGISTRY materials/moire
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { stripes } from '../pattern/stripes.js';
import { vignette } from '../pattern/vignette.js';

export const name = 'MOIRÉ';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.xy;
  // a standing 7° offset that breathes ±3°: the beat spacing is d/(2·sin(a/2)),
  // so an angle that crosses zero would send the rosettes off to infinity
  const a = TSL.sin(clock.mul(0.07)).mul(0.05).add(0.12);
  const turned = p.x.mul(TSL.cos(a)).sub(p.y.mul(TSL.sin(a)));
  const inkA = stripes(TSL, p.x, { freq: 13, duty: 0.5, soft: 0.06 });
  const inkB = stripes(TSL, turned, { freq: 13, duty: 0.5, soft: 0.06 });
  const beat = inkA.mul(inkB); // the rosettes live here, at no drawn frequency
  mat.colorNode = TSL.mix(brand.slate.mul(0.85), brand.ice.mul(0.9), beat)
    .add(brand.cyan.mul(beat.pow(3).mul(0.3)))
    .mul(vignette(TSL, p, { inner: 0.3, outer: 1.25 }).mul(0.75).add(0.25));
  return { impl: 'native' };
};

export const source = () => `const p = posL.xy;
const a = sin(clock.mul(.07)).mul(.05).add(.12);
// beat spacing = d/(2·sin(a/2)) — an angle that
// crosses zero sends the rosettes to infinity
const turned = p.x.mul(cos(a)).sub(p.y.mul(sin(a)));
const inkA = stripes(p.x, { freq: 13, soft: .06 });
const inkB = stripes(turned, { freq: 13, soft: .06 });
const beat = inkA.mul(inkB);   // rosettes at a
// frequency neither ruling contains
colorNode = mix(slate.mul(.85), ice.mul(.9), beat)
  .add(cyan.mul(beat.pow(3).mul(.3)))
  .mul(vignette(p).mul(.75).add(.25));`;
