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

## Shipping a material to the Lab

The new-material pipeline (all generated, nothing hand-edited in the bundle):

1. Write `src/materials/<name>.js` — exports `name`, `apply(TSL, mat, {clock})`,
   `source()` (the Lab display snippet, same file as the impl).
2. Add a `materialEntry(...)` line in `bench/nodes.mjs` and run
   `node bench/verify-all.mjs mat-<name>` — parity + cost land in REGISTRY.
3. Add the material to `MATERIALS` in `tools/build-lab.mjs` (file, fn, id) and
   any new node dependencies to `LIB_FILES`.
4. `python tools/extract.py` → `node tools/build-lab.mjs` → `python tools/pack.py`.
   build-lab splices the inlined library + LAB_DEFS (source strings from the
   modules' `source()`, badges from the registry) between stable anchors in
   the Lab section; widget DOM / singleton / reattach / lazy-init untouched.
5. `node tools/verify-site.mjs after` — hero + Lab smoke on both backends,
   per-chip screenshots, console-error gate. For a pre-change baseline:
   `git show HEAD:index.html` into a temp dir and pass `--root=<dir>`.

Mobile: the Lab keeps the full widget on the 20k tier — one material at a
time on a 12.8k-tri knot is within budget (verified live ~16.7 ms mobile
viewport in the bench's mobile advisory pass).
