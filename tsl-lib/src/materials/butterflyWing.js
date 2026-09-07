/**
 * BUTTERFLY WING — Morpho blue, which contains no blue pigment at all. The
 * scales carry ridges of stacked cuticle lamellae ~200 nm apart; that stack
 * interferes constructively for blue and passes everything else, so the
 * colour is STRUCTURAL and therefore angle-dependent — the wing shifts toward
 * violet as it turns, something no pigment does. The scales themselves are
 * shingled in overlapping rows like roof tiles, which is why the surface has
 * a visible grain running along the wing. Both facts are in the model: rows
 * from a stretched lattice, hue from view angle rather than position.
 *
 * @cost    see REGISTRY materials/butterflyWing
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fbm } from '../noise/fbm.js';
import { stripes } from '../pattern/stripes.js';

export const name = 'BUTTERFLY WING';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal;
  // scales are shingled in rows — stretch the lattice along the wing
  const rows = stripes(TSL, p.y.mul(1.0).add(p.x.mul(0.12)), { freq: 34, duty: 0.62, soft: 0.3 });
  const shingle = stripes(TSL, p.x.mul(1.0), { freq: 20, duty: 0.55, soft: 0.4 });
  const scale = rows.mul(0.6).add(shingle.mul(0.4));
  // structural colour: the lamellar stack tunes with ANGLE, not position
  const view = TSL.cameraPosition.sub(TSL.positionWorld).normalize();
  const incidence = view.dot(TSL.normalWorld).abs();
  const jitter = fbm(TSL, p.mul(5.5), { octaves: 2 }).mul(0.08);
  // shorter path at grazing angles -> the shift toward violet
  const tuned = incidence.oneMinus().mul(0.42).add(jitter).add(0.30);
  const structural = cosinePalette(TSL, tuned, {
    a: [0.22, 0.32, 0.55], b: [0.22, 0.30, 0.42], c: [1, 1, 1], d: [0.55, 0.42, 0.18],
  });
  // the dark venation the iridescence sits between
  const vein = TSL.smoothstep(0.55, 0.78, fbm(TSL, p.mul(TSL.vec3(1.2, 3.4, 1.2)), { octaves: 3 }).abs().mul(2.2));
  mat.colorNode = brand.void.mul(0.75)
    .add(structural.mul(TSL.mix(0.45, 1.0, scale)).mul(1.5))
    .add(brand.ice.mul(scale.mul(incidence.oneMinus().pow(4)).mul(0.55)))
    .sub(brand.void.mul(vein.mul(0.85)));
  return { impl: 'native' };
};

export const source = () => `// Morpho blue has NO blue pigment: a stack of
// cuticle lamellae ~200nm apart interferes for blue
// and passes the rest, so hue follows ANGLE
const incidence = view.dot(normalWorld).abs();
const tuned = incidence.oneMinus().mul(.42)
  .add(jitter).add(.3);   // grazing -> violet
const structural = cosinePalette(tuned,
  { a: [.22, .32, .55], d: [.55, .42, .18] });
// scales are shingled in rows, like roof tiles
const scale = rows.mul(.6).add(shingle.mul(.4));
colorNode = void.mul(.75)
  .add(structural.mul(mix(.45, 1, scale)).mul(1.5));`;
