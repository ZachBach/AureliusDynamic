// build-lab — inject the library-built Lab into the bundle template.
//
// Flow:  python tools/extract.py  →  node tools/build-lab.mjs  →  python tools/pack.py
//
// What it does to build/template.html (idempotent — anchors survive rebuilds):
//   1. Replaces the Shader Lab's material-definition span (from the uFlux
//      anchor to the widget-DOM anchor) with an inlined, dependency-ordered
//      subset of tsl-lib/src plus LAB_DEFS built from src/materials/*.
//      Display code comes from each module's source() — generated, never
//      hand-written. Badges come from REGISTRY.json (cost class, gpuMs,
//      backends, verified date).
//   2. Adds the badge line to the widget panel and setMat.
// The widget DOM, singleton guard, reattach loop, and lazy init are untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const LIB = dirname(TOOLS);
const TEMPLATE = join(LIB, 'build', 'template.html');
const registry = JSON.parse(readFileSync(join(LIB, 'docs', 'REGISTRY.json'), 'utf8'));

// dependency-ordered inline set — everything the four materials reach
const LIB_FILES = [
  'noise/adapters/mx.js', 'noise/valueNoise.js', 'noise/fbm.js', 'noise/worley.js',
  'noise/warp.js',
  'util/palette.js', 'fresnel/fresnel.js', 'fresnel/horizonBand.js', 'fresnel/rimLight.js',
  'ramp/fireRamp.js', 'ramp/remap.js', 'ramp/ramp.js', 'ramp/posterize.js',
  'pattern/scanlines.js', 'pattern/radialPulse.js', 'pattern/dissolve.js', 'pattern/flicker.js',
  'pattern/grid.js', 'pattern/curtain.js',
  'noise/gradientNoise.js', 'noise/ridgedFbm.js', 'noise/turbulence.js', 'noise/trigLattice.js',
  'ramp/cosinePalette.js', 'fresnel/terminator.js', 'pattern/sdf.js', 'pattern/streaks.js',
  'fresnel/thinFilm.js', 'pattern/truchet.js', 'pattern/bandedFlow.js', 'noise/curl.js',
  'gallery.js', // last — its visualizers reference everything above
];
const MATERIALS = [
  { file: 'materials/hologram.js', fn: '__mat_hologram', id: 'materials/hologram' },
  { file: 'materials/shield.js', fn: '__mat_shield', id: 'materials/shield' },
  { file: 'materials/liquidMetal.js', fn: '__mat_liquidmetal', id: 'materials/liquidMetal' },
  { file: 'materials/dissolveMat.js', fn: '__mat_dissolve', id: 'materials/dissolve' },
  { file: 'materials/magma.js', fn: '__mat_magma', id: 'materials/magma' },
  { file: 'materials/ice.js', fn: '__mat_ice', id: 'materials/ice' },
  { file: 'materials/forceField.js', fn: '__mat_forcefield', id: 'materials/forceField' },
  { file: 'materials/glitch.js', fn: '__mat_glitch', id: 'materials/glitch' },
  { file: 'materials/marble.js', fn: '__mat_marble', id: 'materials/marble' },
  { file: 'materials/auroraSilk.js', fn: '__mat_aurorasilk', id: 'materials/auroraSilk' },
  { file: 'materials/nebulaGlass.js', fn: '__mat_nebulaglass', id: 'materials/nebulaGlass' },
  { file: 'materials/toonCel.js', fn: '__mat_tooncel', id: 'materials/toonCel' },
  { file: 'materials/brushedMetal.js', fn: '__mat_brushed', id: 'materials/brushedMetal' },
  { file: 'materials/starfield.js', fn: '__mat_starfield', id: 'materials/starfield' },
  { file: 'materials/plasmaArcs.js', fn: '__mat_plasma', id: 'materials/plasmaArcs' },
  { file: 'materials/prismaticField.js', fn: '__mat_prismatic', id: 'materials/prismaticField' },
  { file: 'materials/circuitMaze.js', fn: '__mat_circuitmaze', id: 'materials/circuitMaze' },
  { file: 'materials/vortexFlow.js', fn: '__mat_vortexflow', id: 'materials/vortexFlow' },
  // Wave 3
  { file: 'materials/oilSlick.js', fn: '__mat_oilslick', id: 'materials/oilSlick' },
  { file: 'materials/crystal.js', fn: '__mat_crystal', id: 'materials/crystal' },
  { file: 'materials/rust.js', fn: '__mat_rust', id: 'materials/rust' },
  { file: 'materials/topoMap.js', fn: '__mat_topomap', id: 'materials/topoMap' },
  { file: 'materials/radarSweep.js', fn: '__mat_radarsweep', id: 'materials/radarSweep' },
  { file: 'materials/lavaLamp.js', fn: '__mat_lavalamp', id: 'materials/lavaLamp' },
  { file: 'materials/damascus.js', fn: '__mat_damascus', id: 'materials/damascus' },
  { file: 'materials/stainedGlass.js', fn: '__mat_stainedglass', id: 'materials/stainedGlass' },
  { file: 'materials/caustics.js', fn: '__mat_caustics', id: 'materials/caustics' },
  { file: 'materials/velvet.js', fn: '__mat_velvet', id: 'materials/velvet' },
  { file: 'materials/bark.js', fn: '__mat_bark', id: 'materials/bark' },
  { file: 'materials/snakeScales.js', fn: '__mat_snakescales', id: 'materials/snakeScales' },
  { file: 'materials/neonTubes.js', fn: '__mat_neontubes', id: 'materials/neonTubes' },
  { file: 'materials/thermalCam.js', fn: '__mat_thermalcam', id: 'materials/thermalCam' },
  { file: 'materials/crtScreen.js', fn: '__mat_crtscreen', id: 'materials/crtScreen' },
  { file: 'materials/matrixRain.js', fn: '__mat_matrixrain', id: 'materials/matrixRain' },
  { file: 'materials/soapBubble.js', fn: '__mat_soapbubble', id: 'materials/soapBubble' },
  { file: 'materials/opal.js', fn: '__mat_opal', id: 'materials/opal' },
  { file: 'materials/malachite.js', fn: '__mat_malachite', id: 'materials/malachite' },
  { file: 'materials/sandDunes.js', fn: '__mat_sanddunes', id: 'materials/sandDunes' },
  { file: 'materials/coral.js', fn: '__mat_coral', id: 'materials/coral' },
  { file: 'materials/halftone.js', fn: '__mat_halftone', id: 'materials/halftone' },
  { file: 'materials/blueprint.js', fn: '__mat_blueprint', id: 'materials/blueprint' },
  { file: 'materials/plasmaGlobe.js', fn: '__mat_plasmaglobe', id: 'materials/plasmaGlobe' },
  { file: 'materials/kaleidoscope.js', fn: '__mat_kaleidoscope', id: 'materials/kaleidoscope' },
];

const strip = (relPath, renameApply = null) => {
  let t = readFileSync(join(LIB, 'src', relPath), 'utf8');
  t = t.replace(/\/\*\*[\s\S]*?\*\//g, '');          // doc blocks (bundle size)
  t = t.replace(/^import .*$/gm, '');                 // imports (inlined instead)
  t = t.replace(/export const GALLERY_SOURCES[\s\S]*/, ''); // build-time only
  t = t.replace(/export const source[\s\S]*/, '');    // source() — embedded via LAB_DEFS
  t = t.replace(/^export const name = .*$/gm, '');
  if (renameApply) t = t.replace('export const apply', `const ${renameApply}`);
  t = t.replace(/^export const /gm, 'const ');
  return t.split('\n').map((l) => l.trim() ? '      ' + l : '').join('\n').trim();
};

// meta line per material from the registry
const base = registry._baseline || {};
const gpuShort = (base.gpu || '').match(/UHD Graphics (\d+)/) ? 'UHD ' + base.gpu.match(/UHD Graphics (\d+)/)[1] : 'baseline';
const CLASSES = ['①', '②', '③', '④', '⑤'];
const metaFor = (id) => {
  const e = registry[id];
  if (!e || !e.cost) return '';
  const impl = e.impl || {};
  return `${CLASSES[e.cost.costClass - 1]} · ${e.cost.gpuMs.toFixed(2)} MS @ ${gpuShort} · ` +
    `WGSL${impl.webgpu ? ' ✓' : ''} GLSL${impl.webgl2 ? ' ✓' : ''} · VERIFIED ${e.verified}`;
};

// load material modules for name + source()
const defs = [];
for (const m of MATERIALS) {
  const mod = await import('file://' + join(LIB, 'src', m.file).replace(/\\/g, '/'));
  defs.push({ name: mod.name, fn: m.fn, code: mod.source(), meta: metaFor(m.id) });
}

const inlined = [...LIB_FILES.map((f) => strip(f)),
                 ...MATERIALS.map((m) => strip(m.file, m.fn))].join('\n\n');

// gallery: display sources from the module (build-time), badges from registry
const gal = await import('file://' + join(LIB, 'src', 'gallery.js').replace(/\\/g, '/'));
const galCodes = {}, galMeta = {};
for (const g of gal.GALLERY) {
  galCodes[g.id] = gal.GALLERY_SOURCES[g.id] || '';
  galMeta[g.id] = metaFor(g.id);
}
const galMaps = `      const GAL_CODES = ${JSON.stringify(galCodes)};\n` +
                `      const GAL_META = ${JSON.stringify(galMeta)};`;

const labDefs = `      const LAB_DEFS = [\n` + defs.map((d) =>
  `        { name: ${JSON.stringify(d.name)}, make: ${d.fn}, code: ${JSON.stringify(d.code)}, meta: ${JSON.stringify(d.meta)} },`).join('\n') +
  `\n      ];\n      const mats = [];\n      for (const d of LAB_DEFS) {\n` +
  `        const m = new THREE.MeshBasicNodeMaterial();\n` +
  `        d.make(THREE.TSL, m, { clock: t });\n` +
  `        mats.push({ name: d.name, m, code: d.code, meta: d.meta });\n      }`;

let tpl = readFileSync(TEMPLATE, 'utf8');
const startAnchor = '      const uFlux = uniform(0.5);';
const endAnchor = '      // ---- widget DOM';
const i0 = tpl.indexOf(startAnchor);
const i1 = tpl.indexOf(endAnchor);
if (i0 < 0 || i1 < 0 || i1 < i0) throw new Error('lab anchors not found in template');

const block =
`${startAnchor}
      const t = time.mul(uFlux.mul(1.8).add(0.25));
      // ==== tsl-lib inline build (generated by tsl-lib/tools/build-lab.mjs — do not hand-edit; sources in tsl-lib/src) ====
      ${inlined}

${labDefs}
${galMaps}
      // ==== end tsl-lib inline build ====

`;
tpl = tpl.slice(0, i0) + block + tpl.slice(i1);

// badge UI — idempotent: skip if already present
if (!tpl.includes('const badge = D(')) {
  const panelAnchor = '      panel.appendChild(chips); panel.appendChild(pre); panel.appendChild(fluxRow); panel.appendChild(metrics);';
  if (!tpl.includes(panelAnchor)) throw new Error('panel anchor not found');
  tpl = tpl.replace(panelAnchor,
    `      const badge = D('font-family:' + MONO + ';font-size:9px;letter-spacing:.14em;color:#57D4FF;min-height:12px');\n` +
    `      panel.appendChild(chips); panel.appendChild(badge); panel.appendChild(pre); panel.appendChild(fluxRow); panel.appendChild(metrics);`);
  const setMatAnchor = '        pre.textContent = mats[i].code;';
  if (!tpl.includes(setMatAnchor)) throw new Error('setMat anchor not found');
  tpl = tpl.replace(setMatAnchor,
    `        pre.textContent = mats[i].code;\n        badge.textContent = mats[i].meta || '';`);
}

// drawer: replace the chip-wiring span (btns … setMat(0)) with the
// materials + node-gallery version. Generated block keeps the same start/end
// lines, so rebuilds replace their own previous output.
const btnsStart = '      const btns = [];';
const btnsEnd = '      setMat(0);';
const b0 = tpl.indexOf(btnsStart);
const b1 = tpl.indexOf(btnsEnd);
if (b0 < 0 || b1 < 0 || b1 < b0) throw new Error('chip-wiring anchors not found');
const drawer =
`      const btns = [];
      const gbtns = [];
      const styleChip = (b, on, hot) => {
        b.style.color = on ? '#F4C95D' : (hot ? '#57D4FF' : '#9AA7BC');
        b.style.borderColor = on ? 'rgba(244,201,93,.6)' : 'rgba(255,255,255,.14)';
        b.style.background = on ? 'rgba(244,201,93,.08)' : 'transparent';
      };
      const showEntry = (m, code, meta) => {
        knot.material = m;
        pre.textContent = code;
        badge.textContent = meta || '';
      };
      const setMat = (i) => {
        showEntry(mats[i].m, mats[i].code, mats[i].meta);
        btns.forEach((b, j) => styleChip(b, j === i));
        gbtns.forEach((b) => styleChip(b, false, true));
      };
      const setNode = (i) => {
        const g = GALLERY[i];
        if (!g.m) { g.m = new THREE.MeshBasicNodeMaterial(); g.apply(THREE.TSL, g.m, { clock: t }); }
        showEntry(g.m, GAL_CODES[g.id] || '', g.family + ' · ' + (GAL_META[g.id] || ''));
        gbtns.forEach((b, j) => styleChip(b, j === i, true));
        btns.forEach((b) => styleChip(b, false));
      };
      const mkChip = (label, small) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'cursor:pointer;font-family:' + MONO + ';font-size:' + (small ? '9px' : '10px') +
          ';letter-spacing:.1em;color:#9AA7BC;background:transparent;border:1px solid rgba(255,255,255,.14);' +
          'border-radius:20px;padding:' + (small ? '4px 9px' : '7px 13px') + ';transition:all .25s';
        return b;
      };
      mats.forEach((entry, i) => {
        const b = mkChip(entry.name);
        b.addEventListener('click', () => setMat(i));
        chips.appendChild(b); btns.push(b);
      });
      // ---- node gallery drawer (generated; lazy shader builds on click)
      const galToggle = D('cursor:pointer;font-family:' + MONO + ';font-size:9px;letter-spacing:.2em;color:#9AA7BC;padding:2px 0;user-select:none;transition:color .25s');
      galToggle.setAttribute('data-galtoggle', '1');
      const galWrap = D('display:none;flex-direction:column;gap:6px;max-height:170px;overflow:auto;padding:2px 0');
      const galLabel = (open) => (open ? '▾' : '▸') + ' NODE GALLERY · ' + GALLERY.length + ' VERIFIED NODES';
      galToggle.textContent = galLabel(false);
      let galOpen = false;
      galToggle.addEventListener('click', () => {
        galOpen = !galOpen;
        galWrap.style.display = galOpen ? 'flex' : 'none';
        galToggle.textContent = galLabel(galOpen);
        galToggle.style.color = galOpen ? '#57D4FF' : '#9AA7BC';
      });
      [...new Set(GALLERY.map((g) => g.family))].forEach((fam) => {
        const row = D('display:flex;flex-wrap:wrap;gap:6px;align-items:center');
        const lab = D('font-family:' + MONO + ';font-size:8px;letter-spacing:.18em;color:#5C6678;min-width:56px');
        lab.textContent = fam;
        row.appendChild(lab);
        GALLERY.forEach((g, i) => {
          if (g.family !== fam) return;
          const b = mkChip(g.name, true);
          b.setAttribute('data-galchip', '1');
          b.addEventListener('click', () => setNode(i));
          row.appendChild(b); gbtns[i] = b;
        });
        galWrap.appendChild(row);
      });
      panel.insertBefore(galToggle, badge);
      panel.insertBefore(galWrap, badge);
      setMat(0);`;
tpl = tpl.slice(0, b0) + drawer + tpl.slice(b1 + btnsEnd.length);

writeFileSync(TEMPLATE, tpl);
console.log(`lab build injected: ${LIB_FILES.length} lib files + ${MATERIALS.length} materials, ` +
  `${(inlined.length / 1024).toFixed(1)} KB inlined. Now run: python tools/pack.py`);
