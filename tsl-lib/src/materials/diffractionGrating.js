/**
 * DIFFRACTION GRATING — the rainbow off a CD, which is not pigment. A surface
 * ruled with grooves spaced near a wavelength sends each color off at its own
 * angle: mλ = d·(sinθi + sinθr). Hue is therefore a function of GEOMETRY, so
 * the spectrum sweeps as the eye moves and repeats at every integer order m.
 * Projecting the view vector onto the groove frame recovers that angle term,
 * and cycling a palette by it gives the order-on-order rainbow for free —
 * the repeat is the integer m, not a tiling artifact.
 *
 * @cost    see REGISTRY materials/diffractionGrating
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { surfaceTangent } from '../fresnel/anisoSheen.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { stripes } from '../pattern/stripes.js';

export const name = 'DIFFRACTION GRATING';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const { u, v } = surfaceTangent(TSL, { axis: [0, 1, 0] });
  const view = TSL.cameraPosition.sub(TSL.positionWorld).normalize();
  // the grating equation's angle term — how far the view leans across the rulings
  const order = view.dot(v).mul(4.5).add(view.dot(u).mul(0.8));
  const spectrum = cosinePalette(TSL, order, {
    a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 1], d: [0.0, 0.33, 0.67],
  });
  // the rulings themselves: far finer than the spectrum they produce
  const ruling = stripes(TSL, TSL.positionLocal.dot(v), { freq: 90, duty: 0.5, soft: 0.16 });
  const fres = fresnel(TSL, { power: 2 });
  mat.colorNode = brand.void.mul(0.55)
    .add(spectrum.mul(TSL.mix(0.5, 1.0, ruling)).mul(0.95))
    .add(brand.ice.mul(fres.pow(3).mul(0.35)));
  return { impl: 'native' };
};

export const source = () => `const { u, v } = surfaceTangent();
const view = cameraPosition.sub(posW).normalize();
// mλ = d(sinθi + sinθr) — hue IS geometry
const order = view.dot(v).mul(4.5)
  .add(view.dot(u).mul(.8));
const spectrum = cosinePalette(order,
  { d: [0, .33, .67] });   // repeats at each order m
const ruling = stripes(posL.dot(v), { freq: 90 });
colorNode = void.mul(.55)
  .add(spectrum.mul(mix(.5, 1, ruling)))
  .add(ice.mul(fres.pow(3).mul(.35)));`;
