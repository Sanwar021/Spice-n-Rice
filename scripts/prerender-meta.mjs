import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../frontend/dist");
const template = readFileSync(resolve(dist, "index.html"), "utf8");
const site = (process.env.PUBLIC_SITE_URL || "https://spicenriceharun.com").replace(/\/$/, "");
const image = `${site}/images/design/food-0.webp`;
const pages = [
  ["", "Spice 'N' Rice · Indian Cuisine in Richardson", "Made-to-order Indian cuisine, generous biriyanis, and fresh naan in Richardson, Texas. Visit Spice 'N' Rice at 300 E. Terrace Drive."],
  ["menu", "Menu · Spice 'N' Rice", "Explore biriyanis, curries, grilled dishes, naan wraps, and more from Spice 'N' Rice in Richardson, Texas."],
  ["catering", "Catering · Spice 'N' Rice", "Plan a gathering with Spice 'N' Rice catering. Browse full and half trays, grilled dishes, and sides in Richardson, Texas."],
  ["about", "About · Spice 'N' Rice", "Get to know Spice 'N' Rice, a neighborhood Indian canteen serving Richardson since 2009."],
  ["contact", "Contact · Spice 'N' Rice", "Find Spice 'N' Rice at 300 E. Terrace Drive in Richardson, Texas. See our location, hours, and phone numbers."],
];
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
for (const [path, title, description] of pages) {
  const canonical = `${site}/${path}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(description)}"/>`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escape(title)}"/>`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escape(description)}"/>`);
  if (path) html = html.replace(/<link rel="preload" as="image"[^>]*\/>/, "");
  const social = `<link rel="canonical" href="${escape(canonical)}"/><meta property="og:url" content="${escape(canonical)}"/><meta property="og:image" content="${escape(image)}"/><meta property="og:site_name" content="Spice 'N' Rice"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/><meta name="twitter:image" content="${escape(image)}"/>`;
  html = html.replace("</head>", social + "</head>");
  const directory = resolve(dist, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(resolve(directory, "index.html"), html);
}
const modified = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([path]) => `  <url><loc>${site}/${path}</loc><lastmod>${modified}</lastmod></url>`).join("\n")}\n</urlset>\n`;
writeFileSync(resolve(dist, "sitemap.xml"), sitemap);
console.log(`Generated metadata for ${pages.length} public routes.`);
