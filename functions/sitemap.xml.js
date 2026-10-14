const escape = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export async function onRequest({ request, env, next }) {
  if (!['GET', 'HEAD'].includes(request.method) || !env.HOLO_DB) return next();
  try {
    const base = await next(); if (base.status !== 200 || request.method === 'HEAD') return base;
    let xml = await base.text(); if (!xml.includes('</urlset>')) return new Response(xml, base);
    const origin = new URL(env.SITE_URL || request.url).origin;
    const q = env.HOLO_BRAND_ID
      ? env.HOLO_DB.prepare('SELECT slug, received_at FROM holo_articles WHERE brand_id = ?').bind(env.HOLO_BRAND_ID)
      : env.HOLO_DB.prepare('SELECT slug, MAX(received_at) AS received_at FROM holo_articles GROUP BY slug');
    const { results } = await q.all();
    xml = xml.replaceAll('https://elevenstudiosite.netlify.app', origin);
    for (const row of results) {
      const location = `${origin}/blog/${row.slug}/`;
      // Replace any static entry for the same slug with the current dynamic entry.
      xml = xml.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g, entry => entry.includes(`<loc>${escape(location)}</loc>`) ? '' : entry);
      xml = xml.replace('</urlset>', `<url><loc>${escape(location)}</loc><lastmod>${escape(row.received_at)}</lastmod></url></urlset>`);
    }
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch { return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain', 'Retry-After': '30' } }); }
}
