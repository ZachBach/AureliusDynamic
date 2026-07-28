// Phase 0 pipeline-proof demos. These are NOT library nodes — they exist to
// prove the bench renders on both backends before Phase 2 starts. They do,
// however, already follow the library factory shape from docs/CONVENTIONS.md:
// (TSL, opts) in, nodes out, no owned uniforms, mx_* feature-detected.
//
// Each entry: { apply(TSL, material), source() }. Real library nodes will be
// one-per-file under src/ with the registry tracking them; this file is
// replaced by registry-driven discovery in Phase 3.

const fresnelOf = (TSL) => {
  const { float, cameraPosition, positionWorld, normalWorld } = TSL;
  const eye = cameraPosition.sub(positionWorld).normalize();
  return float(1).sub(eye.dot(normalWorld).abs());
};

export const nodes = {
  'fbm-mx': {
    apply(TSL, mat) {
      const { positionLocal, time, vec3, color } = TSL;
      const n = TSL.mx_fractal_noise_float(
        positionLocal.mul(2.4).add(vec3(time.mul(0.15), 0, 0)), 4, 2.0, 0.5)
        .mul(0.5).add(0.5);
      mat.colorNode = color(0x57D4FF).mul(n).add(color(0x2B6CF6).mul(n.pow(3)));
    },
    source: () => `const n = fbm(posL.mul(2.4), { octaves: 4 })
  .mul(.5).add(.5);
colorNode = cyan.mul(n).add(blue.mul(n.pow(3)));`,
  },

  'worley-mx': {
    apply(TSL, mat) {
      const { positionLocal, time, vec3, color, smoothstep } = TSL;
      const worley = TSL.mx_worley_noise_float;
      const w = worley
        ? worley(positionLocal.mul(3.2).add(vec3(0, time.mul(0.2), 0)))
        : TSL.mx_fractal_noise_float(positionLocal.mul(3.2), 3, 2.0, 0.5).abs();
      mat.colorNode = color(0x2B6CF6).mul(smoothstep(0.45, 0.92, w).mul(1.5));
    },
    source: () => `const w = worleyF1(posL.mul(3.2));
colorNode = blue.mul(smoothstep(.45, .92, w).mul(1.5));`,
  },

  'fresnel': {
    apply(TSL, mat) {
      const { color } = TSL;
      const fres = fresnelOf(TSL);
      mat.colorNode = color(0x57D4FF).mul(fres.mul(1.4))
        .add(color(0xEAF7FF).mul(fres.pow(5)));
    },
    source: () => `const fres = fresnel({ power: 1 });
colorNode = cyan.mul(fres.mul(1.4))
  .add(ice.mul(fres.pow(5)));`,
  },
};
