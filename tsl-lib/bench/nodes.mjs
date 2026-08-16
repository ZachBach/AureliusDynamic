// Bench entries — every entry visualizes a real library node from ../src/
// (Phase 2: the Phase 0 hand-rolled demos are retired). Entry contract:
//   id              registry key ('noise/fbm'); map key stays URL/file-safe
//   apply(TSL, mat, { clock, ...params }) → { impl: 'native' | 'fallback' }
//   source()        the node module's own derived snippet
//   sweep           param sets for the frozen parity grid
//   parityGeo / parityTolerance   see verify-all.mjs
import { palette } from '../src/util/palette.js';
import { latlonUv, source as latlonSource } from '../src/util/latlonUv.js';
import { fbm, fbmImpl, source as fbmSource } from '../src/noise/fbm.js';
import { valueNoise, source as valueSource } from '../src/noise/valueNoise.js';
import { worleyF1, worleyF1F2, worleyImpl, source as worleySource } from '../src/noise/worley.js';
import { trigLattice, source as trigSource } from '../src/noise/trigLattice.js';
import { fresnel, source as fresnelSource } from '../src/fresnel/fresnel.js';
import { fireRamp, source as fireSource } from '../src/ramp/fireRamp.js';
import { remap } from '../src/ramp/remap.js';
import { scanlines, source as scanSource } from '../src/pattern/scanlines.js';
import { radialPulse, source as pulseSource } from '../src/pattern/radialPulse.js';
import { dissolve, source as dissolveSource } from '../src/pattern/dissolve.js';
import { flicker, flash, source as flickerSource } from '../src/pattern/flicker.js';
import { vignette, source as vignetteSource } from '../src/pattern/vignette.js';
import { spriteDisc, spriteDiamond, source as discSource } from '../src/pattern/spriteDisc.js';
import { gradientNoise, gradientImpl, source as gradientSource } from '../src/noise/gradientNoise.js';
import { ridgedFbm, source as ridgedSource } from '../src/noise/ridgedFbm.js';
import { warp, source as warpSource } from '../src/noise/warp.js';
import { turbulence, source as turbSource } from '../src/noise/turbulence.js';
import { ramp, source as rampSource } from '../src/ramp/ramp.js';
import { cosinePalette, source as cosineSource } from '../src/ramp/cosinePalette.js';
import { posterize, source as posterizeSource } from '../src/ramp/posterize.js';
import { terminator, source as terminatorSource } from '../src/fresnel/terminator.js';
import { rimLight, source as rimSource } from '../src/fresnel/rimLight.js';
import { horizonBand, source as horizonSource } from '../src/fresnel/horizonBand.js';
import { atmosphereShell, source as atmoSource } from '../src/fresnel/atmosphereShell.js';
import { gridLines, hexGrid, source as gridSource } from '../src/pattern/grid.js';
import { stripes, checker, source as stripesSource } from '../src/pattern/stripes.js';
import { sdCircle, sdBox, opSmoothUnion, sdFill, sdOutline, source as sdfSource } from '../src/pattern/sdf.js';
import { streaks, source as streaksSource } from '../src/pattern/streaks.js';
import { curtain, source as curtainSource } from '../src/pattern/curtain.js';
import { bandedFlow, source as bandedSource } from '../src/pattern/bandedFlow.js';
import { blackbody, source as blackbodySource } from '../src/ramp/blackbody.js';
import * as matHologram from '../src/materials/hologram.js';
import * as matShield from '../src/materials/shield.js';
import * as matLiquid from '../src/materials/liquidMetal.js';
import * as matDissolve from '../src/materials/dissolveMat.js';
import * as matMagma from '../src/materials/magma.js';
import * as matIce from '../src/materials/ice.js';
import * as matForceField from '../src/materials/forceField.js';
import * as matGlitch from '../src/materials/glitch.js';
import * as matMarble from '../src/materials/marble.js';
import * as matAuroraSilk from '../src/materials/auroraSilk.js';
import * as matNebulaGlass from '../src/materials/nebulaGlass.js';
import * as matToonCel from '../src/materials/toonCel.js';
import * as matBrushed from '../src/materials/brushedMetal.js';
import * as matStarfield from '../src/materials/starfield.js';
import * as matPlasma from '../src/materials/plasmaArcs.js';
import * as matPrismatic from '../src/materials/prismaticField.js';
import * as matCircuitMaze from '../src/materials/circuitMaze.js';
import * as matVortexFlow from '../src/materials/vortexFlow.js';
// Wave 3 materials
import * as matOilSlick from '../src/materials/oilSlick.js';
import * as matCrystal from '../src/materials/crystal.js';
import * as matRust from '../src/materials/rust.js';
import * as matTopoMap from '../src/materials/topoMap.js';
import * as matRadarSweep from '../src/materials/radarSweep.js';
import * as matLavaLamp from '../src/materials/lavaLamp.js';
import * as matDamascus from '../src/materials/damascus.js';
import * as matStainedGlass from '../src/materials/stainedGlass.js';
import * as matCaustics from '../src/materials/caustics.js';
import * as matVelvet from '../src/materials/velvet.js';
import * as matBark from '../src/materials/bark.js';
import * as matSnakeScales from '../src/materials/snakeScales.js';
import * as matNeonTubes from '../src/materials/neonTubes.js';
import * as matThermalCam from '../src/materials/thermalCam.js';
import * as matCrtScreen from '../src/materials/crtScreen.js';
import * as matMatrixRain from '../src/materials/matrixRain.js';
import * as matSoapBubble from '../src/materials/soapBubble.js';
import * as matOpal from '../src/materials/opal.js';
import * as matMalachite from '../src/materials/malachite.js';
import * as matSandDunes from '../src/materials/sandDunes.js';
import * as matCoral from '../src/materials/coral.js';
import * as matHalftone from '../src/materials/halftone.js';
import * as matBlueprint from '../src/materials/blueprint.js';
import * as matPlasmaGlobe from '../src/materials/plasmaGlobe.js';
import * as matKaleidoscope from '../src/materials/kaleidoscope.js';
import { thinFilm, source as thinFilmSource } from '../src/fresnel/thinFilm.js';
import { truchet, source as truchetSource } from '../src/pattern/truchet.js';
import { curl, source as curlSource } from '../src/noise/curl.js';
// Wave 4 nodes
import { valueNoise2D, source as value2dSource } from '../src/noise/valueNoise2D.js';
import { interference, source as interferenceSource } from '../src/pattern/interference.js';
import { weave, source as weaveSource } from '../src/pattern/weave.js';
import { polarFold, source as polarFoldSource } from '../src/pattern/polarFold.js';
import { anisoSheen, surfaceTangent, source as anisoSource } from '../src/fresnel/anisoSheen.js';
// Wave 4 materials
import * as matRippleTank from '../src/materials/rippleTank.js';
import * as matMoire from '../src/materials/moire.js';
import * as matChainmail from '../src/materials/chainmail.js';
import * as matCarbonWeave from '../src/materials/carbonWeave.js';
import * as matCrackedClay from '../src/materials/crackedClay.js';
import * as matFerrofluid from '../src/materials/ferrofluid.js';
import * as matCumulus from '../src/materials/cumulus.js';
import * as matRainGlass from '../src/materials/rainGlass.js';
import * as matSpiralGalaxy from '../src/materials/spiralGalaxy.js';
import * as matTigersEye from '../src/materials/tigersEye.js';
import * as matSnowflake from '../src/materials/snowflake.js';

// material modules share the bench entry contract directly
const materialEntry = (id, mod, tolerance = 1.5) => ({
  id,
  parityGeo: 'knot',
  parityTolerance: { maxDiffPct: tolerance },
  sweep: [{}],
  apply: (TSL, mat, opts) => mod.apply(TSL, mat, opts),
  source: mod.source,
});

export const nodes = {
  'noise-fbm': {
    id: 'noise/fbm',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2.4).add(TSL.vec3(clock.mul(0.15), 0, 0));
      const n = fbm(TSL, p, { octaves }).mul(0.5).add(0.5);
      mat.colorNode = brand.cyan.mul(n).add(brand.blue.mul(n.pow(3)));
      return { impl: fbmImpl(TSL) };
    },
    source: fbmSource,
  },

  'noise-fbm-fallback': {
    id: 'noise/fbm@fallback',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2.4).add(TSL.vec3(clock.mul(0.15), 0, 0));
      const n = fbm(TSL, p, { octaves, base: 'value' }).mul(0.5).add(0.5);
      mat.colorNode = brand.cyan.mul(n).add(brand.blue.mul(n.pow(3)));
      return { impl: 'fallback' };
    },
    source: fbmSource,
  },

  'noise-value': {
    id: 'noise/valueNoise',
    sweep: [{ scale: 2 }, { scale: 4 }, { scale: 8 }],
    apply(TSL, mat, { scale = 4 } = {}) {
      const { brand } = palette(TSL);
      const n = valueNoise(TSL, TSL.positionLocal.mul(scale)).mul(0.5).add(0.5);
      mat.colorNode = brand.ice.mul(n);
      return { impl: 'native' };
    },
    source: valueSource,
  },

  'noise-worley': {
    id: 'noise/worleyF1',
    sweep: [{ scale: 2 }, { scale: 3.2 }, { scale: 5 }],
    apply(TSL, mat, { clock, scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(scale).add(TSL.vec3(0, clock.mul(0.2), 0));
      const w = worleyF1(TSL, p);
      mat.colorNode = brand.blue.mul(TSL.smoothstep(0.45, 0.92, w).mul(1.5));
      return { impl: worleyImpl(TSL) };
    },
    source: worleySource,
  },

  'noise-worley-f2f1': {
    // semantics test: if mx_worley_noise_vec2 = (F1, F2), y−x darkens at
    // cell borders — verify in the shot, then the adapter comment is earned
    id: 'noise/worleyF1F2',
    sweep: [{ scale: 2.4 }, { scale: 4 }],
    apply(TSL, mat, { scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const w = worleyF1F2(TSL, TSL.positionLocal.mul(scale));
      mat.colorNode = brand.gold.mul(w.y.sub(w.x).mul(1.6));
      return { impl: worleyImpl(TSL) };
    },
    source: worleySource,
  },

  'noise-worley-fallback': {
    id: 'noise/worleyF1F2@fallback',
    sweep: [{ scale: 3.2 }],
    apply(TSL, mat, { scale = 3.2 } = {}) {
      const { brand } = palette(TSL);
      const w = worleyF1F2(TSL, TSL.positionLocal.mul(scale), { impl: 'fallback' });
      mat.colorNode = brand.gold.mul(w.y.sub(w.x).mul(1.6));
      return { impl: 'fallback' };
    },
    source: worleySource,
  },

  'noise-triglattice': {
    id: 'noise/trigLattice',
    sweep: [{ terms: 2 }, { terms: 3 }, { terms: 4 }],
    apply(TSL, mat, { clock, terms = 3 } = {}) {
      const { terra } = palette(TSL);
      const n = trigLattice(TSL, TSL.positionLocal, { terms, freq: 3, drift: clock.mul(0.3) });
      const land = TSL.smoothstep(0.05, 0.45, n);
      mat.colorNode = TSL.mix(terra.ocean, terra.land, land);
      return { impl: 'native' };
    },
    source: trigSource,
  },

  'fresnel': {
    id: 'fresnel/fresnel',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ power: 1 }, { power: 3 }, { power: 5 }],
    apply(TSL, mat, { power = 1 } = {}) {
      const { brand } = palette(TSL);
      const fres = fresnel(TSL, { power });
      mat.colorNode = brand.cyan.mul(fres.mul(1.4)).add(brand.ice.mul(fres.pow(5)));
      return { impl: 'native' };
    },
    source: fresnelSource,
  },

  'ramp-fire': {
    id: 'ramp/fireRamp',
    sweep: [{ gain: 1.6 }, { gain: 2.4 }, { gain: 3.4 }],
    apply(TSL, mat, { clock, gain = 2.4 } = {}) {
      const p = TSL.positionLocal.mul(2.2).add(TSL.vec3(0, clock.mul(0.1), 0));
      const nz = fbm(TSL, p, { octaves: 4 });
      const bright = remap(TSL, nz, -1, 1, 0.3, 4.2);
      mat.colorNode = fireRamp(TSL, bright, { gain });
      return { impl: 'native' };
    },
    source: fireSource,
  },

  'pattern-scanlines': {
    id: 'pattern/scanlines',
    sweep: [{ sharpness: 1 }, { sharpness: 3 }, { sharpness: 7 }],
    apply(TSL, mat, { clock, sharpness = 3 } = {}) {
      const { brand } = palette(TSL);
      const scan = scanlines(TSL, TSL.positionLocal.y, { freq: 18, sharpness, clock });
      mat.colorNode = brand.cyan.mul(scan).add(brand.blue.mul(0.15));
      return { impl: 'native' };
    },
    source: scanSource,
  },

  'pattern-radialpulse': {
    id: 'pattern/radialPulse',
    sweep: [{ freq: 5 }, { freq: 9 }, { freq: 14 }],
    apply(TSL, mat, { clock, freq = 9 } = {}) {
      const { brand } = palette(TSL);
      const pulse = radialPulse(TSL, TSL.positionLocal, { freq, clock });
      mat.colorNode = brand.blue.mul(pulse.mul(1.4)).add(brand.ice.mul(pulse.pow(6)));
      return { impl: 'native' };
    },
    source: pulseSource,
  },

  'pattern-dissolve': {
    id: 'pattern/dissolve',
    sweep: [{ edgeWidth: 0.05 }, { edgeWidth: 0.1 }, { edgeWidth: 0.2 }],
    apply(TSL, mat, { clock, edgeWidth = 0.1 } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2.6), { octaves: 4 }).mul(0.5).add(0.5);
      const th = TSL.sin(clock.mul(0.9)).mul(0.5).add(0.5).mul(0.7).add(0.1);
      const { alive, edge } = dissolve(TSL, n, th, { edgeWidth });
      mat.transparent = true;
      mat.colorNode = TSL.mix(brand.slate, brand.mist, 0.4)
        .add(brand.gold.mul(edge.mul(2.4)))
        .add(brand.ember.mul(edge.mul(edge).mul(1.6)));
      mat.opacityNode = alive;
      return { impl: 'native' };
    },
    source: dissolveSource,
  },

  'pattern-flicker': {
    id: 'pattern/flicker',
    sweep: [{ depth: 0.2 }, { depth: 0.6 }],
    apply(TSL, mat, { clock, depth = 0.5 } = {}) {
      const { brand, terra } = palette(TSL);
      const phase = TSL.positionLocal.x.mul(8);
      const tw = flicker(TSL, clock, { rate: 2, phase, depth });
      const bolt = flash(TSL, clock, { rate: 3, phase, sharpness: 16, envPhase: TSL.positionLocal.y.mul(3) });
      mat.colorNode = brand.gold.mul(tw).add(terra.bolt.mul(bolt.mul(2)));
      return { impl: 'native' };
    },
    source: flickerSource,
  },

  'pattern-vignette': {
    id: 'pattern/vignette',
    sweep: [{ inner: 0.15 }, { inner: 0.28 }],
    apply(TSL, mat, { inner = 0.28 } = {}) {
      const { brand } = palette(TSL);
      const v = vignette(TSL, TSL.uv().sub(0.5), { inner });
      mat.colorNode = brand.ice.mul(v);
      return { impl: 'native' };
    },
    source: vignetteSource,
  },

  'pattern-spritedisc': {
    id: 'pattern/spriteDisc',
    sweep: [{ core: 0 }, { core: 0.5 }],
    apply(TSL, mat, { core = 0.5 } = {}) {
      const { brand } = palette(TSL);
      const u = TSL.uv();
      const disc = spriteDisc(TSL, u, { core });
      const dia = spriteDiamond(TSL, u);
      const pick = TSL.step(0.5, u.x); // left: disc · right: diamond
      const shape = disc.mul(pick.oneMinus()).add(dia.mul(pick));
      mat.colorNode = brand.gold.mul(shape);
      return { impl: 'native' };
    },
    source: discSource,
  },

  'noise-gradient': {
    id: 'noise/gradientNoise',
    sweep: [{ scale: 2 }, { scale: 3 }, { scale: 5 }],
    apply(TSL, mat, { scale = 3 } = {}) {
      const { brand } = palette(TSL);
      const n = gradientNoise(TSL, TSL.positionLocal.mul(scale)).mul(0.5).add(0.5);
      mat.colorNode = brand.silver.mul(n);
      return { impl: gradientImpl(TSL) };
    },
    source: gradientSource,
  },

  'noise-gradient-fallback': {
    id: 'noise/gradientNoise@fallback',
    sweep: [{ scale: 3 }],
    apply(TSL, mat, { scale = 3 } = {}) {
      const { brand } = palette(TSL);
      const n = gradientNoise(TSL, TSL.positionLocal.mul(scale), { impl: 'fallback' }).mul(0.5).add(0.5);
      mat.colorNode = brand.silver.mul(n);
      return { impl: 'fallback' };
    },
    source: gradientSource,
  },

  'noise-ridged': {
    id: 'noise/ridgedFbm',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 5 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2).add(TSL.vec3(0, 0, clock.mul(0.1)));
      const r = ridgedFbm(TSL, p, { octaves });
      mat.colorNode = brand.cyan.mul(r.pow(3).mul(1.4)).add(brand.blue.mul(r.mul(0.3)));
      return { impl: 'native' };
    },
    source: ridgedSource,
  },

  'noise-warp': {
    id: 'noise/warp',
    sweep: [{ amp: 0.3 }, { amp: 0.8 }, { amp: 1.4 }],
    apply(TSL, mat, { clock, amp = 0.8 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2).add(TSL.vec3(clock.mul(0.08), 0, 0));
      const veins = fbm(TSL, warp(TSL, p, { amp }), { octaves: 4 }).mul(0.5).add(0.5);
      mat.colorNode = TSL.mix(brand.slate, brand.ice, veins);
      return { impl: 'native' };
    },
    source: warpSource,
  },

  'noise-turbulence': {
    id: 'noise/turbulence',
    sweep: [{ octaves: 2 }, { octaves: 4 }, { octaves: 6 }],
    apply(TSL, mat, { clock, octaves = 4 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2.5).add(TSL.vec3(0, clock.mul(0.12), 0));
      mat.colorNode = brand.mist.mul(turbulence(TSL, p, { octaves }));
      return { impl: 'native' };
    },
    source: turbSource,
  },

  'ramp-stops': {
    id: 'ramp/ramp',
    sweep: [{ stops: 3 }, { stops: 4 }],
    apply(TSL, mat, { stops = 4 } = {}) {
      const { solar, brand } = palette(TSL);
      const x = TSL.uv().x;
      const set = stops === 3
        ? [[0.1, brand.slate], [0.5, solar.mid], [0.9, solar.hot]]
        : [[0.05, brand.void], [0.35, solar.ember], [0.65, solar.mid], [0.95, solar.hot]];
      mat.colorNode = ramp(TSL, x, set);
      return { impl: 'native' };
    },
    source: rampSource,
  },

  'ramp-cosine': {
    id: 'ramp/cosinePalette',
    sweep: [{ preset: 'aurelius' }, { preset: 'ember' }, {}],
    apply(TSL, mat, { clock, preset } = {}) {
      const n = fbm(TSL, TSL.positionLocal.mul(1.8).add(TSL.vec3(clock.mul(0.1), 0, 0)), { octaves: 3 })
        .mul(0.3).add(TSL.uv().x);
      mat.colorNode = cosinePalette(TSL, n, preset ? { preset } : {});
      return { impl: 'native' };
    },
    source: cosineSource,
  },

  'ramp-posterize': {
    id: 'ramp/posterize',
    sweep: [{ steps: 3 }, { steps: 6 }],
    apply(TSL, mat, { clock, steps = 4 } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2).add(TSL.vec3(clock.mul(0.1), 0, 0)), { octaves: 3 })
        .mul(0.5).add(0.5);
      mat.colorNode = TSL.mix(brand.slate, brand.gold, posterize(TSL, n, { steps }));
      return { impl: 'native' };
    },
    source: posterizeSource,
  },

  'fresnel-rim': {
    id: 'fresnel/rimLight',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ biasAmount: 0 }, { biasAmount: 0.9 }],
    apply(TSL, mat, { biasAmount = 0.6 } = {}) {
      const { brand } = palette(TSL);
      const L = TSL.vec3(0.7, 0.5, 0.5).normalize();
      mat.colorNode = brand.blue.mul(0.15)
        .add(rimLight(TSL, { color: brand.ice, power: 3, dir: L, biasAmount }));
      return { impl: 'native' };
    },
    source: rimSource,
  },

  'fresnel-horizon': {
    id: 'fresnel/horizonBand',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ freq: 5.5 }, { freq: 9 }],
    apply(TSL, mat, { clock, freq = 5.5 } = {}) {
      const { brand } = palette(TSL);
      const swirl = fbm(TSL, TSL.positionWorld.mul(1.4), { octaves: 3 });
      const band = horizonBand(TSL, { freq, shear: swirl, clock });
      mat.colorNode = TSL.mix(brand.void, brand.silver, band.mul(0.7))
        .add(rimLight(TSL, { color: brand.ice, power: 6 }).mul(0.8));
      return { impl: 'native' };
    },
    source: horizonSource,
  },

  'fresnel-atmosphere': {
    id: 'fresnel/atmosphereShell',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ power: 2.5 }, { power: 3.5 }],
    apply(TSL, mat, { power = 3.5 } = {}) {
      const L = TSL.vec3(0.75, 0.35, 0.55).normalize();
      const atmo = atmosphereShell(TSL, L, { power });
      mat.transparent = true;
      mat.blending = 2; // THREE.AdditiveBlending
      mat.depthWrite = false;
      mat.colorNode = atmo.color;
      mat.opacityNode = atmo.opacity;
      return { impl: 'native' };
    },
    source: atmoSource,
  },

  'fresnel-terminator': {
    id: 'fresnel/terminator',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ floor: 0.18 }, { floor: 0.4 }],
    apply(TSL, mat, { floor = 0.18 } = {}) {
      const { terra } = palette(TSL);
      const dir = TSL.positionLocal.normalize();
      const L = TSL.vec3(0.8, 0.25, 0.5).normalize();
      const { shade, night } = terminator(TSL, dir, L, { floor });
      const land = TSL.smoothstep(0.05, 0.45, trigLattice(TSL, dir, { terms: 3, freq: 3 }));
      mat.colorNode = TSL.mix(terra.ocean, terra.land, land).mul(shade)
        .add(terra.city.mul(land).mul(night).mul(0.7));
      return { impl: 'native' };
    },
    source: terminatorSource,
  },

  'pattern-grid': {
    id: 'pattern/grid',
    sweep: [{ cells: 6 }, { cells: 12 }],
    apply(TSL, mat, { cells = 8 } = {}) {
      const { brand } = palette(TSL);
      const line = gridLines(TSL, TSL.uv(), { cells });
      mat.colorNode = brand.cyan.mul(line).add(brand.blue.mul(0.12));
      return { impl: 'native' };
    },
    source: gridSource,
  },

  'pattern-hex': {
    id: 'pattern/hexGrid',
    sweep: [{ cells: 4 }, { cells: 7 }],
    apply(TSL, mat, { cells = 6 } = {}) {
      const { brand } = palette(TSL);
      const { edge, dist } = hexGrid(TSL, TSL.uv().sub(0.5), { cells });
      mat.colorNode = brand.cyan.mul(edge)
        .add(brand.blue.mul(TSL.smoothstep(0.5, 0.0, dist).mul(0.25)));
      return { impl: 'native' };
    },
    source: gridSource,
  },

  'pattern-stripes': {
    id: 'pattern/stripes',
    sweep: [{ duty: 0.3 }, { duty: 0.6 }],
    apply(TSL, mat, { duty = 0.5 } = {}) {
      const { brand } = palette(TSL);
      const pick = TSL.step(0.5, TSL.uv().y); // top: stripes · bottom: checker
      const s = stripes(TSL, TSL.uv().x, { freq: 8, duty });
      const c = checker(TSL, TSL.uv(), { freq: 6 });
      mat.colorNode = brand.gold.mul(s.mul(pick))
        .add(brand.blue.mul(c.mul(pick.oneMinus()).mul(0.8)));
      return { impl: 'native' };
    },
    source: stripesSource,
  },

  'pattern-sdf': {
    id: 'pattern/sdf',
    sweep: [{ k: 0.05 }, { k: 0.2 }, { k: 0.45 }],
    apply(TSL, mat, { k = 0.2 } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.uv().sub(0.5).mul(2);
      const d = opSmoothUnion(TSL,
        sdCircle(TSL, p.add(TSL.vec2(0.25, -0.1)), 0.35),
        sdBox(TSL, p.sub(TSL.vec2(0.3, 0.15)), 0.3, 0.2), k);
      mat.colorNode = brand.cyan.mul(sdOutline(TSL, d, { width: 0.02 }))
        .add(brand.blue.mul(sdFill(TSL, d).mul(0.35)));
      return { impl: 'native' };
    },
    source: sdfSource,
  },

  'pattern-streaks': {
    id: 'pattern/streaks',
    sweep: [{ lobes: 3 }, { lobes: 6 }],
    apply(TSL, mat, { clock, lobes = 3 } = {}) {
      const { solar } = palette(TSL);
      const q = TSL.uv().sub(0.5).mul(2);
      const ang = TSL.atan(q.y, q.x);
      const radial = TSL.smoothstep(1.0, 0.1, q.length());
      const st = streaks(TSL, ang, { lobes, drift: clock.mul(0.3) });
      mat.colorNode = solar.mid.mul(radial.mul(st))
        .add(solar.hot.mul(TSL.smoothstep(0.35, 0.0, q.length())));
      return { impl: 'native' };
    },
    source: streaksSource,
  },

  'pattern-curtain': {
    id: 'pattern/curtain',
    sweep: [{ decay: 4.6, ridgeBase: 0.62 }, { decay: 5.5, ridgeBase: 0.76 }],
    apply(TSL, mat, { clock, decay = 4.6, ridgeBase = 0.62 } = {}) {
      const { brand } = palette(TSL);
      const { glow, edge } = curtain(TSL, TSL.uv(), { decay, ridgeBase, clock: clock.mul(0.05) });
      mat.colorNode = brand.cyan.mul(glow.mul(1.15))
        .add(brand.blue.mul(glow.mul(0.5)))
        .add(brand.gold.mul(edge.mul(0.9)));
      return { impl: 'native' };
    },
    source: curtainSource,
  },

  'pattern-bandedflow': {
    id: 'pattern/bandedFlow',
    sweep: [{ bands: 6, warpAmp: 0.22 }, { bands: 9, warpAmp: 0.35 }],
    apply(TSL, mat, { clock, bands = 6, warpAmp = 0.22 } = {}) {
      const { brand } = palette(TSL);
      const q = TSL.uv().sub(0.5).mul(2);
      const dir = TSL.vec3(q.x, q.y, 0.6).normalize();
      const t = bandedFlow(TSL, dir, { bands, warpAmp, drift: clock.mul(0.05) });
      mat.colorNode = brand.gold.mul(t)
        .add(brand.blue.mul(t.oneMinus().mul(0.4)));
      return { impl: 'native' };
    },
    source: bandedSource,
  },

  'ramp-blackbody': {
    id: 'ramp/blackbody',
    sweep: [{ tLo: 1700, tHi: 30000 }, { tLo: 3000, tHi: 8000 }],
    apply(TSL, mat, { tLo = 1700, tHi = 30000 } = {}) {
      // temperature strip, mired-linear across x (the node's own axis)
      const mLo = 1e6 / tHi, mHi = 1e6 / tLo;
      const mired = TSL.uv().x.mul(mHi - mLo).add(mLo);
      mat.colorNode = blackbody(TSL, TSL.float(1e6).div(mired));
      return { impl: 'native' };
    },
    source: blackbodySource,
  },

  'mat-hologram': materialEntry('materials/hologram', matHologram),
  'mat-shield': materialEntry('materials/shield', matShield),
  'mat-liquidmetal': materialEntry('materials/liquidMetal', matLiquid),
  'mat-dissolve': materialEntry('materials/dissolve', matDissolve),
  'mat-magma': materialEntry('materials/magma', matMagma),
  'mat-ice': materialEntry('materials/ice', matIce),
  'mat-forcefield': materialEntry('materials/forceField', matForceField),
  'mat-glitch': materialEntry('materials/glitch', matGlitch),
  'mat-marble': materialEntry('materials/marble', matMarble),
  'mat-aurorasilk': materialEntry('materials/auroraSilk', matAuroraSilk),
  'mat-nebulaglass': materialEntry('materials/nebulaGlass', matNebulaGlass),
  'mat-tooncel': materialEntry('materials/toonCel', matToonCel),
  'mat-brushed': materialEntry('materials/brushedMetal', matBrushed),
  'mat-starfield': materialEntry('materials/starfield', matStarfield),
  'mat-plasma': materialEntry('materials/plasmaArcs', matPlasma),
  'mat-prismatic': materialEntry('materials/prismaticField', matPrismatic),
  'mat-circuitmaze': materialEntry('materials/circuitMaze', matCircuitMaze),
  'mat-vortexflow': materialEntry('materials/vortexFlow', matVortexFlow, 2.0),

  // Wave 3. All on the default 1.5% tolerance: the high-frequency designs here
  // (fine rulings, hard-stepped dots and glyphs) were budgeted for looser
  // limits on the BACKEND-NOTES curved-edge-AA argument, but measured
  // 0.001–0.077% across the wave, so the default holds everywhere and the gate
  // stays tight.
  'mat-oilslick': materialEntry('materials/oilSlick', matOilSlick),
  'mat-crystal': materialEntry('materials/crystal', matCrystal),
  'mat-rust': materialEntry('materials/rust', matRust),
  'mat-topomap': materialEntry('materials/topoMap', matTopoMap),
  'mat-radarsweep': materialEntry('materials/radarSweep', matRadarSweep),
  'mat-lavalamp': materialEntry('materials/lavaLamp', matLavaLamp),
  'mat-damascus': materialEntry('materials/damascus', matDamascus),
  'mat-stainedglass': materialEntry('materials/stainedGlass', matStainedGlass),
  'mat-caustics': materialEntry('materials/caustics', matCaustics),
  'mat-velvet': materialEntry('materials/velvet', matVelvet),
  'mat-bark': materialEntry('materials/bark', matBark),
  'mat-snakescales': materialEntry('materials/snakeScales', matSnakeScales),
  'mat-neontubes': materialEntry('materials/neonTubes', matNeonTubes),
  'mat-thermalcam': materialEntry('materials/thermalCam', matThermalCam),
  'mat-crtscreen': materialEntry('materials/crtScreen', matCrtScreen),
  'mat-matrixrain': materialEntry('materials/matrixRain', matMatrixRain),
  'mat-soapbubble': materialEntry('materials/soapBubble', matSoapBubble),
  'mat-opal': materialEntry('materials/opal', matOpal),
  'mat-malachite': materialEntry('materials/malachite', matMalachite),
  'mat-sanddunes': materialEntry('materials/sandDunes', matSandDunes),
  'mat-coral': materialEntry('materials/coral', matCoral),
  'mat-halftone': materialEntry('materials/halftone', matHalftone),
  'mat-blueprint': materialEntry('materials/blueprint', matBlueprint),
  'mat-plasmaglobe': materialEntry('materials/plasmaGlobe', matPlasmaGlobe),
  'mat-kaleidoscope': materialEntry('materials/kaleidoscope', matKaleidoscope),

  'fresnel-thinfilm': {
    id: 'fresnel/thinFilm',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ cycles: 1.4 }, { cycles: 2.2 }, { cycles: 3.5 }],
    apply(TSL, mat, { cycles = 2.2 } = {}) {
      const { brand } = palette(TSL);
      mat.colorNode = brand.void.mul(0.5).add(thinFilm(TSL, { cycles }));
      return { impl: 'native' };
    },
    source: thinFilmSource,
  },

  'pattern-truchet': {
    id: 'pattern/truchet',
    sweep: [{ cells: 4 }, { cells: 6 }, { cells: 9 }],
    apply(TSL, mat, { cells = 6 } = {}) {
      const { brand } = palette(TSL);
      const arcs = truchet(TSL, TSL.uv().sub(0.5), { cells });
      mat.colorNode = brand.cyan.mul(arcs).add(brand.blue.mul(0.1));
      return { impl: 'native' };
    },
    source: truchetSource,
  },

  'noise-curl': {
    id: 'noise/curl',
    sweep: [{ octaves: 2 }, { octaves: 3 }],
    apply(TSL, mat, { clock, octaves = 3 } = {}) {
      const flow = curl(TSL, TSL.positionLocal.mul(1.5).add(TSL.vec3(0, 0, clock.mul(0.05))), { octaves });
      mat.colorNode = flow.mul(0.5).add(0.5);
      return { impl: 'native' };
    },
    source: curlSource,
  },

  // ---- Wave 4 nodes ----

  'noise-value2d': {
    id: 'noise/valueNoise2D',
    sweep: [{ scale: 4 }, { scale: 9 }, { scale: 18 }],
    apply(TSL, mat, { clock, scale = 9 } = {}) {
      const { brand } = palette(TSL);
      const n = valueNoise2D(TSL, TSL.positionLocal.xy.mul(scale).add(TSL.vec2(clock.mul(0.1), 0)))
        .mul(0.5).add(0.5);
      mat.colorNode = brand.ice.mul(n).add(brand.blue.mul(n.pow(3)));
      return { impl: 'native' };
    },
    source: value2dSource,
  },

  'pattern-interference': {
    id: 'pattern/interference',
    sweep: [{ freq: 14 }, { freq: 26 }, { freq: 40 }],
    apply(TSL, mat, { clock, freq = 26 } = {}) {
      const { brand, terra } = palette(TSL);
      const p = TSL.positionLocal.xy;
      const { field, envelope } = interference(TSL, p, {
        sources: [[-0.55, -0.2], [0.55, -0.2]], freq, decay: 0.8, clock,
      });
      mat.colorNode = terra.atmo.mul(field.mul(0.5).add(0.5))
        .mul(TSL.smoothstep(0.02, 0.34, envelope))
        .add(brand.blue.mul(0.12));
      return { impl: 'native' };
    },
    source: interferenceSource,
  },

  'pattern-weave': {
    id: 'pattern/weave',
    sweep: [{ cells: 5 }, { cells: 9 }, { cells: 14 }],
    apply(TSL, mat, { cells = 9 } = {}) {
      const { brand } = palette(TSL);
      const { height, mask, warpVisible } = weave(TSL, TSL.positionLocal.xy, { cells });
      const lift = height.mul(0.75).add(0.25);
      mat.colorNode = brand.slate.mul(mask.mul(0.5))
        .add(brand.cyan.mul(warpVisible.mul(mask).mul(lift).mul(0.7)))
        .add(brand.gold.mul(warpVisible.oneMinus().mul(mask).mul(lift).mul(0.6)));
      return { impl: 'native' };
    },
    source: weaveSource,
  },

  'pattern-polarfold': {
    id: 'pattern/polarFold',
    sweep: [{ sectors: 6 }, { sectors: 8 }, { sectors: 12 }],
    apply(TSL, mat, { clock, sectors = 8 } = {}) {
      const { brand } = palette(TSL);
      const { p: q, radius } = polarFold(TSL, TSL.positionLocal.xy, {
        sectors, spin: clock.mul(0.06),
      });
      const arcs = truchet(TSL, q, { cells: 3 });
      mat.colorNode = brand.cyan.mul(arcs.mul(0.9))
        .add(brand.gold.mul(TSL.smoothstep(1.3, 0.1, radius).mul(0.25)));
      return { impl: 'native' };
    },
    source: polarFoldSource,
  },

  'fresnel-anisosheen': {
    id: 'fresnel/anisoSheen',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{ power: 8 }, { power: 24 }, { power: 60 }],
    apply(TSL, mat, { power = 24 } = {}) {
      const { brand } = palette(TSL);
      const { u } = surfaceTangent(TSL);
      mat.colorNode = brand.void.mul(0.8)
        .add(brand.gold.mul(anisoSheen(TSL, u, { power }).mul(1.2)));
      return { impl: 'native' };
    },
    source: anisoSource,
  },

  // ---- Wave 4 materials ----
  'mat-rippletank': materialEntry('materials/rippleTank', matRippleTank),
  'mat-moire': materialEntry('materials/moire', matMoire),
  'mat-chainmail': materialEntry('materials/chainmail', matChainmail),
  'mat-carbonweave': materialEntry('materials/carbonWeave', matCarbonWeave),
  'mat-crackedclay': materialEntry('materials/crackedClay', matCrackedClay),
  'mat-ferrofluid': materialEntry('materials/ferrofluid', matFerrofluid),
  'mat-cumulus': materialEntry('materials/cumulus', matCumulus),
  'mat-rainglass': materialEntry('materials/rainGlass', matRainGlass),
  'mat-spiralgalaxy': materialEntry('materials/spiralGalaxy', matSpiralGalaxy),
  'mat-tigerseye': materialEntry('materials/tigersEye', matTigersEye),
  'mat-snowflake': materialEntry('materials/snowflake', matSnowflake),

  'util-latlon': {
    id: 'util/latlonUv',
    parityGeo: 'sphere',
    parityTolerance: { maxDiffPct: 1.0 },
    sweep: [{}],
    apply(TSL, mat) {
      const dir = TSL.positionLocal.normalize();
      const uvLL = latlonUv(TSL, dir);
      mat.colorNode = TSL.vec3(uvLL.x, uvLL.y, 0.4);
      return { impl: 'native' };
    },
    source: latlonSource,
  },
};
