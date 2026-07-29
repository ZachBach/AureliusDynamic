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
];

const strip = (relPath, renameApply = null) => {
  let t = readFileSync(join(LIB, 'src', relPath), 'utf8');
  t = t.replace(/\/\*\*[\s\S]*?\*\//g, '');          // doc blocks (bundle size)
  t = t.replace(/^import .*$/gm, '');                 // imports (inlined instead)
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

writeFileSync(TEMPLATE, tpl);
console.log(`lab build injected: ${LIB_FILES.length} lib files + ${MATERIALS.length} materials, ` +
  `${(inlined.length / 1024).toFixed(1)} KB inlined. Now run: python tools/pack.py`);
