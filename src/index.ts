import landingHtml from "./landing.html";
import wasmModule from "./wasm/constraint_theory_core_wasm_bg.wasm";
import { initSync, PythagoreanManifold } from "./wasm/constraint_theory_core_wasm.js";

let wasmInitialized = false;
const manifoldCache = new Map<number, InstanceType<typeof PythagoreanManifold>>();

function ensureWasm(): void {
  if (!wasmInitialized) {
    initSync(wasmModule);
    wasmInitialized = true;
  }
}

function getManifold(density: number): InstanceType<typeof PythagoreanManifold> {
  let m = manifoldCache.get(density);
  if (!m) {
    m = new PythagoreanManifold(density);
    manifoldCache.set(density, m);
  }
  return m;
}

const ALLOWED_DENSITIES = new Set([50, 200, 500]);

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/snap" && request.method === "POST") {
      ensureWasm();

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "malformed request body" }, { status: 400 });
      }

      if (typeof body !== "object" || body === null) {
        return Response.json({ error: "request body must be a JSON object" }, { status: 400 });
      }

      const { x: rawX, y: rawY, density: rawDensity } = body as Record<string, unknown>;
      const x = Number(rawX);
      const y = Number(rawY);
      const density = ALLOWED_DENSITIES.has(Number(rawDensity)) ? Number(rawDensity) : 200;

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return Response.json({ error: "x and y must be finite numbers" }, { status: 400 });
      }

      const manifold = getManifold(density);
      const validation = manifold.validate_input(x, y);
      if (validation) {
        return Response.json({ error: validation }, { status: 400 });
      }

      try {
        const result = manifold.snap(x, y);
        return Response.json({
          snapped: Array.from(result.snapped as Float32Array),
          noise: result.noise,
          stateCount: manifold.state_count(),
          density,
        });
      } catch {
        return Response.json({ error: "snap computation failed for this input" }, { status: 400 });
      }
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(landingHtml, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "content-security-policy":
            "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self'",
          "x-content-type-options": "nosniff",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
