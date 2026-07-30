/**
 * gallery — the Lab's node-gallery drawer: curated live visualizers for the
 * library's verified nodes, rendered on the Lab knot. Each entry's display
 * source and badge come from the node module / registry at build time
 * (tools/build-lab.mjs); GALLERY_SOURCES is stripped from the inline build.
 *
 * Entry: { id (registry key), name (chip label), family, apply(TSL, mat, {clock}) }
 */
import { palette } from './util/palette.js';
import { fbm, source as fbmSource } from './noise/fbm.js';
import { gradientNoise, source as gradientSource } from './noise/gradientNoise.js';
import { valueNoise, source as valueSource } from './noise/valueNoise.js';
import { worleyF1, worleyF1F2, source as worleySource } from './noise/worley.js';
import { trigLattice, source as trigSource } from './noise/trigLattice.js';
import { ridgedFbm, source as ridgedSource } from './noise/ridgedFbm.js';
import { warp, source as warpSource } from './noise/warp.js';
import { turbulence, source as turbSource } from './noise/turbulence.js';
import { fireRamp, source as fireSource } from './ramp/fireRamp.js';
import { remap } from './ramp/remap.js';
import { ramp, source as rampSource } from './ramp/ramp.js';
import { cosinePalette, source as cosineSource } from './ramp/cosinePalette.js';
import { posterize, source as posterizeSource } from './ramp/posterize.js';
import { fresnel, source as fresnelSource } from './fresnel/fresnel.js';
import { terminator, source as terminatorSource } from './fresnel/terminator.js';
import { horizonBand, source as horizonSource } from './fresnel/horizonBand.js';
import { scanlines, source as scanSource } from './pattern/scanlines.js';
import { radialPulse, source as pulseSource } from './pattern/radialPulse.js';
import { dissolve, source as dissolveSource } from './pattern/dissolve.js';
import { hexGrid, source as gridSource } from './pattern/grid.js';
import { sdCircle, sdBox, opSmoothUnion, sdFill, sdOutline, source as sdfSource } from './pattern/sdf.js';
import { streaks, source as streaksSource } from './pattern/streaks.js';
import { curtain, source as curtainSource } from './pattern/curtain.js';
import { bandedFlow, source as bandedSource } from './pattern/bandedFlow.js';
import { thinFilm, source as thinFilmSource } from './fresnel/thinFilm.js';
import { truchet, source as truchetSource } from './pattern/truchet.js';
import { curl, source as curlSource } from './noise/curl.js';

export const GALLERY = [
  { id: 'noise/fbm', name: 'FBM', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2.4).add(TSL.vec3(clock.mul(0.15), 0, 0))).mul(0.5).add(0.5);
      mat.colorNode = brand.cyan.mul(n).add(brand.blue.mul(n.pow(3)));
    } },
  { id: 'noise/gradientNoise', name: 'GRADIENT', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const n = gradientNoise(TSL, TSL.positionLocal.mul(3).add(TSL.vec3(0, clock.mul(0.1), 0))).mul(0.5).add(0.5);
      mat.colorNode = brand.silver.mul(n);
    } },
  { id: 'noise/valueNoise', name: 'VALUE', family: 'NOISE',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      mat.colorNode = brand.ice.mul(valueNoise(TSL, TSL.positionLocal.mul(4)).mul(0.5).add(0.5));
    } },
  { id: 'noise/worleyF1', name: 'WORLEY', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const w = worleyF1(TSL, TSL.positionLocal.mul(3.2).add(TSL.vec3(0, clock.mul(0.2), 0)));
      mat.colorNode = brand.blue.mul(TSL.smoothstep(0.45, 0.92, w).mul(1.5));
    } },
  { id: 'noise/worleyF1F2', name: 'CELL WALLS', family: 'NOISE',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      const w = worleyF1F2(TSL, TSL.positionLocal.mul(3.2));
      mat.colorNode = brand.gold.mul(w.y.sub(w.x).mul(1.6));
    } },
  { id: 'noise/trigLattice', name: 'TRIG LATTICE', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { terra } = palette(TSL);
      const n = trigLattice(TSL, TSL.positionLocal, { terms: 3, freq: 3, drift: clock.mul(0.3) });
      mat.colorNode = TSL.mix(terra.ocean, terra.land, TSL.smoothstep(0.05, 0.45, n));
    } },
  { id: 'noise/ridgedFbm', name: 'RIDGED', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const r = ridgedFbm(TSL, TSL.positionLocal.mul(2).add(TSL.vec3(0, 0, clock.mul(0.1))));
      mat.colorNode = brand.cyan.mul(r.pow(3).mul(1.4)).add(brand.blue.mul(r.mul(0.3)));
    } },
  { id: 'noise/warp', name: 'WARP', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const p = TSL.positionLocal.mul(2).add(TSL.vec3(clock.mul(0.08), 0, 0));
      const v = fbm(TSL, warp(TSL, p, { amp: 0.8 })).mul(0.5).add(0.5);
      mat.colorNode = TSL.mix(brand.slate, brand.ice, v);
    } },
  { id: 'noise/turbulence', name: 'TURBULENCE', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      mat.colorNode = brand.mist.mul(turbulence(TSL, TSL.positionLocal.mul(2.5).add(TSL.vec3(0, clock.mul(0.12), 0))));
    } },

  { id: 'ramp/fireRamp', name: 'FIRE', family: 'RAMP',
    apply(TSL, mat, { clock } = {}) {
      const nz = fbm(TSL, TSL.positionLocal.mul(2.2).add(TSL.vec3(0, clock.mul(0.1), 0)));
      mat.colorNode = fireRamp(TSL, remap(TSL, nz, -1, 1, 0.3, 4.2));
    } },
  { id: 'ramp/ramp', name: 'RAMP', family: 'RAMP',
    apply(TSL, mat) {
      const { solar, brand } = palette(TSL);
      mat.colorNode = ramp(TSL, TSL.uv().x, [[0.05, brand.void], [0.35, solar.ember], [0.65, solar.mid], [0.95, solar.hot]]);
    } },
  { id: 'ramp/cosinePalette', name: 'COSINE', family: 'RAMP',
    apply(TSL, mat, { clock } = {}) {
      const n = fbm(TSL, TSL.positionLocal.mul(1.8), { octaves: 3 }).mul(0.3).add(TSL.uv().x).add(clock.mul(0.02));
      mat.colorNode = cosinePalette(TSL, n, { preset: 'aurelius' });
    } },
  { id: 'ramp/posterize', name: 'POSTERIZE', family: 'RAMP',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2).add(TSL.vec3(clock.mul(0.1), 0, 0)), { octaves: 3 }).mul(0.5).add(0.5);
      mat.colorNode = TSL.mix(brand.slate, brand.gold, posterize(TSL, n, { steps: 4 }));
    } },

  { id: 'fresnel/fresnel', name: 'FRESNEL', family: 'FRESNEL',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      const f = fresnel(TSL);
      mat.colorNode = brand.cyan.mul(f.mul(1.4)).add(brand.ice.mul(f.pow(5)));
    } },
  { id: 'fresnel/terminator', name: 'TERMINATOR', family: 'FRESNEL',
    apply(TSL, mat) {
      const { terra } = palette(TSL);
      const dir = TSL.positionLocal.normalize();
      const L = TSL.vec3(0.8, 0.25, 0.5).normalize();
      const { shade, night } = terminator(TSL, dir, L);
      const land = TSL.smoothstep(0.05, 0.45, trigLattice(TSL, dir, { terms: 3, freq: 3 }));
      mat.colorNode = TSL.mix(terra.ocean, terra.land, land).mul(shade)
        .add(terra.city.mul(land).mul(night).mul(0.7));
    } },
  { id: 'fresnel/horizonBand', name: 'HORIZON', family: 'FRESNEL',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const swirl = fbm(TSL, TSL.positionWorld.mul(1.4), { octaves: 3 });
      const band = horizonBand(TSL, { shear: swirl, clock });
      mat.colorNode = TSL.mix(brand.void, brand.silver, band.mul(0.7))
        .add(brand.ice.mul(fresnel(TSL, { power: 6 }).mul(0.8)));
    } },

  { id: 'pattern/scanlines', name: 'SCANLINES', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const s = scanlines(TSL, TSL.positionLocal.y, { freq: 18, clock });
      mat.colorNode = brand.cyan.mul(s).add(brand.blue.mul(0.15));
    } },
  { id: 'pattern/radialPulse', name: 'PULSE', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const p = radialPulse(TSL, TSL.positionLocal, { clock });
      mat.colorNode = brand.blue.mul(p.mul(1.4)).add(brand.ice.mul(p.pow(6)));
    } },
  { id: 'pattern/dissolve', name: 'DISSOLVE', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const n = fbm(TSL, TSL.positionLocal.mul(2.6)).mul(0.5).add(0.5);
      const th = TSL.sin(clock.mul(0.9)).mul(0.5).add(0.5).mul(0.7).add(0.1);
      const { alive, edge } = dissolve(TSL, n, th);
      mat.transparent = true;
      mat.colorNode = brand.mist.mul(0.5).add(brand.gold.mul(edge.mul(2.4)))
        .add(brand.ember.mul(edge.mul(edge).mul(1.6)));
      mat.opacityNode = alive;
    } },
  { id: 'pattern/hexGrid', name: 'HEX', family: 'PATTERN',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      const { edge, dist } = hexGrid(TSL, TSL.positionLocal.xy, { cells: 4 });
      mat.colorNode = brand.cyan.mul(edge)
        .add(brand.blue.mul(TSL.smoothstep(0.5, 0.0, dist).mul(0.25)));
    } },
  { id: 'pattern/sdf', name: 'SDF', family: 'PATTERN',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      const p = TSL.uv().sub(0.5).mul(2);
      const d = opSmoothUnion(TSL,
        sdCircle(TSL, p.add(TSL.vec2(0.25, -0.1)), 0.35),
        sdBox(TSL, p.sub(TSL.vec2(0.3, 0.15)), 0.3, 0.2), 0.2);
      mat.colorNode = brand.cyan.mul(sdOutline(TSL, d, { width: 0.02 }))
        .add(brand.blue.mul(sdFill(TSL, d).mul(0.35)));
    } },
  { id: 'pattern/streaks', name: 'STREAKS', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { solar } = palette(TSL);
      const q = TSL.positionLocal.xy;
      const st = streaks(TSL, TSL.atan(q.y, q.x), { lobes: 3, drift: clock.mul(0.3) });
      mat.colorNode = solar.mid.mul(TSL.smoothstep(1.6, 0.2, q.length()).mul(st))
        .add(solar.hot.mul(TSL.smoothstep(0.5, 0.0, q.length())));
    } },
  { id: 'pattern/curtain', name: 'CURTAIN', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const { glow, edge } = curtain(TSL, TSL.uv(), { clock: clock.mul(0.05) });
      mat.colorNode = brand.cyan.mul(glow.mul(1.15)).add(brand.blue.mul(glow.mul(0.5)))
        .add(brand.gold.mul(edge.mul(0.9)));
    } },
  { id: 'noise/curl', name: 'CURL', family: 'NOISE',
    apply(TSL, mat, { clock } = {}) {
      const flow = curl(TSL, TSL.positionLocal.mul(1.5).add(TSL.vec3(0, 0, clock.mul(0.05))));
      mat.colorNode = flow.mul(0.5).add(0.5);
    } },
  { id: 'fresnel/thinFilm', name: 'THIN FILM', family: 'FRESNEL',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      mat.colorNode = brand.void.mul(0.5).add(thinFilm(TSL, { cycles: 2.2 }));
    } },
  { id: 'pattern/truchet', name: 'TRUCHET', family: 'PATTERN',
    apply(TSL, mat) {
      const { brand } = palette(TSL);
      mat.colorNode = brand.cyan.mul(truchet(TSL, TSL.positionLocal.xy, { cells: 5 }))
        .add(brand.blue.mul(0.1));
    } },
  { id: 'pattern/bandedFlow', name: 'BANDED FLOW', family: 'PATTERN',
    apply(TSL, mat, { clock } = {}) {
      const { brand } = palette(TSL);
      const t = bandedFlow(TSL, TSL.positionLocal.normalize(), { drift: clock.mul(0.05) });
      mat.colorNode = brand.gold.mul(t)
        .add(brand.blue.mul(t.oneMinus().mul(0.35)));
    } },
];

// build-time only — stripped from the inline bundle (tools/build-lab.mjs)
export const GALLERY_SOURCES = {
  'noise/fbm': fbmSource(), 'noise/gradientNoise': gradientSource(),
  'noise/valueNoise': valueSource(), 'noise/worleyF1': worleySource(),
  'noise/worleyF1F2': worleySource(), 'noise/trigLattice': trigSource(),
  'noise/ridgedFbm': ridgedSource(), 'noise/warp': warpSource(),
  'noise/turbulence': turbSource(),
  'ramp/fireRamp': fireSource(), 'ramp/ramp': rampSource(),
  'ramp/cosinePalette': cosineSource(), 'ramp/posterize': posterizeSource(),
  'fresnel/fresnel': fresnelSource(), 'fresnel/terminator': terminatorSource(),
  'fresnel/horizonBand': horizonSource(),
  'pattern/scanlines': scanSource(), 'pattern/radialPulse': pulseSource(),
  'pattern/dissolve': dissolveSource(), 'pattern/hexGrid': gridSource(),
  'pattern/sdf': sdfSource(), 'pattern/streaks': streaksSource(),
  'pattern/curtain': curtainSource(),
  'noise/curl': curlSource(), 'fresnel/thinFilm': thinFilmSource(),
  'pattern/truchet': truchetSource(), 'pattern/bandedFlow': bandedSource(),
};
