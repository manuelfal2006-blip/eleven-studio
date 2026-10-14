import { createHmac, timingSafeEqual } from 'node:crypto';

const LIMIT = 2 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENTS = new Set(['article.published', 'article.updated']);
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(x) && Number.isFinite(Date.parse(x));
const webUrl = x => { try { const u = new URL(x); return typeof x === 'string' && ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } };

function valid(p) {
  if (!object(p) || p.version !== 1 || !EVENTS.has(p.event) || typeof p.test !== 'boolean' ||
      !UUID.test(p.deliveryId ?? '') || !date(p.sentAt) || !object(p.brand) ||
      !UUID.test(p.brand.id ?? '') || typeof p.brand.name !== 'string' || !object(p.article)) return false;
  const a = p.article;
  return UUID.test(a.id ?? '') && typeof a.slug === 'string' &&
    /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/.test(a.slug) && a.slug.length <= 200 &&
    ['title', 'excerpt', 'contentHtml', 'contentMarkdown', 'metaTitle', 'metaDescription'].every(k => typeof a[k] === 'string') &&
    a.title.trim().length > 0 && (a.featuredImage === null || webUrl(a.featuredImage)) &&
    Array.isArray(a.images) && a.images.every(i => object(i) && webUrl(i.url) && typeof i.alt === 'string') &&
    date(a.publishedAt) && typeof a.isRepublish === 'boolean' &&
    a.isRepublish === (p.event === 'article.updated');
}

async function rawBody(request) {
  const length = request.headers.get('content-length');
  if (length && Number(length) > LIMIT) throw new Error('too_large');
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > LIMIT) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function authenticated(raw, signature, secret) {
  if (!/^sha256=[0-9a-fA-F]{64}$/.test(signature ?? '')) return false;
  const actual = Buffer.from(signature.slice(7), 'hex');
  const expected = createHmac('sha256', secret).update(raw).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  if (new URL(request.url).protocol !== 'https:') return json(400, { error: 'https_required' });
  if (typeof env.HOLO_WEBHOOK_SECRET !== 'string' || !env.HOLO_WEBHOOK_SECRET || !env.HOLO_DB) {
    return json(503, { error: 'webhook_not_configured' });
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json(415, { error: 'application_json_required' });
  }
  if (request.headers.get('content-encoding') && request.headers.get('content-encoding') !== 'identity') {
    return json(415, { error: 'unsupported_content_encoding' });
  }
  let raw;
  try { raw = await rawBody(request); }
  catch (e) { return json(e.message === 'too_large' ? 413 : 400, { error: e.message === 'too_large' ? 'payload_too_large' : 'body_read_failed' }); }
  // Verify ORIGINAL bytes. No JSON parsing, normalization or body middleware before this point.
  if (!authenticated(raw, request.headers.get('x-holo-signature'), env.HOLO_WEBHOOK_SECRET)) {
    return json(401, { error: 'invalid_signature' });
  }
  const event = request.headers.get('x-holo-event');
  const delivery = request.headers.get('x-holo-delivery');
  const userAgent = request.headers.get('user-agent'); // Metadata, NOT an authentication mechanism.
  let payload;
  try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); }
  catch { return json(400, { error: 'invalid_json' }); }
  if (!valid(payload) || event !== payload.event || delivery !== payload.deliveryId) {
    return json(400, { error: 'invalid_payload_or_headers' });
  }
  if (payload.test) return json(200, { ok: true, test: true, message: 'Test webhook received' });
  if (env.HOLO_BRAND_ID && payload.brand.id !== env.HOLO_BRAND_ID) return json(403, { error: 'brand_not_allowed' });
  const p = payload, a = p.article;
  try {
    // D1 batch is transactional. The existence guard prevents a retry from overwriting
    // a newer article. Both writes commit together, including under concurrent retries.
    const result = await env.HOLO_DB.batch([
      env.HOLO_DB.prepare(`INSERT INTO holo_articles
        (brand_id, article_id, slug, article_json, received_at)
        SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS
          (SELECT 1 FROM holo_deliveries WHERE delivery_id = ?)
        ON CONFLICT(brand_id, article_id) DO UPDATE SET
          slug = excluded.slug, article_json = excluded.article_json, received_at = excluded.received_at`)
        .bind(p.brand.id, a.id, a.slug, JSON.stringify(a), new Date().toISOString(), p.deliveryId),
      env.HOLO_DB.prepare(`INSERT INTO holo_deliveries
        (delivery_id, brand_id, article_id, event, user_agent, received_at)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(delivery_id) DO NOTHING`)
        .bind(p.deliveryId, p.brand.id, a.id, event, (userAgent ?? '').slice(0, 256), new Date().toISOString())
    ]);
    return json(200, { ok: true, duplicate: result[1].meta.changes === 0, deliveryId: p.deliveryId });
  } catch {
    // No secrets, bodies or internal DB errors in logs/responses. A 503 lets Holo retry.
    console.error(JSON.stringify({ component: 'holo-webhook', error: 'storage_failed', deliveryId: p.deliveryId }));
    return json(503, { error: 'storage_failed' }, { 'Retry-After': '30' });
  }
}
