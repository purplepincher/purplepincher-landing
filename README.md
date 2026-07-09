# purplepincher-landing

The Cloudflare Worker that serves **[purplepincher.org](https://purplepincher.org)** —
the PurplePincher org's public landing page.

It is a single Worker with one job: serve a hand-written landing page, and back
that page's interactive demo with a real computation. The demo is not a mockup —
it runs the actual `constraint-theory-core` Rust crate, compiled to WebAssembly,
inside the Worker on every drag.

> **Honesty convention used throughout this org's docs.** Every capability claim
> is tagged so you know what to trust:
> - ✅ **real today** — traced to working code in this repo
> - ⚠️ **real but conditional** — works, but needs something external
> - 🔮 **aspirational / later phase** — a direction, not implemented

This README was written by reading `src/index.ts`, `src/landing.html`, and the
vendored WASM glue in `src/wasm/` — not by trusting the landing page's own copy.

---

## What this repo actually is

A small TypeScript Cloudflare Worker. Three files do all the work:

| File | Role |
|------|------|
| `src/index.ts` | Worker entrypoint. Routes requests, runs WASM, sends responses. |
| `src/landing.html` | The landing page (HTML + CSS + a `<canvas>` demo). Imported into the Worker as a text module. |
| `src/wasm/` | A vendored copy of the `constraint-theory-core` crate, compiled to WebAssembly with `wasm-bindgen`/`wasm-pack`, plus the generated JS glue. |

Config: `wrangler.jsonc`. There is exactly one route,
`purplepincher.org/*`, bound to Cloudflare zone `cd520b5467dff7c50d10e76d807f2a59`.

### What is *not* here

- ✅ There is **no test suite**. `package.json`'s `test` script is the npm
  default stub (`echo "Error: no test specified" && exit 1`). The Worker has no
  unit tests of its own. Verification today is `wrangler deploy --dry-run`
  (which compiles cleanly — see [Development](#development)) plus the live demo
  itself.
- ✅ There is **no build step you run here**. The WASM in `src/wasm/` was
  produced by the `constraint-theory-core` crate's own build and is committed as
  a static binary. To change the WASM you re-build it in that crate and copy the
  artifacts here.

---

## What the Worker does (every route, traced to code)

All routing lives in the `fetch` handler in `src/index.ts`.

### `POST /api/snap`  ✅ real today

The computation behind the landing page's "drag the point" demo.

**Request** — a JSON object:

```json
{ "x": 0.3846, "y": 0.9231, "density": 200 }
```

**Response (200)** — the snapped vector plus metadata:

```json
{
  "snapped": [0.3846, 0.9231],
  "noise": 0.000000,
  "stateCount": 40384,
  "density": 200
}
```

What actually happens, in order (`src/index.ts`):

1. ✅ The WASM module is initialized **once** via `ensureWasm()` → `initSync()`.
   A module-level `wasmInitialized` flag guards against re-init.
2. ✅ The request body is parsed as JSON; a parse failure or non-object body
   returns `400`.
3. ✅ `x` and `y` are coerced with `Number(...)` and checked with
   `Number.isFinite()`. Non-finite values return `400`.
4. ✅ `density` is checked against an **allowlist** — `ALLOWED_DENSITIES = new
   Set([50, 200, 500])`. Anything not in that set silently falls back to `200`
   (it does *not* error). This is a real input guard: unbounded density would
   make the manifold precompute an arbitrarily large lattice.
5. ✅ `PythagoreanManifold.validate_input(x, y)` runs; if it returns a string,
   that string is returned as a `400` error.
6. ✅ `PythagoreanManifold.snap(x, y)` runs and its `{ snapped, noise }` result
   is returned together with `manifold.state_count()` and the resolved density.

**Manifold cache** ✅ — `manifoldCache` is a module-level `Map<number,
PythagoreanManifold>`. Constructing a manifold is expensive (it precomputes
every valid Pythagorean triple up to the density), so one instance is built and
reused per density value and kept alive for the Worker isolate's lifetime. This
is a real performance optimization and it is entirely undocumented outside this
README.

**Error responses:**

| Status | When |
|--------|------|
| `400` | Body is not valid JSON |
| `400` | Body is not a JSON object |
| `400` | `x` or `y` is not finite |
| `400` | `validate_input()` rejects the vector (e.g. zero vector) |
| `400` | `snap()` throws (caught generically) |

> ⚠️ Note on `density`: an unrecognized density does **not** produce an error. It
> is silently coerced to `200`. If you call the API directly and pass
> `density: 9999` expecting a finer lattice, you will get the `200` result and
> the response's `density` field will tell you so.

### `GET /` and `GET /index.html`  ✅ real today

Returns `src/landing.html` as `text/html; charset=utf-8` with:

- A strict **Content-Security-Policy** (✅ real, documented below in
  [Security headers](#security-headers)).
- `cache-control: public, max-age=300` (5 minutes).
- `x-content-type-options: nosniff`.

### `GET /favicon.svg` and `GET /favicon.ico`  ✅ real today

Returns the same inline SVG (a dark "shell" rounded square with a magenta claw
mark and a cream pincer), served as `image/svg+xml` with
`cache-control: public, max-age=86400` (1 day). Both paths return the identical
SVG; there is no separate `.ico`. The SVG is generated inside the handler as a
string, so the Worker ships no separate favicon asset.

### Everything else  ✅ real today

Any other path returns `404 Not found` with a plain-text body.

---

## The interactive demo

The landing page contains a `<canvas id="snapCanvas">`. Its script (inline in
`src/landing.html`) does the following — all real and traced:

- ✅ On pointer-down / drag / touch, the canvas coordinate is converted to a
  normalized 2D vector and `POST`ed to `/api/snap`.
- ✅ The response drives a live readout: input vector, snapped vector, noise,
  and state count. The state-count element (`40,384` in the static HTML) is
  **overwritten on the first successful call** with the real
  `data.stateCount.toLocaleString()` from the WASM.
- ✅ Three density buttons (50 / 200 / 500) re-snap the current vector.
- ✅ The snapped point, input point, axes, and a unit circle are drawn on the
  canvas.

### One nuance worth knowing: the "Triple" readout is not WASM-authoritative

The demo shows a **Triple** field (e.g. `5–12–13`). Be aware of where that label
comes from:

- The WASM `snap()` returns only `{ snapped: [x,y], noise }`. It does **not**
  return which Pythagorean triple was matched.
- The triple label is computed **client-side** by `findTriple()` in the page
  script, which checks the snapped vector against a **hardcoded list of 12
  triples** (`3-4-5, 5-12-13, 8-15-17, 7-24-25, …`) and returns the closest one
  *if* it is within `0.01`, otherwise the literal string
  `(higher-order triple)`.

So:

- ✅ The **snapped coordinates and noise** are authoritative WASM output.
- ⚠️ The **triple label** is a best-effort human label. At density 200 and 500
  the lattice contains many triples not in the 12-entry list, so those drags
  will correctly show `(higher-order triple)`. This is honest behavior, but the
  label should not be read as "the WASM told us this triple."

---

## Security headers  ✅ real today

The `/` and `/index.html` response ships this CSP (from `src/index.ts`):

```
default-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com;
connect-src 'self' https://cloudflareinsights.com;
img-src 'self';
```

Notes a reviewer should understand:

- ⚠️ `script-src` includes `'unsafe-inline'` because the demo script is an
  inline `<script>` in `landing.html`. If you wanted to drop `'unsafe-inline'`,
  you would first need to externalize that script into a separate file served by
  the Worker (it does not do this today).
- `'unsafe-inline'` on `style-src` is there because the page is one self-contained
  HTML file with an inline `<style>` block.
- `connect-src 'self' https://cloudflareinsights.com` permits the demo's own
  `/api/snap` call plus Cloudflare Web Analytics. ✅ Confirmed: the only
  in-page `fetch` is to `/api/snap`.
- ✅ `x-content-type-options: nosniff` is set on the HTML response.

---

## What the WASM exposes vs. what this Worker uses

The vendored WASM (see `src/wasm/constraint_theory_core_wasm.d.ts` for the full
surface) exports more than this Worker touches. This is easy to misread, so it's
spelled out:

| WASM export | Used by this Worker? |
|-------------|----------------------|
| `PythagoreanManifold` (constructor, `snap`, `validate_input`, `state_count`) | ✅ Yes |
| `PythagoreanManifold.snap_checked` | ❌ No (the Worker uses `snap` + its own `validate_input` call) |
| `PythagoreanManifold.max_angular_error` | ❌ No |
| `PythagoreanManifold.recommended_noise_threshold` | ❌ No |
| `KDTree` | ❌ No |
| `PythagoreanTriple` | ❌ No |
| `RicciFlow` | ❌ No |
| `hidden_dimensions`, `max_angular_error_for_states`, `ricci_flow_step`, `version` | ❌ No |

In other words: the Worker is a thin, deliberate slice of a larger crate. The
other exports are real and functional in the WASM, but this Worker does not
expose them over HTTP. 🔮 If you wanted a `/api/version` or a
`/api/recommended-threshold` endpoint, the building blocks already exist in the
binary — they are simply not wired up.

---

## Development

Prerequisites: Node.js and `wrangler` (declared as a devDependency, `^4.107.0`).

```bash
npm install
npx wrangler dev      # local dev server on http://localhost:8787
```

To check the bundle compiles without deploying:

```bash
npx wrangler deploy --dry-run --outdir /tmp/pp-build
```

This currently succeeds (≈104 KiB upload, ≈35 KiB gzipped). The only warnings are
Wrangler noting that the custom module `rules` in `wrangler.jsonc` (for
`*.html` as `Text` and `*.wasm` as `CompiledWasm`) do not set `fallthrough`,
which shadows Wrangler's default rules. Functionally harmless here because the
custom rules are exactly what's intended; set `fallthrough: false` to silence.

### `wrangler.jsonc` module rules — what they do

```jsonc
"rules": [
  { "type": "Text", "globs": ["**/*.html"] },          // import .html as a string
  { "type": "CompiledWasm", "globs": ["**/*.wasm"] }   // import .wasm as WebAssembly.Module
]
```

- ✅ `Text` is what lets `src/index.ts` do `import landingHtml from "./landing.html"`
  and get the file's contents as a string.
- ✅ `CompiledWasm` is what lets it do `import wasmModule from "./wasm/...wasm"`
  and get a pre-compiled `WebAssembly.Module` — which is why `initSync(wasmModule)`
  works synchronously with no `fetch`/`arrayBuffer` step.

See [`EDUCATIONAL_NOTES.md`](./EDUCATIONAL_NOTES.md) for a deeper walkthrough of
this bundling pattern and the module-level caching it enables.

---

## Deploying

```bash
npx wrangler deploy
```

⚠️ This requires a Cloudflare account authenticated to the `purplepincher.org`
zone (zone id in `wrangler.jsonc`). The route `purplepincher.org/*` is already
declared, so a successful deploy publishes to production immediately — there is
no staging route configured.

---

## A note on the landing page's own claims

`src/landing.html` makes a number of statements about **sibling repositories**
in the `purplepincher` org and about live domains. For example it lists
constraint-theory-core as "262 passing tests", plato-semantic-search as "74
passing tests", and several repos/domains as "deployed" or "field-tested".

These claims are **not verifiable from inside this repo** — they are assertions
about other codebases and external sites. They may well be accurate, but this
README makes no guarantee about them, because this repo's source contains
nothing that exercises or counts those tests. If you need to confirm them, check
each sibling repo directly.

Likewise, the page footer links to `ROADMAP.md` and `docs/PARADIGM.md` in the
separate `purplepincher/purplepincher` repository, not in this one.

---

## License

`package.json` declares `"license": "ISC"`.
