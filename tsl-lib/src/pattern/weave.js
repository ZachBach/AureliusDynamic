/**
 * weave — interlaced warp and weft tows with a real over/under alternation.
 *
 * Two crossed sets of rounded bands is not a weave; it is a grid. What makes
 * cloth read as cloth is that the tow on top SWAPS from cell to cell, so the
 * checkerboard parity of the cell id is the whole mechanism. The under-tow is
 * pushed down rather than hidden, which is what gives the crossing points
 * their alternating light and dark corners.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 coordinates (e.g. uv())
 * @param   {object} opts
 * @param   {number} [opts.cells=8]        tow crossings across p's unit range
 * @param   {number} [opts.thickness=0.34] tow half-width (cell units, 0..0.5)
 * @param   {number} [opts.sink=0.55]      height scale of the under-tow
 * @param   {number} [opts.soft=0.05]      coverage edge softness
 * @returns {object} { height, mask, warpVisible } — floats 0..1; warpVisible
 *          is 1 where the vertical tow is the one on top
 * @cost    class ② — two smoothstep profiles + a parity
 * @backend wgsl ✓ / glsl ✓
 */
export const weave = (TSL, p, { cells = 8, thickness = 0.34, sink = 0.55, soft = 0.05 } = {}) => {
  const { smoothstep, max, mix, step } = TSL;
  const g = p.mul(cells);
  const id = g.floor();
  const f = g.fract().sub(0.5);
  // rounded cylinder profile across each tow: 1 at the crown, 0 at the gap
  const crown = (u) => smoothstep(thickness, 0, u.abs());
  const warp = crown(f.x); // vertical tow
  const weft = crown(f.y); // horizontal tow
  // the over/under swap — the entire difference between cloth and a grid
  const over = id.x.add(id.y).mod(2);
  const hWarp = warp.mul(mix(sink, 1, over));
  const hWeft = weft.mul(mix(1, sink, over));
  const height = max(hWarp, hWeft);
  return {
    height,
    mask: smoothstep(0, soft, height),
    warpVisible: step(hWeft, hWarp),
  };
};

export const source = () => `const over = id.x.add(id.y).mod(2); // the swap
const hWarp = warp.mul(mix(sink, 1, over));
const hWeft = weft.mul(mix(1, sink, over));
const { height, mask, warpVisible } =
  weave(posL.xy, { cells: 5, thickness: .34 });`;