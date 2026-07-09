# Educational Notes — running a Rust WASM crate synchronously inside a Cloudflare Worker

This file explains one non-obvious decision in `purplepincher-landing` at more
depth than the README allows: **how a pre-compiled Rust WebAssembly module is
imported, initialized once, and reused across requests inside a single Cloudflare
Worker** — and the module-level caching pattern built on top of it.

It exists because this pattern is the load-bearing trick that makes the landing
page's "drag the point → real `constraint-theory-core` WASM snap" demo actually
fast, and it is not obvious from reading the Worker alone. Everything below is
traced to `src/index.ts`, `wrangler.jsonc`, and `src/wasm/`.

> Tags: ✅ real today · ⚠️ real but conditional · 🔮 aspirational / later phase

---

## The problem

The landing page wants every drag to call the *real* `constraint-theory-core`
crate (a Rust library that snaps 2D vectors onto exact Pythagorean triples). Two
things make that harder than it sounds on a Workers runtime:

1. **Construction is expensive.** `new PythagoreanManifold(density)` precomputes
   every valid Pythagorean triple up to `density` and builds a KD-tree over them.
   You absolutely do not want to do this on every request.
2. **Workers have no filesystem and no async `fetch` of a local asset by default.**
   The conventional browser pattern for `wasm-bindgen` — `await init(fetch(url))`
   — doesn't map cleanly onto a Worker serving its own page.

This repo solves both with a bundle-time import and two module-level caches.

---

## Step 1 — import the `.wasm` as a pre-compiled module, not bytes  ✅

`wrangler.jsonc` declares a module rule:

```jsonc
{ "type": "CompiledWasm", "globs": ["**/*.wasm"] }
```

That single line is what lets `src/index.ts` do:

```ts
import wasmModule from "./wasm/constraint_theory_core_wasm_bg.wasm";
```

and receive a **ready `WebAssembly.Module`**, not a byte buffer and not a fetch
promise. The compilation happened at *bundle* time, by Wrangler, from the
`.wasm` committed in `src/wasm/`.

### Why this matters

`wasm-bindgen`'s generated glue (`constraint_theory_core_wasm.js`) exposes two
init paths:

- `initSync(module)` — synchronous, takes a `WebAssembly.Module` or bytes. ✅
  This is what the Worker uses.
- `__wbg_init(module_or_path)` (the default export) — async, can take a URL and
  will `fetch()` it.

Because Wrangler hands over an already-compiled `Module`, the Worker can call the
**synchronous** `initSync` path and never has to await a fetch or decode bytes at
runtime. The same mechanism imports the landing page as a plain string:

```jsonc
{ "type": "Text", "globs": ["**/*.html"] }
```

```ts
import landingHtml from "./landing.html";   // → string
```

So the entire Worker is hermetic: one binary, no external asset fetches, no
separate static-file binding. (The inline SVG favicon in the handler exists for
the same reason — "served inline so the Worker stays hermetic", per the code
comment.)

⚠️ **The trade-off:** the WASM is a *vendored* artifact. It was built elsewhere
(in the `constraint-theory-core` crate via `wasm-pack`/`wasm-bindgen`) and copied
into `src/wasm/`. Updating the crate means rebuilding it there and replacing
these files; there is no build step in this repo that regenerates them.

---

## Step 2 — initialize exactly once per isolate  ✅

```ts
let wasmInitialized = false;

function ensureWasm(): void {
  if (!wasmInitialized) {
    initSync(wasmModule);
    wasmInitialized = true;
  }
}
```

`initSync` installs the WASM instance into a module-level `wasm` variable inside
the glue file. Calling it more than once is wasted work (the glue's `initSync`
is actually a no-op once `wasm !== undefined`, but the explicit flag makes the
intent unambiguous and avoids relying on that internal guard).

`ensureWasm()` is called lazily — only on the first `POST /api/snap`. The static
routes (`/`, `/favicon.svg`, the 404) never touch WASM, so they pay zero
initialization cost.

> 🔮 A subtlety about Workers lifetimes: a module-level `let` like
> `wasmInitialized` persists for the life of the *isolate*, not the request.
> Workers can recycle isolates, so the one-time init can legitimately re-run if
> a fresh isolate spins up. That's fine — `initSync` is cheap relative to a
> single manifold construction, which is why step 3 exists.

---

## Step 3 — cache the expensive object per density  ✅

This is the part that actually buys the performance, and it is easy to overlook:

```ts
const manifoldCache = new Map<number, InstanceType<typeof PythagoreanManifold>>();

function getManifold(density: number): InstanceType<typeof PythagoreanManifold> {
  let m = manifoldCache.get(density);
  if (!m) {
    m = new PythagoreanManifold(density);   // the expensive call
    manifoldCache.set(density, m);
  }
  return m;
}
```

`PythagoreanManifold` construction does all the triple generation and KD-tree
building **once**, then `snap()` is a cheap O(log N) lookup. The cache means:

- The first request at each of the three allowed densities (50, 200, 500) pays
  the construction cost once.
- Every subsequent request at that density reuses the same instance for the rest
  of the isolate's life.

Combined with the density allowlist (`ALLOWED_DENSITIES = new Set([50, 200,
500])`), the cache is also **bounded**: at most three manifolds can ever exist,
no matter what clients request. The allowlist isn't just input validation — it's
what makes the cache memory-bounded.

> ⚠️ This is genuinely a design decision worth copying: **the input allowlist and
> the cache are the same mechanism.** If you lifted the density restriction to
> accept arbitrary integers, you would also need to bound the cache (an LRU, a
> cap) or an attacker could force construction of unboundedly many manifolds.

---

## Why not just call `snap_checked`?

The WASM exposes both `snap()` (returns `{snapped, noise}`, throws on bad input)
and `snap_checked()` (returns `{snapped, noise}` or `{error: string}`, never
throws). The Worker deliberately does **not** use `snap_checked`. Instead it:

1. pre-checks `x`/`y` with `Number.isFinite()` (cheap, JS-side),
2. runs `manifold.validate_input(x, y)` to get a human-readable reason, and
3. wraps the `snap()` call in `try/catch` as a last resort.

This gives callers a specific `400` body (`validate_input`'s message) for the
common invalid cases, rather than a generic checked-error envelope. It's a small
but real API-design choice, not an accident.

---

## The shape this generalizes to

If you were building a similar Worker around a different expensive WASM object,
the pattern is:

1. **`CompiledWasm` module rule** → import the `.wasm` as a pre-built `Module`.
2. **`ensureWasm()` + a boolean flag** → run `initSync` once per isolate.
3. **A `Map` keyed by the construction parameter(s)** → reuse the expensive
   object across requests.
4. **An allowlist on those parameters** → keep the cache bounded and cap the
   worst-case construction cost.

Steps 3 and 4 are coupled by design: the cache is only safe to leave unbounded
*because* its keys come from a fixed allowlist.
