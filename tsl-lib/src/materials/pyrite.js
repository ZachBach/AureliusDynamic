/**
 * PYRITE — fool's gold, and a lesson in crystal habit. FeS₂ is cubic, so it
 * grows interpenetrating cubes with faces on the coordinate planes; the
 * giveaway that it is not gold is exactly that geometry, since gold is soft
 * and rounds. Reading which axis the surface normal most nearly faces gives
 * the cube face, and the striations — parallel grooves that run at 90° from
 * one face to its neighbour — are the classic identification mark, so they
 * change direction with the face rather than wrapping the body.
 *
 * @cost    see REGISTRY materials/pyrite
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fbm } from '../noise/fbm.js';
import { stripes } from '../pattern/stripes.js';
import { fresnel } from '../fresnel/fresnel.js';
import { posterize } from '../ramp/posterize.js';

export const name = 'PYRITE';

export const apply = (TSL, mat) => {
  const { brand, solar } = palette(TSL);
  const n = TSL.normalLocal;
  const a = n.abs();
  // which cube face is this? the dominant axis of the normal
  const faceX = TSL.step(TSL.max(a.y, a.z), a.x);
  const faceY = TSL.step(TSL.max(a.x, a.z), a.y);
  const p = TSL.positionLocal.mul(4.5);
  // striations run at 90 degrees from one face to the next — the ID mark
  const axis = TSL.mix(TSL.mix(p.y, p.z, faceY), p.z, faceX);
  const striae = stripes(TSL, axis, { freq: 7, duty: 0.5, soft: 0.22 });
  // hard-faceted shading: a cube has flat faces, so quantise the term
  const facet = posterize(TSL, a.x.mul(0.5).add(a.y.mul(0.85)).add(a.z.mul(0.35)), { steps: 5 });
  const tarnish = fbm(TSL, TSL.positionLocal.mul(3.2), { octaves: 3 }).mul(0.5).add(0.5);
  const fres = fresnel(TSL, { power: 3 });
  // brass is gold pulled toward silver — never a hex literal
  const brass = TSL.mix(solar.mid, brand.silver, 0.28);
  mat.colorNode = brand.slate.mul(0.35)
    .add(brass.mul(facet.mul(0.95).add(0.18)))
    .add(brass.mul(striae.mul(0.22)))
    .sub(brand.slate.mul(tarnish.mul(0.3)))
    .add(brand.ice.mul(fres.pow(6).mul(0.35)));
  return { impl: 'native' };
};

export const source = () => `const a = normalLocal.abs();
// FeS2 is cubic: read which axis the normal faces
const faceX = step(max(a.y, a.z), a.x);
const faceY = step(max(a.x, a.z), a.y);
// striations turn 90deg from face to face — the
// identification mark, so they follow the FACE
const axis = mix(mix(p.y, p.z, faceY), p.z, faceX);
const striae = stripes(axis, { freq: 7 });
// a cube has flat faces, so quantise the shading
const facet = posterize(shadeTerm, { steps: 5 });
colorNode = slate.mul(.35)
  .add(mix(mid, silver, .28).mul(facet.add(.18)));`;
