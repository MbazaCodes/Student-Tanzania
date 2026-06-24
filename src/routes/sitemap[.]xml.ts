import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const BASE = "https://tsid.go.tz";
        const today = new Date().toISOString().slice(0, 10);
        const entries = [
          { path: "/",       changefreq: "weekly",  priority: "1.0", lastmod: today },
          { path: "/search", changefreq: "monthly", priority: "0.8", lastmod: today },
          { path: "/auth",   changefreq: "yearly",  priority: "0.3", lastmod: today },
        ];
        const urls = entries.map((e) =>
          `  <url>\n    <loc>${BASE}${e.path}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
        ).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
