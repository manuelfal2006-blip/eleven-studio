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
   if(rel==='index.html'){
    text=text.replace('action="/richiesta-inviata/" data-netlify="true" netlify-honeypot="bot-field"','action="https://formsubmit.co/manuelfal2006@gmail.com" data-delivery="formsubmit"');
    text=text.replace('<input type="hidden" name="form-name" value="eleven-studio-contatti">','<input type="hidden" name="_subject" value="Nuova richiesta — Eleven Studio"><input type="hidden" name="_template" value="table"><input type="hidden" name="_next" value="'+origin+'/richiesta-inviata/"><input type="hidden" name="_url" value="'+origin+'/">');
    text=text.replace('name="bot-field"','name="_honey"');
    text=text.replace('Il pulsante apre la tua app email con la richiesta compilata. Puoi controllarla prima di inviarla.','Invia la richiesta alla nostra email tramite FormSubmit. Potrebbe esserti chiesto un controllo antispam prima di tornare al sito.');
   }
   if(rel==='privacy/index.html'){
    text=text.replace('Il sito è ospitato su Netlify.','Il sito è ospitato su Cloudflare Pages.');
    text=text.replace(/Quando il pulsante indica «Invia richiesta»[\s\S]*?Il collegamento WhatsApp/,'Il modulo trasmette nome, email, tipo di progetto e messaggio al servizio FormSubmit, che inoltra la richiesta alla casella Gmail del titolare e dichiara di conservarla nel proprio archivio per 30 giorni. Dopo l’invio può essere richiesto un controllo antispam Google reCAPTCHA sulle pagine del fornitore; il controllo non è incorporato nelle pagine di Eleven Studio. L’alternativa via email apre la tua app e ci arriva soltanto se invii il messaggio. Il collegamento WhatsApp');
    text=text.replace('Netlify per hosting, distribuzione delle pagine e gestione delle richieste inviate direttamente con Netlify Forms, con i relativi fornitori antispam;','Cloudflare per hosting e distribuzione delle pagine; FormSubmit (Devro LABS) per inoltro e archivio temporaneo del modulo, con Google reCAPTCHA per il controllo antispam esterno;');
    text=text.replace('<a href="https://www.netlify.com/privacy/" rel="noopener noreferrer">Netlify</a>, <a href="https://automattic.com/privacy/" rel="noopener noreferrer">Automattic (Akismet)</a>,','<a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer">Cloudflare</a>, <a href="https://formsubmit.co/privacy.pdf" rel="noopener noreferrer">FormSubmit</a>,');
   }
   if(rel==='cookie/index.html'){
    text=text.replace(/<h2>Preferenza tecnica del badge Netlify<\/h2>[\s\S]*?(?=<h2>Contatti)/,'');
    text=text.replace('Il modulo prepara un messaggio nella tua app email.','Il modulo invia la richiesta tramite FormSubmit: il browser apre il servizio soltanto al momento dell’invio, per l’eventuale controllo antispam Google reCAPTCHA. Questi servizi possono usare cookie sulle proprie pagine; consulta le <a href="https://formsubmit.co/privacy.pdf">informazioni FormSubmit</a> e la <a href="https://policies.google.com/privacy?hl=it">privacy Google</a>. Nessuno script reCAPTCHA viene caricato nelle pagine di Eleven Studio. L’alternativa email prepara un messaggio nella tua app.');
    text=text.replace('Eliminare il localStorage può far ricomparire il badge nascosto. ','').replace('9 ottobre 2026','11 ottobre 2026');
   }
   if(rel==='sitemap.xml'&&!text.includes(origin+'/progetti/'))text=text.replace('</urlset>','<url><loc>'+origin+'/progetti/</loc></url></urlset>');
   body=Buffer.from(text);
  }
  await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,body);files++;
 }
}
await copy(root);
await writeFile(path.join(output,'404.html'),'<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pagina non trovata | Eleven Studio</title><link rel="stylesheet" href="/style.css"></head><body><main class="legal-page section"><h1>Pagina non trovata.</h1><p>Il contenuto potrebbe essere stato spostato.</p><a class="button dark" href="/">Torna alla homepage</a></main></body></html>');
console.log('Cloudflare build ready: '+files+' files. Public origin: '+origin+'. Contact form uses FormSubmit; recipient activation and delivery test required.');
