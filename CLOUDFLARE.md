# Cloudflare Pages

Import the existing GitHub repository manuelfal2006-blip/eleven-studio.

- Production branch: main
- Framework preset: None
- Build command: node scripts/build-cloudflare.mjs
- Output directory: dist
- Environment variable SITE_URL: the actual public HTTPS origin assigned to the Pages project, without a trailing path

The build copies only public site files, updates absolute SEO URLs, adds the project gallery to the sitemap and creates a real 404 page. It does not publish documentation or build scripts.

The source remains compatible with Netlify. On Cloudflare, the existing form safely prepares an email until a replacement form backend has been configured and tested. Netlify Forms and its notifications are not transferred automatically.

Before announcing the migration: test every route, configure and test the new form provider, update legal disclosures, verify the new Search Console property and sitemap, update scheduled checks, and update all shared site links. The old netlify.app hostname belongs to Netlify and cannot be hosted on Cloudflare. Redirects from that hostname require access to an operational Netlify deployment.
