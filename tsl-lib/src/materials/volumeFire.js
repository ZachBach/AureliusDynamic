/**
 * VOLUME FIRE — the shading half of three.js PR #33848's volumetric fire,
 * re-expressed as a surface material.
 *
 * What did not come across, and why: upstream is a voxel fluid solver —
 * compute kernels doing semi-Lagrangian advection, Jacobi pressure
 * projection and dye transport into a 3D texture, then a VolumeNodeMaterial
 * raymarching it. None of that fits a library node, which owns no passes, no
 * storage textures and no state between frames. So the field here is
 * procedural rather than simulated: the flame rises because the sample point
 * is dragged down through it, not because buoyancy solved for it.
 *
 * What did come across is the part that decides what fire LOOKS like, and it
 * is all upstream's:
 *   • curl-noise turbulence warping the sample domain — the example's detail
 *     term, divergence-free so the wisps curl instead of smearing;
 *   • a three-point emissive ramp keyed by temperature through smoothstep
 *     (upstream #ffe68c → #ff7305 → #ff0000; here the palette's solar set,
 *     since node code never writes a hex);
 *   • Stefan–Boltzmann T⁴ scaling on that ramp, which is what keeps the
 *     core blinding while the skirts stay dim — a linear ramp reads as
 *     orange paint;
 *   • Beer's-law extinction with the powder term for the smoke above.
 *
 * @cost    see REGISTRY materials/volumeFire
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { simplex3D } from '../noise/simplex3D.js';
import { curlSimplex } from '../noise/curlSimplex.js';

export const name = 'VOLUME FIRE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, solar } = palette(TSL);

  // drag the domain down and the flame rises through it
  const q = TSL.positionLocal.mul(1.9).sub(TSL.vec3(0, clock.mul(0.55), 0));

  // the example's turbulence: warp the sample point by a divergence-free field
  const flow = curlSimplex(TSL, q.mul(0.6), { eps: 0.14 });
  const warped = q.add(flow.mul(0.45));

  // two octaves of fuel density, normalized to ≈[0,1]
  const fuel = simplex3D(TSL, warped).mul(0.62)
    .add(simplex3D(TSL, warped.mul(2.1)).mul(0.31)).mul(0.5).add(0.5);

  // fuel runs out with height; what is left of it is the temperature
  const height = TSL.positionLocal.y.mul(0.5).add(0.5);
  const column = TSL.smoothstep(0.18, 0.96, height).oneMinus();
  const T = fuel.mul(column).sub(0.17).max(0).mul(1.5).clamp(0, 1);

  // three-point ramp by temperature — red base, orange body, pale core
  const toBody = TSL.smoothstep(0.30, 0.62, T);
  const toCore = TSL.smoothstep(0.62, 0.92, T);
  const hue = TSL.mix(TSL.mix(solar.ember, solar.limb, toBody), solar.hot, toCore);
  // Stefan–Boltzmann: radiant power goes as T⁴, not as T
  const t2 = T.mul(T);
  const emissive = hue.mul(t2.mul(t2).mul(3.4));

  // the cold remainder is smoke: exp(−τ) transmittance, powder on the dense side
  const tau = fuel.mul(column.oneMinus().mul(1.6).add(0.4)).mul(2.6);
  const transmit = TSL.exp(tau.negate());
  const powder = transmit.oneMinus();
  const smoke = brand.slate.mul(powder.mul(0.95))
    .add(brand.mist.mul(transmit.mul(powder).mul(0.45)));

  mat.colorNode = brand.void.mul(0.55)
    .add(smoke.mul(T.oneMinus()))
    .add(emissive);
  return { impl: 'native' };
};

export const source = () => `const flow = curlSimplex(q.mul(.6), { eps: .14 });
const fuel = simplex3D(q.add(flow.mul(.45)));  // + octave
const T = fuel.mul(column).sub(.17).max(0).mul(1.5);
const hue = mix(mix(ember, limb,
  smoothstep(.30, .62, T)), hot, smoothstep(.62, .92, T));
const emissive = hue.mul(T.pow(4).mul(3.4)); // Stefan-Boltzmann:
// T⁴, not T — a linear ramp reads as orange paint
const transmit = exp(tau.negate());          // Beer's law
colorNode = void.mul(.55)
  .add(smoke.mul(T.oneMinus())).add(emissive);`;
