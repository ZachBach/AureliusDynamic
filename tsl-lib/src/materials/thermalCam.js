/**
 * THERMAL CAM — an fbm heat field remapped onto a real Planckian range and
 * pushed through blackbody, so the false-colour is physically the colour that
 * temperature would actually glow. A fast scanline gives it the readout.
 *
 * @cost    see REGISTRY materials/thermalCam
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { blackbody } from '../ramp/blackbody.js';
import { remap } from '../ramp/remap.js';
import { scanlines } from '../pattern/scanlines.js';

export const name = 'THERMAL CAM';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const heat = fbm(TSL, TSL.positionLocal.mul(2.0).add(TSL.vec3(0, 0, clock.mul(0.05))), { octaves: 4 })
    .mul(0.5).add(0.5);
  const kelvin = remap(TSL, heat, 0, 1, 2200, 11000);
  const readout = scanlines(TSL, TSL.uv().y, { freq: 220, sharpness: 1, clock, speed: 0.6 });
  mat.colorNode = blackbody(TSL, kelvin)
    .mul(readout.mul(0.12).add(0.9))
    .add(brand.void.mul(0.1));
  return { impl: 'native' };
};

export const source = () => `const heat = fbm(posL.mul(2)
  .add(vec3(0, 0, clock.mul(.05))))
  .mul(.5).add(.5);
const K = remap(heat, 0, 1, 2200, 11000);
colorNode = blackbody(K)         // real Planckian locus
  .mul(scanlines(uv().y, { freq: 220, clock })
    .mul(.12).add(.9))
  .add(void.mul(.1));`;
