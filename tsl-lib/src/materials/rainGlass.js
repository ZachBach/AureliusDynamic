/**
 * RAIN GLASS — drops on a window, treated as lenses rather than as decals.
 * The backdrop is sampled at `p − q·drop`, where q is the offset from the
 * drop's centre: subtracting nearly all of it inverts the coordinate about
 * that centre, which is exactly what a converging lens does to the image
 * behind it. So each bead carries a tiny upside-down copy of the world, and
 * the dry glass between them stays flat and dim.
 *
 * Each column falls at its own hashed rate, because a sheet of rain that
 * descends in lockstep reads instantly as a texture scroll.
 *
 * @cost    see REGISTRY materials/rainGlass
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { valueNoise2D } from '../noise/valueNoise2D.js';
import { cosinePalette } from '../ramp/cosinePalette.js';

export const name = 'RAIN GLASS';

const DROP_COLS = 5;
const DROP_ROWS = 5;

export const apply = (TSL, mat, { clock } = {}) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.xy;
  const cx = p.x.mul(DROP_COLS);
  const ci = cx.floor();
  const fx = cx.fract().sub(0.5);
  // per-column fall rate: lockstep rain reads as a texture scroll, not weather
  const rate = TSL.hash(ci.mul(12.9898).add(7.13)).mul(0.7).add(0.4);
  const y = p.y.mul(DROP_ROWS).add(clock.mul(rate));
  const ri = y.floor();
  const fy = y.fract();
  const jx = TSL.hash(ri.mul(3.71).add(ci.mul(17.3))).sub(0.5).mul(0.5);
  const q = TSL.vec2(fx.sub(jx), fy.sub(0.62));
  const drop = TSL.smoothstep(0.3, 0.1, q.length());
  const trail = TSL.smoothstep(0.075, 0.015, fx.sub(jx).abs())
    .mul(TSL.smoothstep(0.58, 0.66, fy))
    .mul(TSL.smoothstep(1.0, 0.64, fy));
  const wet = TSL.max(drop, trail.mul(0.55));

  // the lens: invert the sample coordinate about the drop centre
  const sample = p.sub(q.mul(drop.mul(0.85)));
  const lights = valueNoise2D(TSL, sample.mul(3.2)).mul(0.5).add(0.5);
  // a narrow slice of the palette — night glass is blue, with the warm lamps
  // added back separately, not a full hue cycle
  const backdrop = cosinePalette(TSL, lights.mul(0.15).add(0.25), { preset: 'aurelius' })
    .mul(0.55)
    .add(brand.gold.mul(TSL.smoothstep(0.76, 0.97, lights).mul(0.7)));
  const grain = valueNoise2D(TSL, p.mul(120)).mul(0.5).add(0.5);
  const bead = TSL.smoothstep(0.05, 0.0, q.sub(TSL.vec2(-0.07, 0.07)).length()).mul(drop);

  mat.colorNode = backdrop.mul(wet.mul(1.1).add(0.22))
    .mul(grain.mul(0.12).add(0.92))
    .add(brand.mist.mul(wet.oneMinus().mul(0.07)))
    .add(brand.ice.mul(bead.mul(0.95)))
    .add(brand.cyan.mul(trail.mul(0.14)));
  return { impl: 'native' };
};

export const source = () => `const rate = hash(ci.mul(12.9898))
  .mul(.7).add(.4);            // per-column fall
const q = vec2(fx.sub(jx), fy.sub(.62));
const drop = smoothstep(.3, .1, q.length());
const sample = p.sub(q.mul(drop.mul(.85)));
// subtracting q inverts the coordinate about the
// drop centre — a lens, not a decal
const backdrop = cosinePalette(   // a narrow blue
  lights.mul(.15).add(.25)).mul(.55)   // slice…
  .add(gold.mul(smoothstep(.76, .97, lights)
    .mul(.7)));                  // …lamps added back
colorNode = backdrop.mul(wet.mul(1.1).add(.22))
  .add(ice.mul(bead.mul(.95)));`;