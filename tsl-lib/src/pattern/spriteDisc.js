/**
 * spriteDisc / spriteDiamond — per-sprite alpha falloffs from sprite uv,
 * as shipped on every particle system (docs/INVENTORY.md §4): soft disc
 * squared, optional hot pinpoint core (the star-glint look), and the
 * hard-edged manhattan-distance diamond for crystal facets.
 *
 * @param   {object} TSL
 * @param   {Node}   uv  raw sprite uv (0..1) — centered internally
 * @param   {object} opts
 * @param   {number} [opts.edge=0.08]  disc edge softness end
 * @param   {number} [opts.core=0]     pinpoint-core strength (shipped:
 *                                     0.5·DIM on the 500k field)
 * @returns {Node} float 0..1+
 * @cost    class ① — length + smoothstep (+pow with core)
 * @backend wgsl ✓ / glsl ✓
 */
export const spriteDisc = (TSL, uv, { edge = 0.08, core = 0 } = {}) => {
  const d = uv.sub(0.5).length();
  const circle = TSL.smoothstep(0.5, edge, d);
  const soft = circle.mul(circle);
  return core ? soft.add(circle.pow(7).mul(core)) : soft;
};

export const spriteDiamond = (TSL, uv, { edge = 0.03, size = 0.46 } = {}) => {
  const q = uv.sub(0.5);
  const facet = TSL.smoothstep(size, edge, q.x.abs().add(q.y.abs()));
  return facet.mul(facet);
};

export const source = () => `opacityNode = spriteDisc(uv(), { core: .5 })
  .mul(twinkle).mul(gates);`;
