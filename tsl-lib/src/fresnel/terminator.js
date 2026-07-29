/**
 * terminator — day/night shading terms from a surface direction and a light
 * direction, as shipped on Terra (docs/INVENTORY.md §3): soft dawn band,
 * floor-lifted day shade, night mask for city lights / lightning boosts.
 *
 * @param   {object} TSL
 * @param   {Node}   dir       unit surface direction (body frame)
 * @param   {Node}   lightDir  unit direction toward the light
 * @param   {object} opts
 * @param   {number[]} [opts.dawn=[-0.15, 0.4]]  day smoothstep edges
 * @param   {number}   [opts.floor=0.18]         minimum day shade
 * @param   {number[]} [opts.dusk=[0.05, -0.3]]  night smoothstep edges
 * @returns {object} { day, shade, night } — raw dot, lit factor (floor..1),
 *                   night mask 0..1
 * @cost    class ① — dot + two smoothsteps
 * @backend wgsl ✓ / glsl ✓
 */
export const terminator = (TSL, dir, lightDir, { dawn = [-0.15, 0.4], floor = 0.18, dusk = [0.05, -0.3] } = {}) => {
  const { smoothstep } = TSL;
  const day = dir.dot(lightDir);
  const shade = smoothstep(dawn[0], dawn[1], day).mul(1 - floor).add(floor);
  const night = smoothstep(dusk[0], dusk[1], day);
  return { day, shade, night };
};

export const source = () => `const { shade, night } = terminator(rdir, L);
colorNode = surf.mul(shade)
  .add(city.mul(land).mul(night).mul(flick));`;
