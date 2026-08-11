/**
 * PLASMA GLOBE — angular streaks give the filaments their radial anchor,
 * ridged fbm breaks them into branches, and flash's waxing envelope fires
 * the occasional bright strike. The filaments thin toward the poles because
 * the discharge prefers the shortest path to the glass.
 *
 * @cost    see REGISTRY materials/plasmaGlobe
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { streaks } from '../pattern/streaks.js';
import { flash } from '../pattern/flicker.js';
import { ridgedFbm } from '../noise/ridgedFbm.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'PLASMA GLOBE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand, solar } = palette(TSL);
  const dir = TSL.positionLocal.normalize();
  const fil = streaks(TSL, TSL.atan(dir.z, dir.x), {
    lobes: 7, sharpness: 6, floor: 0.05, drift: clock.mul(0.25),
  });
  const branch = ridgedFbm(TSL, dir.mul(3.2).add(TSL.vec3(0, clock.mul(0.1), 0)), { octaves: 3 });
  const arc = fil.mul(branch.pow(2.4))
    .mul(TSL.smoothstep(-0.2, 0.9, dir.y.abs().oneMinus()));
  const strike = flash(TSL, clock, { rate: 2.2, sharpness: 10, floor: 0.35 });
  mat.colorNode = brand.void.mul(0.55)
    .add(brand.blue.mul(arc.mul(1.3)))
    .add(brand.cyan.mul(arc.pow(2).mul(1.8)))
    .add(solar.cmeCore.mul(arc.pow(4).mul(strike).mul(2.2)))
    .add(brand.cyan.mul(fresnel(TSL, { power: 5 }).mul(0.35)));
  return { impl: 'native' };
};

export const source = () => `const fil = streaks(atan(dir.z, dir.x),
  { lobes: 7, drift: clock.mul(.25) });
const branch = ridgedFbm(dir.mul(3.2)
  .add(vec3(0, clock.mul(.1), 0)));
const arc = fil.mul(branch.pow(2.4))
  .mul(smoothstep(-.2, .9,      // thins at the poles
    dir.y.abs().oneMinus()));
colorNode = void.mul(.55)
  .add(blue.mul(arc.mul(1.3)))
  .add(cyan.mul(arc.pow(2).mul(1.8)))
  .add(cmeCore.mul(arc.pow(4)
    .mul(flash(clock)).mul(2.2)));`;
