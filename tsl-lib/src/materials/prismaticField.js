/**
 * PRISMATIC FIELD — thin-film interference under a drifting Truchet lattice:
 * a glassy shell whose iridescent rim and circuit-like facets reveal the
 * same material from different viewing angles.
 *
 * @cost    see REGISTRY materials/prismaticField
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { fresnel } from '../fresnel/fresnel.js';
import { thinFilm } from '../fresnel/thinFilm.js';
import { truchet } from '../pattern/truchet.js';
import { radialPulse } from '../pattern/radialPulse.js';

export const name = 'PRISMATIC FIELD';

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  mat.transparent = true;
  mat.blending = 2;
  mat.depthWrite = false;
  mat.side = 2;
  const p = TSL.positionLocal;
  const facets = truchet(TSL, p.xy.add(TSL.vec2(clock.mul(0.06), 0)), {
    cells: 5, thickness: 0.045, soft: 0.02,
  });
  const pulse = radialPulse(TSL, p, { freq: 8, speed: 3, sharpness: 3, clock });
  const rim = fresnel(TSL, { power: 2.2 });
  const film = thinFilm(TSL, { cycles: 3.1, shift: 0.15, power: 1.4 });
  mat.colorNode = brand.void.mul(0.1)
    .add(film.mul(rim.mul(0.9).add(0.2)))
    .add(brand.ice.mul(facets.mul(pulse.mul(0.6).add(0.25))))
    .add(brand.gold.mul(facets.mul(rim).mul(0.28)));
  mat.opacityNode = rim.mul(0.65).add(facets.mul(0.35)).add(pulse.mul(facets).mul(0.15));
  return { impl: 'native' };
};

export const source = () => `const facets = truchet(posL.xy.add(drift), {
  cells: 5, thickness: .045 });
const pulse = radialPulse(posL, {
  freq: 8, speed: 3, clock: t });
const rim = fresnel({ power: 2.2 });
const film = thinFilm({
  cycles: 3.1, shift: .15 });
colorNode = void_.mul(.1)
  .add(film.mul(rim.mul(.9).add(.2)))
  .add(ice.mul(facets.mul(pulse.mul(.6).add(.25))));
opacityNode = rim.mul(.65).add(facets.mul(.35));`;
