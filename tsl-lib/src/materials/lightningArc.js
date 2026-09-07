/**
 * LIGHTNING ARC — dielectric breakdown. The channel is not drawn as a line:
 * breakdown follows the steepest local field, which is why a bolt is a ridged
 * path with branches that die out rather than a smooth curve. Ridged fbm has
 * exactly that shape — its creases ARE the maxima of a random field — so
 * thresholding a ridge very near 1 keeps only the strongest path and leaves
 * its weaker tributaries as stubs. The two-stage glow (hot white core inside
 * a wide cool halo) is the same reason a real bolt overexposes: the channel
 * is a few centimetres across and the light around it is not.
 *
 * @cost    see REGISTRY materials/lightningArc
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { flash } from '../pattern/flicker.js';

export const name = 'LIGHTNING ARC';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const p = TSL.positionLocal.mul(TSL.vec3(2.6, 1.15, 2.6))
    .add(TSL.vec3(0, clock.mul(0.12), 0));
  const ridge = ridgedFbm(TSL, p, { octaves: 5, gain: 0.55 });
  // thin the ridge twice: the core is what survives the tighter threshold
  const halo = TSL.smoothstep(0.62, 0.97, ridge);
  const core = TSL.smoothstep(0.88, 1.0, ridge);
  // strike envelope — a bolt is a burst with a decaying tail, not a sine
  const strike = flash(TSL, clock, { rate: 0.9, sharpness: 10, envRate: 0.23, floor: 0.12 });
  const glow = halo.mul(strike);
  mat.colorNode = brand.void.mul(0.9)
    .add(brand.blue.mul(glow.mul(0.55)))
    .add(terra.bolt.mul(glow.pow(2).mul(1.6)))
    .add(brand.ice.mul(core.mul(strike).mul(2.4)));
  return { impl: 'native' };
};

export const source = () => `const ridge = ridgedFbm(p, { octaves: 5 });
// breakdown follows the steepest field: a ridge
// IS the maxima of a random field, so threshold it
const halo = smoothstep(.62, .97, ridge);
const core = smoothstep(.88, 1.0, ridge);   // tighter
const strike = flash(t, { rate: .9, sharpness: 10 });
colorNode = void.mul(.9)
  .add(blue.mul(halo.mul(strike).mul(.55)))
  .add(bolt.mul(halo.mul(strike).pow(2).mul(1.6)))
  .add(ice.mul(core.mul(strike).mul(2.4)));`;
