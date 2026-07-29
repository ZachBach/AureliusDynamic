/**
 * DISSOLVE — noise-threshold cutout with a glowing ember edge. Library
 * rebuild of the shipped Lab material.
 *
 * @param   {object} TSL
 * @param   {object} mat
 * @param   {object} opts  { clock }
 * @cost    see REGISTRY materials/dissolve
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { fbm } from '../noise/fbm.js';
import { dissolve } from '../pattern/dissolve.js';

export const name = 'DISSOLVE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.side = 2;
  const n = fbm(TSL, TSL.positionLocal.mul(2.6), { octaves: 4 }).mul(0.5).add(0.5);
  const th = TSL.sin(clock.mul(0.9)).mul(0.5).add(0.5).mul(0.86).add(0.06);
  const { alive, edge } = dissolve(TSL, n, th, { edgeWidth: 0.1 });
  const fres = fresnel(TSL);
  mat.colorNode = TSL.mix(brand.slate, brand.mist, fres.mul(0.8))
    .add(brand.gold.mul(edge.mul(2.4)))
    .add(brand.ember.mul(edge.mul(edge).mul(1.6)));
  mat.opacityNode = alive;
  return { impl: 'native' };
};

export const source = () => `const n = fbm(posL.mul(2.6)).mul(.5).add(.5);
const th = sin(t.mul(.9)).mul(.5).add(.5)
  .mul(.86).add(.06);
const { alive, edge } = dissolve(n, th,
  { edgeWidth: .1 });
colorNode = mix(slate, mist, fresnel().mul(.8))
  .add(gold.mul(edge.mul(2.4)))
  .add(ember.mul(edge.mul(edge).mul(1.6)));
opacityNode = alive;`;
