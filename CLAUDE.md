# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

The production source for the **Aurelius Dynamic** site (`aureliusdynamic.com`) — a
static site with no build step and no runtime dependencies — plus the TSL node
library it shares with the studio's other projects.

The landing page is **one self-contained 1.4 MB `index.html`**: markup, CSS, JS,
fonts, and two three.js r178 builds are all inlined. There is no bundler and no
CDN. Sub-pages (`philosophy/`, `privacy/`, `roadmap/`, `cases/`, `capabilities/`)
are separate plain `index.html` files sharing `pages.css`.

## Repository boundaries — read this before editing anything

The working directory contains **four separate git repositories**. This is the
single most important structural fact here.

| Path | Repo | Tracked by root? |
| --- | --- | --- |
| `.` (site, `tsl-lib/`) | `ZachBach/AureliusDynamic` | yes |
| `echoGalaxy/` | `ZachBach/echoGalaxy` | **no** — gitignored |
| `Zookahs-Casino/` | separate repo | **no** — gitignored |
| `helixPulse/` | `ZachBach/pulsemask` | **no** — gitignored |

- `tsl-lib/` **is** part of the root repo, despite echoGalaxy's CLAUDE.md
  describing it as "a sibling repo, not part of this checkout". Both statements
  are true from their own vantage point: echoGalaxy sees it as `../tsl-lib`.
- Commits in the three nested repos go to their own remotes. Never `git add`
  from the root expecting to capture them.
- **`helixPulse/` is PulseMask.** The folder name and the repo name differ on
  purpose — the repo, the GitHub Pages path and the product are all
  `pulsemask`, while the local folder stays `helixPulse` because tooling is
  keyed to that path. Do not "fix" either name. It was missing from
  `.gitignore` until 2026-09-05, so older clones may still see it as untracked.
- `echoGalaxy/CLAUDE.md` governs work inside that directory and takes precedence
  there.

## The single-file bundle — never hand-edit `index.html`

`index.html` is generated. Editing it directly will be overwritten and can break
the encoding contract. The round-trip is the only supported path:

```bash
python tsl-lib/tools/extract.py            # decode -> tsl-lib/build/template.html
python tsl-lib/tools/extract.py --assets   # + decode three.js builds -> bench/vendor/
python tsl-lib/tools/extract.py --check    # prove encode(decode(x)) == x byte-for-byte
# ... edit tsl-lib/build/template.html ...
python tsl-lib/tools/pack.py --dry         # preview the splice
python tsl-lib/tools/pack.py               # write index.html
```

Encoding contract shared by both scripts:
`json.dumps(template, ensure_ascii=False).replace("<", "\\u003C")`.
Run `--check` after any three.js or bundler change before trusting an edit
session. `tsl-lib/build/` and `tsl-lib/bench/vendor/` are generated and
gitignored — **the bundle is the source of truth**, including for the embedded
three.js r178 builds.

## The Lab apps under `/helix/`, `/ikos/`, `/galaxy/`, `/shader-lab/`

These are **deployed build output copied in**, not source. Edit the upstream
project, rebuild, copy the result. For `galaxy/` that upstream is `echoGalaxy/`:
its `vite.config.js` sets `base: './'` precisely so the same build serves both
standalone and from a subdirectory. The copy step is manual — no script
automates `echoGalaxy/dist` → `galaxy/`.

## tsl-lib — the shared node library

118 modules under `tsl-lib/src/<family>/` — `materials` 72, `pattern` 16,
`noise` 11, `fresnel` 7, `ramp` 6, `util` 6, plus `noise/adapters/`. Consumed
two ways: inlined into the landing bundle's Lab section, and vendored one-way
into `echoGalaxy/src/tsl-lib/`.

⚠ **18 materials are unregistered.** As of 2026-09-05 these have a module in
`src/materials/` but no `REGISTRY.json` entry and no entry in
`bench/nodes.mjs`: `amber`, `basaltColumn`, `bioluminescence`, `butterflyWing`,
`diffractionGrating`, `geode`, `honeycomb`, `iris`, `labradorite`, `leafVein`,
`lichen`, `lightningArc`, `moonstone`, `mycelium`, `obsidian`, `photoelastic`,
`pyrite`, `strata`. Because `NODES.md`, the Lab badges and the gallery are all
generated from the registry, they are invisible to every generated surface.
Closing this is the five-step pipeline in `tools/README.md` per material —
bench entry, then `verify-all`, then regenerate — **not** a text edit. Never
hand-write a cost number.

Registry keys are **logical node ids, not file paths**, and the two do not
always line up: `noise/worley.js` registers as `noise/worleyF1` *and*
`noise/worleyF1F2`, `src/pattern/grid.js` registers as both `pattern/grid` and
`pattern/hexGrid`, and `materials/dissolveMat.js` registers as
`materials/dissolve`. Comparing filenames against registry keys therefore
produces false drift — compare exports.

The contract that makes this portable — full rules in
[`tsl-lib/docs/CONVENTIONS.md`](tsl-lib/docs/CONVENTIONS.md):

- **Nodes import nothing.** Every factory takes the TSL namespace as its first
  argument: `fresnel(TSL, opts)`. This is what lets the same file run against a
  vendor file in the bench and a blob-URL module inside the bundle.
- **Domain input is positional, tunables are an options object**:
  `(TSL, p, opts)` for field samplers, `(TSL, opts)` for nodes with no domain.
  Every tunable has a default.
- **Nodes never own uniforms and never bake `time`.** Callers pass both in;
  `make<Thing>` helpers return uniforms for the caller to hold.
- **Each module exports `source()`** returning the readable snippet the Lab
  displays. It lives in the same file and changes in the same commit — registry
  validation rejects display text that does not come from the module.
- **Brand colors come only from `src/util/palette.js`**, never hex literals.
- **three.js is pinned to r178**, the build embedded in the bundle. A node may
  only import symbols present in `docs/tsl-exports.json`. Upgrading is a
  deliberate backlog item, never a side effect.

`docs/REGISTRY.json` is the single source of truth for status, parity, and cost.
`NODES.md`, Lab badges, and the gallery are **generated** from it — do not
hand-edit anything the registry can produce.

### tsl-lib commands

```bash
cd tsl-lib/bench && npm install     # once (puppeteer-core)
node run.mjs                        # full matrix: every node x {webgpu, webgl2}
node run.mjs fbm-mx webgl2          # one combo
node bench/verify-all.mjs mat-<name>   # parity + cost for one entry -> REGISTRY
node tools/gen-docs.mjs             # regenerate NODES.md from the registry
node tools/verify-site.mjs after    # hero + Lab smoke, both backends, error gate
```

Interactive bench: `python -m http.server 8631` from `tsl-lib/`, then
`http://localhost:8631/bench/index.html?node=fbm-mx&backend=webgl2&geo=knot`
(`geo` = `knot | quad | sphere`).

Shipping a new material to the Lab is a five-step generated pipeline (write
module → bench entry + verify → `MATERIALS` in `tools/build-lab.mjs` → extract /
build-lab / pack → `verify-site.mjs after`). Full steps in
[`tsl-lib/tools/README.md`](tsl-lib/tools/README.md).

## Running the site locally

Fully static — open `index.html` directly, or for production-matching paths:

```bash
python -m http.server 8000
```

## Deployment

**Vercel. Settled 2026-09-05 against the Vercel API — do not re-open this.**
Project `aurelius-dynamic-solutons` (`prj_5cKtt97dREXJsEWXCKM8W0BOagXs`, team
`team_geqm9s2t1yFYmrb2gwi1i4qI`) is git-linked to `ZachBach/AureliusDynamic` and
holds both `aureliusdynamic.com` and `www.aureliusdynamic.com`. Pushing to
`master` deploys. There is no `vercel.json` or `.vercel/` because
git-integration deploys need neither.

`CNAME` and `.nojekyll` are **inert leftovers** from the original GitHub Pages
setup. They are harmless under Vercel and are kept only so a Pages fallback
stays one setting away; do not treat them as evidence of the deploy target.

`.well-known/assetlinks.json` holds the Digital Asset Links stub for the
echoGalaxy Android TWA (`com.aureliusdynamic.echogalaxy`); the SHA-256
fingerprint is still a placeholder pending Play Console signup.

## Privacy constraint on the landing page

The landing page makes **no external runtime requests**, with one deliberate
exception: the hero Earth fetches live weather from Open-Meteo client-side (no
key, no account, no personal data) and falls back silently to a procedural storm
pattern. The contact form opens a pre-addressed `mailto:` draft. Preserve this —
no analytics, no cookies, no backend.

Two notes on how that guarantee is actually held:

- The landing page carried `<link rel="preconnect">` tags to
  `fonts.googleapis.com` and `fonts.gstatic.com` until 2026-09-05. Every face is
  inlined, so they fetched nothing and only opened a DNS/TCP/TLS handshake with
  a third party. **Removed — do not re-add.**
- ⚠ **The guarantee does not currently extend to the sub-pages.** All six
  (`philosophy/`, `capabilities/`, `cases/`, `roadmap/`, `privacy/`,
  `shader-lab/`) still link a `fonts.googleapis.com` stylesheet, which hands
  Google the visitor's IP — including on `/privacy/` itself, which does not
  disclose it. Open item: either self-host the three families next to
  `pages.css` (the fonts already ship inside the bundle, so the woff2 payloads
  are recoverable from it) or disclose the third party on `/privacy/`.
  Self-hosting is the studio's precedent — PulseMask vendored its fonts for
  exactly this reason.

## `.claude/commands/`

Three legal-workflow commands (`brief`, `compliance-check`, `triage-nda`) are
tracked and shared. `.claude/settings.local.json` is machine-local and
gitignored.
