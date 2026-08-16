/**
 * CHAINMAIL — two ring lattices offset by half a cell, which alone would give
 * a stack of washers. Mail is rows that alternate: every second row threads
 * over its neighbours instead of under. Taking that from the row index's
 * parity is what closes the fabric — it is the same swap `weave` makes, on a
 * lattice of annuli rather than tows.
 *
 * @cost    see REGISTRY materials/chainmail
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { sdCircle, sdFill } from '../pattern/sdf.js';
import { fresnel } from '../fresnel/fresnel.js';

export const name = 'CHAINMAIL';

const MAIL_CELLS = 4;
const RADIUS = 0.33;
const WIRE = 0.085;

// one lattice of rings: rounded wire profile + its coverage mask
const rings = (TSL, g, offset) => {
  const q = g.add(offset);
  const id = q.floor();
  const f = q.fract().sub(0.5);
  const d = sdCircle(TSL, f, RADIUS).abs().sub(WIRE); // annulus, not a disc
  return {
    id,
    crown: TSL.smoothstep(0, WIRE, d.negate()), // 0 at the wire edge, 1 at its spine
    mask: sdFill(TSL, d, { soft: 0.012 }),
  };
};

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const g = TSL.positionLocal.xy.mul(MAIL_CELLS);
  const a = rings(TSL, g, TSL.vec2(0, 0));
  const b = rings(TSL, g, TSL.vec2(0.5, 0.5));
  // row parity decides which lattice threads over — washers become mail
  const overA = a.id.y.mod(2);
  const hA = a.crown.mul(TSL.mix(0.55, 1, overA));
  const hB = b.crown.mul(TSL.mix(1, 0.55, overA));
  const metal = TSL.max(a.mask.mul(hA.mul(0.5).add(0.5)), b.mask.mul(hB.mul(0.5).add(0.5)));
  const lit = TSL.max(hA, hB);
  const rim = fresnel(TSL, { power: 2.6 });
  mat.colorNode = brand.void.mul(0.6)
    .add(brand.silver.mul(metal.mul(0.75)))
    .add(brand.ice.mul(lit.pow(3).mul(metal).mul(0.85)))
    .add(brand.gold.mul(rim.mul(metal).mul(0.22)));
  return { impl: 'native' };
};

export const source = () => `const a = rings(g, vec2(0, 0));
const b = rings(g, vec2(.5, .5));
const overA = a.id.y.mod(2);   // ROW parity —
// offset alone gives washers, not mail
const hA = a.crown.mul(mix(.55, 1, overA));
const hB = b.crown.mul(mix(1, .55, overA));
colorNode = void.mul(.6)
  .add(silver.mul(metal.mul(.75)))
  .add(ice.mul(lit.pow(3).mul(metal).mul(.85)))
  .add(gold.mul(fresnel().mul(metal).mul(.22)));`;