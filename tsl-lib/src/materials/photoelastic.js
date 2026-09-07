/**
 * PHOTOELASTIC — stress made visible. A transparent solid under load turns
 * birefringent, and between crossed polarizers the retardation
 * δ = 2πCd(σ₁−σ₂)/λ paints colored fringes. Because δ divides by λ, each
 * wavelength goes dark at a different stress: the fringes are SPECTRAL, and
 * their spacing counts stress directly — engineers read the order number off
 * the photo. Two things ride together and are easy to confuse: isochromatics
 * (the colored bands, from stress magnitude) and isoclines (the dark brushes,
 * where a principal axis happens to line up with the polarizer). Both are
 * here, because a real photoelastic image never shows one without the other.
 *
 * @cost    see REGISTRY materials/photoelastic
 * @backend wgsl ✓ / glsl ✓
 */
import { palette } from '../util/palette.js';
import { cosinePalette } from '../ramp/cosinePalette.js';

export const name = 'PHOTOELASTIC';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal.xy;
  // two load points — stress concentrates as 1/r, the reason fringes crowd there
  const a = p.sub(TSL.vec2(-0.55, -0.30));
  const b = p.sub(TSL.vec2(0.60, 0.25));
  const sa = TSL.float(1).div(a.length().mul(2.6).add(0.28));
  const sb = TSL.float(1).div(b.length().mul(2.6).add(0.28));
  const diff = sa.add(sb); // σ₁−σ₂, the principal-stress difference
  // isochromatics: δ ∝ (σ₁−σ₂)/λ, so cycle each channel at its own rate
  const fringe = cosinePalette(TSL, diff.mul(1.9), {
    a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.13, 1.31], d: [0.0, 0.33, 0.67],
  });
  // isoclines: dark where a principal axis aligns with the polarizer
  const theta = TSL.atan(a.y.add(b.y), a.x.add(b.x));
  const isocline = TSL.sin(theta.mul(2)).abs().mul(0.75).add(0.25);
  mat.colorNode = brand.void.mul(0.5)
    .add(fringe.mul(isocline).mul(diff.mul(0.8).add(0.35).min(1.25)));
  return { impl: 'native' };
};

export const source = () => `const sa = float(1).div(a.length().mul(2.6).add(.28));
const sb = float(1).div(b.length().mul(2.6).add(.28));
const diff = sa.add(sb);              // σ₁ − σ₂
// isochromatics: δ ∝ (σ₁−σ₂)/λ, so each
// channel cycles at its OWN rate
const fringe = cosinePalette(diff.mul(1.9),
  { c: [1, 1.13, 1.31] });
// isoclines: dark where a principal axis
// lines up with the polarizer
const isocline = sin(theta.mul(2)).abs();
colorNode = void.mul(.5).add(fringe.mul(isocline));`;
