/**
 * CUMULUS — a cloud is not a shape, it is a density with light dying inside
 * it. One fbm gives the cauliflower; what makes it read as cloud instead of
 * fog is the second sample taken one step TOWARD the sun and attenuated
 * through exp(−τ). That is a one-step light march, and it is the entire
 * reason cumulus has a blinding top and a flat grey base — the base is simply
 * further from the sun through more of its own water.
 *
 * @cost    see REGISTRY materials/cumulus
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';

export const name = 'CUMULUS';

const SUN = [0.42, 0.82, 0.38];

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, terra } = palette(TSL);
  const drift = TSL.vec3(clock.mul(0.04), 0, clock.mul(0.02));
  const L = TSL.vec3(...SUN).normalize();
  const density = (at, octaves) =>
    fbm(TSL, at.mul(2.1).add(drift), { octaves }).mul(0.5).add(0.5);
  const body = density(TSL.positionLocal, 4);
  const shape = TSL.smoothstep(0.44, 0.86, body);
  // one step toward the sun: everything above optical depth threshold shadows
  const toward = density(TSL.positionLocal.add(L.mul(0.3)), 3);
  const tau = toward.sub(0.42).max(0).mul(5.2);
  const light = TSL.exp(tau.negate());
  mat.colorNode = brand.slate.mul(0.5)
    .add(terra.cloud.mul(shape.mul(light).mul(1.15)))
    .add(brand.mist.mul(shape.mul(light.oneMinus()).mul(0.5)))
    .add(brand.ice.mul(shape.mul(light.pow(3)).mul(0.55)))
    .add(terra.atmo.mul(shape.oneMinus().mul(0.18)));
  return { impl: 'native' };
};

export const source = () => `const body = density(posL, 4);
const shape = smoothstep(.44, .86, body);
const toward = density(posL.add(L.mul(.3)), 3);
const light = exp(toward.sub(.42).max(0)
  .mul(5.2).negate());   // one-step light march:
// exp(−τ) is why the base is grey and flat
colorNode = slate.mul(.5)
  .add(cloud.mul(shape.mul(light).mul(1.15)))
  .add(mist.mul(shape.mul(light.oneMinus()).mul(.5)))
  .add(ice.mul(shape.mul(light.pow(3)).mul(.55)));`;
