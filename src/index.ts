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

    if (url.pathname === "/favicon.svg" || url.pathname === "/favicon.ico") {
      // Family ink ground, claw-magenta pincer mark. Served inline so the
      // Worker stays hermetic (no new assets, no new origins).
      const faviconSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
        `<rect width="64" height="64" rx="14" fill="#0E1A1C"/>` +
        `<path d="M32 50 C20 50 13 41 13 31 C13 20 21 13 30 13 C25 18 24 23 26 27 C21 29 19 34 22 39 C25 44 31 45 35 42 C38 46 36 49 32 50 Z" fill="#A8548C"/>` +
        `<path d="M38 34 C34 30 34 24 38 20 C42 16 48 16 51 19 L44 27 L51 34 C48 38 42 38 38 34 Z" fill="#F0E9D8"/>` +
        `</svg>`;
      return new Response(faviconSvg, {
        headers: {
          "content-type": "image/svg+xml",
          "cache-control": "public, max-age=86400",
        },
      });
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
