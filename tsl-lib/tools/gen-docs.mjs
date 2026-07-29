// gen-docs — generate docs/NODES.md from REGISTRY.json + src doc blocks.
// The registry is the single source of truth; this file is a rendering of it.
//   node tools/gen-docs.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = dirname(fileURLToPath(import.meta.url));
const LIB = dirname(TOOLS);
const SRC = join(LIB, 'src');
const registry = JSON.parse(readFileSync(join(LIB, 'docs', 'REGISTRY.json'), 'utf8'));

// index all src files: path, text, first doc block, exports
const files = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) {
      const text = readFileSync(p, 'utf8');
      const doc = (text.match(/\/\*\*([\s\S]*?)\*\//) || [null, ''])[1];
      const firstLine = (doc.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim())
        .find((l) => l.length) || '');
      const exports = [...text.matchAll(/export const (\w+)/g)].map((m) => m[1]);
      files.push({ path: p.replace(LIB + '\\', '').replace(/\\/g, '/'), text, firstLine, exports });
    }
  }
};
walk(SRC);

const fileFor = (id) => {
  const [family, rest] = id.split('/');
  const name = rest.split('@')[0];
  return files.find((f) => f.path === `src/${family}/${name}.js`) ||
         files.find((f) => f.path.startsWith(`src/${family}/`) && f.exports.includes(name)) ||
         null;
};

const fmt = (v, d = 2) => (v == null ? '—' : (+v).toFixed(d));
const CLASSES = ['①', '②', '③', '④', '⑤'];
const B = registry._baseline || {};

const ids = Object.keys(registry).filter((k) => !k.startsWith('_')).sort();
const families = [...new Set(ids.map((id) => id.split('/')[0]))].sort();

let md = `# tsl-lib nodes

> **GENERATED** by \`tools/gen-docs.mjs\` from \`docs/REGISTRY.json\` — do not edit.
> Regenerate after any \`verify-all\` run. Methodology: [COST-METHOD.md](COST-METHOD.md).

Baseline: **${B.gpu || '?'}** · ${B.browser || '?'} · ${B.os || '?'} · three ${B.three || '?'} · measured ${B.date || '?'}

`;

for (const family of families) {
  md += `## ${family}\n\n`;
  md += `| Node | Class | gpuMs (p95) | wall wgpu/wgl2 | Impl wgsl/glsl | Parity | Mobile | Verified |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const id of ids.filter((i) => i.split('/')[0] === family)) {
    const e = registry[id];
    const f = fileFor(id);
    const c = e.cost || {};
    const wall = c.wallMs ? `${fmt(c.wallMs.webgpu, 1)}/${fmt(c.wallMs.webgl2, 1)}` : '—';
    const impl = e.impl ? `${e.impl.webgpu || '?'}/${e.impl.webgl2 || '?'}` : '—';
    const parity = e.parity ? (e.parity.pass ? `✓ ${e.parity.diffPct}%` : '✗') : '—';
    const mobile = c.mobileWallMs != null ? `${fmt(c.mobileWallMs, 1)} ms${e.mobileOverBudget ? ' ⚠' : ''}` : '—';
    md += `| \`${id}\` | ${c.costClass ? CLASSES[c.costClass - 1] : '—'} | ` +
      `${fmt(c.gpuMs)} (${fmt(c.gpuP95)}) | ${wall} | ${impl} | ${parity} | ${mobile} | ${e.verified || '—'} |\n`;
  }
  md += `\n`;
  for (const id of ids.filter((i) => i.split('/')[0] === family && !i.includes('@'))) {
    const f = fileFor(id);
    if (f && f.firstLine) md += `- \`${id}\` — ${f.firstLine.replace(/^\w+ — /, '')} *(${f.path})*\n`;
  }
  md += `\n`;
}

// src files with no registry presence — visible completeness pressure
const covered = new Set(ids.map((id) => fileFor(id)).filter(Boolean).map((f) => f.path));
const uncovered = files.filter((f) => !covered.has(f.path));
if (uncovered.length) {
  md += `## Not yet bench-verified\n\nDoc'd in source; no registry entry (JS helpers, adapters, or pending bench wiring):\n\n`;
  for (const f of uncovered) md += `- \`${f.path}\` — ${f.firstLine || '(no doc block)'}\n`;
}

writeFileSync(join(LIB, 'docs', 'NODES.md'), md);
console.log(`NODES.md: ${ids.length} registry entries, ${families.length} families, ${uncovered.length} unregistered source files`);
