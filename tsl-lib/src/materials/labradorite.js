/**
 * LABRADORITE — schiller, the flash that only exists at one angle. The
 * feldspar unmixed into stacked lamellae whose spacing is a fraction of a
 * micron, so the stack is a Bragg reflector: it returns one colour, and only
 * when the lamellar plane bisects the light and the eye. Turn the stone a few
 * degrees and the whole face goes grey. That narrow angular window is the
 * entire identity of the material, so the model is a HARD threshold on the
 * half-vector alignment, not a soft specular lobe — and the colour comes from
 * the local lamellar spacing, which is why adjacent domains flash differently.
 *
 * @cost    see REGISTRY materials/labradorite
 * @backend wgsl ✓ / glsl ✓ (impl: fallback by choice)
 */
import { palette } from '../util/palette.js';
import { worleyF1F2 } from '../noise/worley.js';
import { cosinePalette } from '../ramp/cosinePalette.js';
import { fbm } from '../noise/fbm.js';

export const name = 'LABRADORITE';

export const apply = (TSL, mat) => {
  const { brand } = palette(TSL);
  const p = TSL.positionLocal;
  // domains: each grew with its own lamellar orientation and spacing
  const cell = worleyF1F2(TSL, p.mul(2.3), { impl: 'fallback' });
  const domain = cell.y.sub(cell.x);
  const twist = fbm(TSL, p.mul(1.4), { octaves: 2 });
  const lamellae = TSL.vec3(twist.mul(0.55), 1.0, twist.mul(-0.4)).normalize();
  const view = TSL.cameraPosition.sub(TSL.positionWorld).normalize();
  const n = TSL.normalWorld;
  // Bragg: the stack returns light only near one geometry — a HARD window
  const half = view.add(lamellae).normalize();
  const align = n.dot(half).abs();
  const window = TSL.smoothstep(0.62, 0.93, align);
  // spacing sets the returned wavelength, so neighbouring domains differ
  const hue = cosinePalette(TSL, domain.mul(2.6).add(twist.mul(0.5)), {
    a: [0.35, 0.45, 0.55], b: [0.35, 0.35, 0.45], c: [1, 1, 1], d: [0.62, 0.48, 0.15],
  });
  const grainEdge = TSL.smoothstep(0.06, 0.0, domain);
  mat.colorNode = brand.slate.mul(0.42)
    .add(hue.mul(window.mul(1.7)))
    .add(brand.ice.mul(window.pow(4).mul(0.45)))
    .sub(brand.void.mul(grainEdge.mul(0.35)));
  return { impl: 'fallback' };
};

export const source = () => `const cell = worleyF1F2(posL.mul(2.3));
const domain = cell.y.sub(cell.x);   // one grain
// the lamellar stack is a BRAGG reflector: it
// returns light only near one geometry, so this
// is a hard window, not a soft specular lobe
const half = view.add(lamellae).normalize();
const window = smoothstep(.62, .93,
  normalWorld.dot(half).abs());
// spacing sets the wavelength — neighbouring
// domains flash different colours
const hue = cosinePalette(domain.mul(2.6));
colorNode = slate.mul(.42).add(hue.mul(window.mul(1.7)));`;
