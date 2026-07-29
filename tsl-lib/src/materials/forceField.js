/**
 * FORCE FIELD — hex lattice + fresnel shell + impact pulse rings. The
 * honeycomb whose metric bug the eyeball gate caught in Wave 2, now shipped.
 *
 * @cost    see REGISTRY materials/forceField
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { hexGrid } from '../pattern/grid.js';
import { radialPulse } from '../pattern/radialPulse.js';

export const name = 'FORCE FIELD';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const { edge, dist } = hexGrid(TSL, TSL.positionLocal.xy, { cells: 3, thickness: 0.05 });
  const pulse = radialPulse(TSL, TSL.positionLocal, { freq: 7, speed: 4, clock });
  const fres = fresnel(TSL);
  mat.colorNode = brand.cyan.mul(edge.mul(1.8))
    .add(brand.blue.mul(fres.mul(1.2)))
    .add(brand.ice.mul(pulse.mul(edge).mul(0.9)))
    .add(brand.blue.mul(TSL.smoothstep(0.5, 0.0, dist).mul(0.25)));
  mat.opacityNode = edge.mul(0.6).add(fres.mul(0.5)).add(pulse.mul(0.12));
  return { impl: 'native' };
};

export const source = () => `const { edge, dist } = hexGrid(posL.xy,
  { cells: 3 });
const pulse = radialPulse(posL,
  { freq: 7, clock: t });
colorNode = cyan.mul(edge.mul(1.8))
  .add(blue.mul(fresnel().mul(1.2)))
  .add(ice.mul(pulse.mul(edge).mul(.9)));
opacityNode = edge.mul(.6)
  .add(fresnel().mul(.5)).add(pulse.mul(.12));`;
