# tsl-lib tools

The landing site is a single self-extracting `index.html` at the repo root;
these scripts are the only supported way to edit it. Requires Python 3 and
(for the bench) Node + Chrome.

## Bundle round-trip

```
python tools/extract.py            # decode template -> build/template.html
python tools/extract.py --assets   # + decode three.js builds -> bench/vendor/
python tools/extract.py --check    # prove encode(decode(x)) == x, byte-for-byte
# ... edit build/template.html ...
python tools/pack.py --dry         # preview the splice
python tools/pack.py               # write index.html
```

The encoding contract (both scripts share it):
`json.dumps(template, ensure_ascii=False).replace("<", "\\u003C")`.
`--check` verifies this reproduces the committed bundle exactly; run it after
any three.js/bundler change before trusting an edit session.

`build/` and `bench/vendor/` are generated and gitignored — the bundle is the
source of truth for both the page and the embedded three.js r178 builds.

## Bench

```
cd tsl-lib/bench
npm install          # once (puppeteer-core)
node run.mjs                 # full matrix: every node x {webgpu, webgl2}
node run.mjs fbm-mx webgl2   # one combo
```

The runner serves `tsl-lib/` itself, screenshots each combo into
`bench/shots/`, fails on any console error or backend mismatch, and
regenerates `docs/tsl-exports.json` (the audited TSL import surface +
runtime `THREE.REVISION`).

Interactive: `python -m http.server 8631` from `tsl-lib/`, then open
`http://localhost:8631/bench/index.html?node=fbm-mx&backend=webgl2&geo=knot`
(`node` = entry in `bench/nodes.mjs`; `geo` = `knot | quad | sphere`).
