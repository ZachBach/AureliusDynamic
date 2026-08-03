/**
 * CIRCUIT MAZE — animated Truchet traces driven by radial signal pulses:
 * a low-cost, high-contrast pattern material for surfaces that need
 * inspectable structure instead of visual noise.
 *
 * @cost    see REGISTRY materials/circuitMaze
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { truchet } from '../pattern/truchet.js';
import { radialPulse } from '../pattern/radialPulse.js';

export const name = 'CIRCUIT MAZE';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const p = TSL.positionLocal;
  const traces = truchet(TSL, p.xy.add(TSL.vec2(0, clock.mul(0.035))), {
    cells: 7, thickness: 0.032, soft: 0.014,
  });
  const signal = radialPulse(TSL, p, { freq: 11, speed: 4.5, sharpness: 2.5, clock });
  const rim = fresnel(TSL, { power: 2.6 });
  const liveTrace = traces.mul(signal.mul(0.75).add(0.25));
  mat.colorNode = brand.blue.mul(traces.mul(0.55))
    .add(brand.cyan.mul(liveTrace.mul(1.45)))
    .add(brand.gold.mul(liveTrace.mul(signal).mul(0.55)))
    .add(brand.ice.mul(rim.mul(0.55)));
  mat.opacityNode = traces.mul(0.6).add(rim.mul(0.35)).add(liveTrace.mul(0.15));
  return { impl: 'native' };
};

export const source = () => `const traces = truchet(posL.xy.add(drift), {
  cells: 7, thickness: .032 });
const signal = radialPulse(posL, {
  freq: 11, speed: 4.5, clock: t });
const liveTrace = traces.mul(signal.mul(.75).add(.25));
colorNode = blue.mul(traces.mul(.55))
  .add(cyan.mul(liveTrace.mul(1.45)))
  .add(gold.mul(liveTrace.mul(signal).mul(.55)));
opacityNode = traces.mul(.6)
  .add(fresnel({ power: 2.6 }).mul(.35));`;
