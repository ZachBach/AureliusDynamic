/**
 * grid / hexGrid — line lattices over 2D coordinates.
 * gridLines: square cells. hexGrid: hexagonal tiling (returns edge mask +
 * per-cell distance for force-field looks).
 *
 * @param   {object} TSL
 * @param   {Node}   p  vec2 coordinates (e.g. uv().sub(.5), or posL.xy)
 * @param   {object} opts
 * @param   {number} [opts.cells=8]        cell frequency
 * @param   {number} [opts.thickness=0.04] line half-width (cell units)
 * @param   {number} [opts.soft=0.02]      edge softness
 * @returns {Node} float 0..1 line mask (1 on lines)
 * @cost    class ① grid · class ② hex (two candidate cells)
 * @backend wgsl ✓ / glsl ✓
 */
export const gridLines = (TSL, p, { cells = 8, thickness = 0.04, soft = 0.02 } = {}) => {
  const { min, smoothstep } = TSL;
  const g = p.mul(cells).fract();
  const dx = min(g.x, g.x.oneMinus());
  const dy = min(g.y, g.y.oneMinus());
  return smoothstep(thickness + soft, thickness - soft, min(dx, dy));
};

// hex metric distance from a cell center — axes must match the s=(1,1.73)
// lattice's neighbor directions (1,0)·(±.5,.866), else the vertices leak
// into triangles (caught visually 2026-07-27; parity can't see it)
const hexDist = (TSL, p) => {
  const q = p.abs();
  return TSL.max(q.x, q.x.mul(0.5).add(q.y.mul(0.8660254)));
};

export const hexGrid = (TSL, p, { cells = 6, thickness = 0.035, soft = 0.02 } = {}) => {
  const { vec2, smoothstep, mix, step } = TSL;
  const s = vec2(1.0, 1.7320508);
  const h = s.mul(0.5);
  const q = p.mul(cells);
  // two staggered candidate cells; keep the nearer center
  const a = q.mod(s).sub(h);
  const b = q.sub(h).mod(s).sub(h);
  const pick = step(a.dot(a), b.dot(b));
  const cell = mix(b, a, pick);
  const d = hexDist(TSL, cell); // 0 center → 0.5 edge
  const edge = smoothstep(thickness + soft, thickness - soft, TSL.float(0.5).sub(d));
  return { edge, dist: d };
};

export const source = () => `const { edge } = hexGrid(posL.xy, { cells: 6 });
colorNode = cyan.mul(edge).add(blue.mul(fres));`;
