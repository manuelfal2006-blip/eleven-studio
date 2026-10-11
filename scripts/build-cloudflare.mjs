import { readdir, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'dist');
const raw=process.env.SITE_URL;
if(!raw)throw new Error('Set SITE_URL to the final public Cloudflare project URL before building.');
const url=new URL(raw);
if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('SITE_URL must be an HTTPS origin without path or query.');
const origin=url.origin;
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const allowed=new Set(['.html','.css','.js','.svg','.webp','.jpg','.jpeg','.png','.woff','.woff2','.xml','.txt']);
const skip=new Set(['.git','node_modules','dist','scripts','.github']);
let files=0;
async function copy(dir,relative=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(skip.has(entry.name)||entry.name.startsWith('.'))continue;
  const rel=path.join(relative,entry.name),src=path.join(dir,entry.name),dest=path.join(output,rel);
  if(entry.isDirectory()){await copy(src,rel);continue;}
  if(!allowed.has(path.extname(entry.name)))continue;
  let body=await readFile(src);
  if(['.html','.xml','.txt','.js','.css'].includes(path.extname(entry.name))){
   let text=body.toString('utf8').replaceAll('https://elevenstudiosite.netlify.app',origin);
   if(rel==='privacy/index.html'){
    text=text.replace('Il sito è ospitato su Netlify.','Il sito è ospitato su Cloudflare Pages.');
    text=text.replace(/Quando il pulsante indica «Invia richiesta»[\s\S]*?Il collegamento WhatsApp/,'Il modulo prepara una richiesta nella tua app email; la richiesta ci arriva soltanto se invii il messaggio. Il collegamento WhatsApp');
    text=text.replace('Netlify per hosting, distribuzione delle pagine e gestione delle richieste inviate direttamente con Netlify Forms, con i relativi fornitori antispam;','Cloudflare per hosting e distribuzione delle pagine;');
    text=text.replace('<a href="https://www.netlify.com/privacy/" rel="noopener noreferrer">Netlify</a>, <a href="https://automattic.com/privacy/" rel="noopener noreferrer">Automattic (Akismet)</a>,','<a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer">Cloudflare</a>,');
   }
   if(rel==='cookie/index.html')text=text.replaceAll('Netlify','Cloudflare');
   if(rel==='sitemap.xml'&&!text.includes(origin+'/progetti/'))text=text.replace('</urlset>','<url><loc>'+origin+'/progetti/</loc></url></urlset>');
   body=Buffer.from(text);
  }
  await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,body);files++;
 }
}
await copy(root);
await writeFile(path.join(output,'404.html'),'<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pagina non trovata | Eleven Studio</title><link rel="stylesheet" href="/style.css"></head><body><main class="legal-page section"><h1>Pagina non trovata.</h1><p>Il contenuto potrebbe essere stato spostato.</p><a class="button dark" href="/">Torna alla homepage</a></main></body></html>');
console.log('Cloudflare build ready: '+files+' files. Public origin: '+origin+'. Contact form uses email preparation until a new backend is configured.');
