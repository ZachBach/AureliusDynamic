# tsl-lib

The studio's shared [TSL](https://threejs.org/docs/#api/en/nodes/) node library — 118 modules under [`src/`](src/) that compile on both WebGPU (WGSL) and WebGL2 (GLSL), each one benched and published with its measured cost.

It is part of the [Aurelius Dynamic](../README.md) repository, not a separate package. Two consumers today: the landing bundle's Lab section (inlined at pack time) and echoGalaxy (vendored one-way into `echoGalaxy/src/tsl-lib/`).

## Where to look

| Document | What it holds |
| --- | --- |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | **Start here.** The rules every module obeys, and why they make the code portable |
| [`docs/NODES.md`](docs/NODES.md) | **Generated.** Every verified node with cost class, parity, and measurement date |
| [`docs/REGISTRY.json`](docs/REGISTRY.json) | The single source of truth for status, parity, and cost. `NODES.md`, the Lab badges, and the gallery are generated from it |
| [`docs/COST-METHOD.md`](docs/COST-METHOD.md) | How the numbers are measured, and what they do and do not mean |
| [`docs/BACKEND-NOTES.md`](docs/BACKEND-NOTES.md) | Where WGSL and GLSL diverge, and the workarounds |
| [`docs/INVENTORY.md`](docs/INVENTORY.md) | The Phase 1 census: every primitive in the shipped hero, mapped to its library home |
| [`docs/tsl-exports.json`](docs/tsl-exports.json) | The symbols three r178 actually exports — a module may import nothing outside this |
| [`tools/README.md`](tools/README.md) | The five-step pipeline for shipping a new material to the Lab |
| [`BACKLOG.md`](BACKLOG.md) | What is planned, and what was deliberately deferred |

## The contract in six lines

Full rules in [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — these are the ones that bite first.

1. **Nodes import nothing.** Every factory takes the TSL namespace as its first argument: `fresnel(TSL, opts)`. This is what lets one file run against a vendor build in the bench and a blob-URL module inside the bundle.
2. **Domain input is positional, tunables are an options object** — `(TSL, p, opts)` for field samplers, `(TSL, opts)` for nodes with no domain. Every tunable has a default.
3. **Nodes never own uniforms and never bake `time`.** Callers pass both in; `make<Thing>` helpers return uniforms for the caller to hold.
4. **Each module exports `source()`**, returning the readable snippet the Lab displays. It lives in the same file and changes in the same commit — registry validation rejects display text that did not come from the module.
5. **Brand colors come only from [`src/util/palette.js`](src/util/palette.js)**, never hex literals.
6. **three.js is pinned to r178.** A module may only import symbols present in `docs/tsl-exports.json`. Upgrading is a deliberate backlog item, never a side effect.

## Commands

```bash
cd bench && npm install            # once (puppeteer-core)
node run.mjs                       # full matrix: every node x {webgpu, webgl2}
node run.mjs fbm-mx webgl2         # one combo
node bench/verify-all.mjs mat-<name>  # parity + cost for one entry -> REGISTRY
node tools/gen-docs.mjs            # regenerate NODES.md from the registry
node tools/verify-site.mjs after   # hero + Lab smoke, both backends, error gate
```

Interactive bench — serve the `tsl-lib/` directory and open the harness:

```bash
python -m http.server 8631
# http://localhost:8631/bench/index.html?node=fbm-mx&backend=webgl2&geo=knot
# geo = knot | quad | sphere
```

## A note on the registry

Registry keys are **logical node ids, not file paths**. One file can register several ids (`src/noise/worley.js` → `noise/worleyF1` and `noise/worleyF1F2`; `src/pattern/grid.js` → `pattern/grid` and `pattern/hexGrid`) and one id can differ from its filename (`src/materials/dissolveMat.js` → `materials/dissolve`). Diffing filenames against keys reports drift that is not there.

Real drift, as of 2026-09-05: **18 materials have a module but no registry entry and no bench entry** — `amber`, `basaltColumn`, `bioluminescence`, `butterflyWing`, `diffractionGrating`, `geode`, `honeycomb`, `iris`, `labradorite`, `leafVein`, `lichen`, `lightningArc`, `moonstone`, `mycelium`, `obsidian`, `photoelastic`, `pyrite`, `strata`. They are therefore absent from `NODES.md`, the Lab badges, and the gallery. Each needs the five-step pipeline in [`tools/README.md`](tools/README.md); a cost number is never written by hand.

## Generated, do not hand-edit

`build/` and `bench/vendor/` are generated and gitignored. `docs/NODES.md` is generated from the registry. The published `index.html` bundle is the source of truth for the embedded three.js builds.
