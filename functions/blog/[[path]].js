const HEADER = "<header><a class=\"brand\" href=\"/\" aria-label=\"Eleven studio home\"><span class=\"mark\">11</span>eleven<span class=\"brand-sub\">studio</span></a><nav aria-label=\"Navigazione principale\"><a href=\"/#servizi\">Cosa facciamo</a><a href=\"/#metodo\">Come lavoriamo</a><a href=\"/blog/\">Articoli</a><a class=\"nav-contact\" href=\"/#contatti\">Parliamone</a></nav><details class=\"mobile-menu\"><summary>Menu</summary><nav aria-label=\"Navigazione mobile\"><a href=\"/#servizi\">Cosa facciamo</a><a href=\"/#metodo\">Come lavoriamo</a><a href=\"/blog/\">Articoli</a><a class=\"nav-contact\" href=\"/#contatti\">Parliamone</a></nav></details></header>";
const FOOTER = "<footer><a class=\"brand\" href=\"/\"><span class=\"mark\">11</span>eleven<span class=\"brand-sub\">studio</span></a><p>Siti web, CRM e AI. Nuove possibilità.</p><span>© 2026 Eleven studio</span><a class=\"footer-blog\" href=\"/blog/\">Leggi gli articoli</a><nav class=\"legal-links\" aria-label=\"Informazioni legali\"><a href=\"/privacy/\">Privacy</a><a href=\"/cookie/\">Cookie</a><a href=\"/termini/\">Termini e condizioni</a></nav></footer>";
const SAFE_TAGS = new Set('p h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i u s br hr a img figure figcaption table thead tbody tfoot tr th td div span'.split(' '));
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function safeUrl(value, origin, image = false) {
  if (!value) return null;
  try {
    const u = new URL(value, origin);
    if (u.username || u.password || !['https:', ...(image ? [] : ['http:', 'mailto:', 'tel:'])].includes(u.protocol)) return null;
    return u.href;
  } catch { return null; }
}
export function sanitizeElement(el, origin) {
  const tag = el.tagName.toLowerCase();
  if (!SAFE_TAGS.has(tag)) { el.remove(); return; }
  const href = el.getAttribute('href'), src = el.getAttribute('src'), alt = el.getAttribute('alt');
  for (const [name] of [...el.attributes]) el.removeAttribute(name);
  if (tag === 'a') {
    const url = safeUrl(href, origin); if (url) el.setAttribute('href', url);
    el.setAttribute('rel', 'noopener noreferrer');
  }
  if (tag === 'img') {
    const url = safeUrl(src, origin, true);
    if (!url) { el.remove(); return; }
    el.setAttribute('src', url); el.setAttribute('alt', alt ?? '');
    el.setAttribute('loading', 'lazy'); el.setAttribute('decoding', 'async');
  }
}
async function sanitize(html, origin) {
  return new HTMLRewriter().on('*', { element(el) { sanitizeElement(el, origin); } })
    .onDocument({ comments(c) { c.remove(); } })
    .transform(new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })).text();
}
function htmlResponse(body, status = 200, extras = {}) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'", ...extras } });
}
function brandFilter(env) { return env.HOLO_BRAND_ID ? [' WHERE brand_id = ?', [env.HOLO_BRAND_ID]] : ['', []]; }
export async function onRequest(context) {
  const { request, env, next } = context;
  if (!['GET', 'HEAD'].includes(request.method) || !env.HOLO_DB) return next();
  const url = new URL(request.url), path = url.pathname;
  const parts = path.split('/').filter(Boolean);
  const origin = env.SITE_URL ? new URL(env.SITE_URL).origin : url.origin;
  try {
    if (parts.length === 1 && parts[0] === 'blog') {
      const [where, values] = brandFilter(env);
      const rows = await env.HOLO_DB.prepare(`SELECT article_json FROM holo_articles${where} ORDER BY json_extract(article_json, '$.publishedAt') DESC LIMIT 500`).bind(...values).all();
      const base = await next(); if (base.status !== 200 || request.method === 'HEAD') return base;
      let html = await base.text();
      const articles = rows.results.map(r => JSON.parse(r.article_json));
      const paths = new Set(articles.map(a => `/blog/${a.slug}/`));
      // This site's trusted static cards each contain their /blog/<slug>/ link.
      html = html.replace(/<article\b[^>]*class="guide-card"[^>]*>[\s\S]*?<\/article>/g,
        card => [...paths].some(p => card.includes(`href="${p}"`)) ? '' : card);
      const cards = articles.map(a => `<article class="guide-card"><p class="eyebrow">GUIDA / ELEVEN STUDIO</p><h3><a href="/blog/${escape(a.slug)}/">${escape(a.title)}</a></h3><p>${escape(a.excerpt)}</p><a class="text-link" href="/blog/${escape(a.slug)}/">Leggi l’articolo →</a></article>`).join('');
      html = html.replace('https://elevenstudiosite.netlify.app', origin).replaceAll('https://elevenstudiosite.netlify.app', origin);
      const result = new HTMLRewriter().on('.guide-grid', { element(e) { e.prepend(cards, { html: true }); } }).transform(htmlResponse(html));
      return result;
    }
    if (parts.length !== 2 || parts[0] !== 'blog' || !/^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/.test(parts[1])) return next();
    const slug = parts[1];
    const query = env.HOLO_BRAND_ID
      ? env.HOLO_DB.prepare('SELECT article_json, received_at FROM holo_articles WHERE slug = ? AND brand_id = ?').bind(slug, env.HOLO_BRAND_ID)
      : env.HOLO_DB.prepare('SELECT article_json, received_at FROM holo_articles WHERE slug = ? ORDER BY received_at DESC LIMIT 1').bind(slug);
    const row = await query.first(); if (!row) return next(); // Existing static articles continue to work.
    if (!path.endsWith('/')) return new Response(null, { status: 308, headers: { Location: `${origin}/blog/${encodeURIComponent(slug)}/${url.search}` } });
    const a = JSON.parse(row.article_json), canonical = `${origin}/blog/${slug}/`;
    const body = await sanitize(a.contentHtml, origin);
    const title = escape(a.metaTitle || a.title), description = escape(a.metaDescription || a.excerpt);
    const image = safeUrl(a.featuredImage, origin, true);
    const date = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'Europe/Rome' }).format(new Date(a.publishedAt));
    const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${escape(canonical)}"><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/style.css"><meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escape(canonical)}">${image ? `<meta property="og:image" content="${escape(image)}">` : ''}<meta name="twitter:card" content="summary_large_image"><style>.content-body img{max-width:100%;height:auto}.content-body pre,.content-body table{max-width:100%;overflow:auto}.content-body{overflow-wrap:anywhere}</style></head><body>${HEADER}<main><section class="service-hero article-hero"><p class="eyebrow">ELEVEN STUDIO / GUIDE E ARTICOLI</p><h1>${escape(a.title)}</h1><p class="article-meta">Eleven Studio · <time datetime="${escape(a.publishedAt)}">${escape(date)}</time></p></section><article class="section content-body">${image ? `<img src="${escape(image)}" alt="${escape(a.title)}" decoding="async">` : ''}${body}<p><a class="button dark" href="/#contatti">Parliamo del tuo progetto</a></p></article><section class="section related"><a class="text-link" href="/blog/">Tutti gli articoli</a></section></main>${FOOTER}<script src="/mobile-nav.js" defer></script></body></html>`;
    return htmlResponse(request.method === 'HEAD' ? null : html);
  } catch {
    console.error('holo-blog: render_failed');
    return htmlResponse('<!doctype html><html lang="it"><meta name="robots" content="noindex"><title>Articoli temporaneamente non disponibili</title><p>Riprova tra poco.</p><a href="/">Torna alla homepage</a></html>', 503, { 'Retry-After': '30' });
  }
}
