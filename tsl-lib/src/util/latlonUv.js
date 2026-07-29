/**
 * latlonUv — unit direction → equirectangular uv (0..1)², as shipped in the
 * Terra live-storm sampling (docs/INVENTORY.md §5). Pair with a
 * RepeatWrapping texture so the longitude seam wraps.
 *
 * @param   {object} TSL
 * @param   {Node}   dir  unit vec3 in the body frame
 * @returns {Node} vec2 uv — u from longitude (atan2), v from latitude (asin)
 * @cost    class ① — two inverse trig calls
 * @backend wgsl ✓ / glsl ✓ — 2-arg atan is atan2 on both
 */
export const latlonUv = (TSL, dir) => {
  const { vec2, asin, atan } = TSL;
  const lat = asin(dir.y);
  const lon = atan(dir.z, dir.x);
  return vec2(lon.mul(1 / (Math.PI * 2)).add(0.5), lat.mul(1 / Math.PI).add(0.5));
};

export const source = () => `const uv = latlonUv(bodyDir);
const storm = texture(stormMap, uv).r;`;
