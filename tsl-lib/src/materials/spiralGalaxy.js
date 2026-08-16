/**
 * SPIRAL GALAXY — the arms are drawn as a logarithmic spiral in the angle,
 * θ·arms − ln(r)·pitch, and the whole pattern is advanced by a single rigid
 * clock term. That is the density-wave model and it is the reason the shape
 * survives: if the arms were made of fixed stars, differential rotation would
 * wind them shut within a few orbits. Here the pattern turns and the material
 * does not, so the arms hold.
 *
 * Colour comes from `blackbody`, not from taste: the arms are compression
 * fronts full of short-lived hot stars, the bulge is old and cool.
 *
 * @cost    see REGISTRY materials/spiralGalaxy
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { blackbody } from '../ramp/blackbody.js';

export const name = 'SPIRAL GALAXY';

const ARMS = 2;
const PITCH = 3.1;

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.xy;
  const r = p.length();
  const a = TSL.atan(p.y, p.x);
  // log-spiral phase, advanced rigidly: the PATTERN rotates, not the stars
  const phase = a.mul(ARMS).sub(TSL.log(r.max(0.05)).mul(PITCH * ARMS)).add(clock.mul(0.16));
  const arm = TSL.cos(phase).mul(0.5).add(0.5).pow(2.4);
  const dust = TSL.cos(phase.add(0.7)).mul(0.5).add(0.5).pow(6); // lane trails the front
  const disc = TSL.smoothstep(1.45, 0.08, r);
  const bulge = TSL.smoothstep(0.5, 0.0, r);

  // star field: hash cells, biased to survive only inside the arms
  const g = p.mul(34);
  const cell = g.floor();
  const seed = TSL.hash(cell.add(TSL.vec2(31.7, 91.3)).dot(TSL.vec2(1.0, 57.0)));
  const star = TSL.smoothstep(0.965, 1.0, seed.add(arm.mul(0.06)))
    .mul(TSL.smoothstep(0.42, 0.0, g.fract().sub(0.5).length()));

  const T = TSL.float(4200).add(arm.mul(disc).mul(5200)).sub(bulge.mul(900));
  mat.colorNode = blackbody(TSL, T)
    .mul(arm.mul(disc).mul(0.85).add(bulge.pow(2).mul(1.25)).add(disc.mul(0.07)))
    .mul(dust.mul(-0.45).add(1))
    .add(brand.ice.mul(star.mul(disc).mul(0.9)))
    .add(brand.blue.mul(disc.mul(0.06)));
  return { impl: 'native' };
};

export const source = () => `const phase = a.mul(ARMS)
  .sub(log(r.max(.05)).mul(PITCH * ARMS))
  .add(clock.mul(.16));  // rigid pattern speed:
// the arms turn, the material doesn't — else
// differential rotation winds them shut
const arm = cos(phase).mul(.5).add(.5).pow(2.4);
const T = float(4200).add(arm.mul(disc).mul(5200))
  .sub(bulge.mul(900));  // hot arms, old bulge
colorNode = blackbody(T)
  .mul(arm.mul(disc).mul(.85)
    .add(bulge.pow(2).mul(1.25)))
  .mul(dust.mul(-.45).add(1))
  .add(ice.mul(star.mul(disc).mul(.9)));`;
