import indexHtml from "./index.html";
import howItWorksHtml from "./how-it-works.html";
import shellsHtml from "./shells.html";
import trustHtml from "./trust.html";
import startHtml from "./start.html";
import styleCss from "./style.css";

const PAGES: Record<string, string> = {
  "/": indexHtml,
  "/index.html": indexHtml,
  "/how-it-works": howItWorksHtml,
  "/how-it-works.html": howItWorksHtml,
  "/shells": shellsHtml,
  "/shells.html": shellsHtml,
  "/trust": trustHtml,
  "/trust.html": trustHtml,
  "/start": startHtml,
  "/start.html": startHtml,
};

const CSP =
  "default-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data:; " +
  "x-content-type-options: nosniff";

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "content-security-policy": CSP,
      "x-content-type-options": "nosniff",
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (path === "/favicon.svg" || path === "/favicon.ico") {
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

    if (path === "/style.css") {
      return new Response(styleCss, {
        headers: {
          "content-type": "text/css; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    const page = PAGES[path];
    if (page) return htmlResponse(page);

    return new Response("Not found", { status: 404 });
  },
};
