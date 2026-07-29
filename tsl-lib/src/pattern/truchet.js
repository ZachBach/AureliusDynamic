/**
 * truchet — quarter-circle arc tiles with hash-flipped orientation: the
 * classic emergent-maze pattern. Returns an antialiased line mask.
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 coordinates
 * @param   {object} opts
 * @param   {number} [opts.cells=6]
 * @param   {number} [opts.thickness=0.06]  arc half-width (cell units)
 * @param   {number} [opts.soft=0.03]
 * @returns {Node} float 0..1 arc mask
 * @cost    class ① — one hash + two lengths
 * @backend wgsl ✓ / glsl ✓
 */
export const truchet = (TSL, p, { cells = 6, thickness = 0.06, soft = 0.03 } = {}) => {
  const { vec2, hash, step, mix, min, smoothstep } = TSL;
  const g = p.mul(cells);
  const id = g.floor();
  const f = g.fract().sub(0.5);
  const flip = step(0.5, hash(id.add(vec2(103.7, 211.3)).dot(vec2(1.0, 57.0))));
  const x = mix(f.x, f.x.negate(), flip);
  const q = vec2(x, f.y);
  const d = min(
    q.sub(vec2(0.5, 0.5)).length().sub(0.5).abs(),
    q.add(vec2(0.5, 0.5)).length().sub(0.5).abs());
  return smoothstep(thickness + soft, thickness - soft, d);
};

export const source = () => `const arcs = truchet(posL.xy, { cells: 6 });
colorNode = cyan.mul(arcs).add(blue.mul(.1));`;
