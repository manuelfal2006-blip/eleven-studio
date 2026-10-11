const requestedService=new URLSearchParams(window.location.search).get("progetto");
const serviceSelect=document.getElementById("service");
if(requestedService&&serviceSelect&&Array.from(serviceSelect.options).some(option=>option.value===requestedService)){serviceSelect.value=requestedService;}
document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('service').value=button.dataset.service;document.getElementById('contatti').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
const contactForm=document.getElementById('contact-form');
const submitButton=contactForm.querySelector('button[type="submit"]');
const formStatus=document.getElementById('form-status');
const emailFallback=document.getElementById('form-email-fallback');
const directDelivery=!contactForm.hasAttribute('data-netlify')&&contactForm.elements.namedItem('form-name')?.value===contactForm.getAttribute('name');
let submitting=false;
let delivered=false;
function requestEmail(data){
  const body=`Ciao Eleven studio,\n\nMi chiamo ${data.get('name')}.\nEmail: ${data.get('email')}\nProgetto: ${data.get('service')}\n\n${data.get('message')}\n\nVorrei parlarne con voi.`;
  return `mailto:manuelfal2006@gmail.com?subject=${encodeURIComponent('Nuovo progetto: '+data.get('service'))}&body=${encodeURIComponent(body)}`;
}
if(directDelivery){
  submitButton.textContent='Invia richiesta';
  document.getElementById('form-delivery-note').textContent='Invia la richiesta direttamente dal sito. Ti risponderemo all’indirizzo email indicato.';
}
if(!directDelivery){submitButton.textContent='Prepara la richiesta';}
contactForm.addEventListener('input',()=>{
  if(delivered){delivered=false;submitButton.disabled=false;formStatus.hidden=true;}
});
contactForm.addEventListener('submit',async event=>{
  event.preventDefault();
  if(submitting||delivered||!contactForm.reportValidity())return;
  const data=new FormData(contactForm);
  formStatus.hidden=false;
  if(!directDelivery){
    window.location.href=requestEmail(data);
    formStatus.textContent='La richiesta è pronta nella tua app email. Se non si apre, contattaci via WhatsApp o scrivi all’indirizzo qui accanto.';
    return;
  }
  submitting=true;
  submitButton.disabled=true;
  submitButton.textContent='Invio in corso…';
  contactForm.setAttribute('aria-busy','true');
  emailFallback.hidden=true;
  formStatus.textContent='Invio della richiesta in corso…';
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString(),signal:controller.signal});
    if(!response.ok)throw new Error('Submission failed');
    delivered=true;
    formStatus.textContent='Richiesta inviata. Grazie! Ti risponderemo all’email che hai indicato.';
    contactForm.reset();
  }catch(error){
    formStatus.textContent=error.name==='AbortError'?'Non abbiamo ricevuto la conferma di invio. Per evitare duplicati, contattaci via email o WhatsApp.':'Invio non riuscito. I dati sono ancora nel modulo: puoi riprovare oppure contattarci via email o WhatsApp.';
    emailFallback.querySelector('a').href=requestEmail(data);
    emailFallback.hidden=false;
  }finally{
    clearTimeout(timeout);
    submitting=false;
    submitButton.disabled=delivered;
    submitButton.textContent=delivered?'Richiesta inviata':'Invia richiesta';
    contactForm.removeAttribute('aria-busy');
  }
});

// Reveal once, and run illustrative animations only while their card is visible.
const motionCards=Array.from(document.querySelectorAll('.service-list article'));
const reduceServiceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window && !reduceServiceMotion.matches){
  const motionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      entry.target.classList.toggle('is-active',entry.isIntersecting);
      if(entry.isIntersecting){entry.target.classList.add('is-revealed');}
    });
  },{threshold:0.12});
  motionCards.forEach((card,index)=>{
    card.style.setProperty('--reveal-delay',`${(index%3)*0.1}s`);
    motionObserver.observe(card);
  });
  document.documentElement.classList.add('motion-ready');
  reduceServiceMotion.addEventListener('change',event=>{
    if(event.matches){motionObserver.disconnect();document.documentElement.classList.remove('motion-ready');motionCards.forEach(card=>card.classList.remove('is-active'));}
  });
}

// Small scroll cues keep native page scrolling and anchor navigation intact.
const scrollProgress=document.createElement('div');
scrollProgress.className='scroll-progress';
scrollProgress.setAttribute('aria-hidden','true');
document.body.appendChild(scrollProgress);
const heroImage=document.querySelector('.hero-art img');
let scrollFramePending=false;
function updateScrollCues(){
  scrollFramePending=false;
  const pageRange=document.documentElement.scrollHeight-window.innerHeight;
  const progress=pageRange>0?Math.min(1,Math.max(0,window.scrollY/pageRange)):0;
  scrollProgress.style.transform=`scaleX(${progress})`;
  if(heroImage){
    const offset=reduceServiceMotion.matches?0:Math.min(28,Math.max(0,window.scrollY)*0.045);
    heroImage.style.setProperty('--hero-scroll',`${offset}px`);
  }
}
function requestScrollCues(){
  if(!scrollFramePending){scrollFramePending=true;window.requestAnimationFrame(updateScrollCues);}
}
window.addEventListener('scroll',requestScrollCues,{passive:true});
window.addEventListener('resize',requestScrollCues,{passive:true});
window.addEventListener('pageshow',requestScrollCues);
reduceServiceMotion.addEventListener('change',requestScrollCues);
updateScrollCues();

if('IntersectionObserver' in window && !reduceServiceMotion.matches){
  const scrollTargets=Array.from(document.querySelectorAll('.section-top,.statement>h2,.statement>p:not(.eyebrow),.steps article,.home-guides .guide-card,.contact-copy,#contact-form,.faq>.eyebrow,.faq details'));
  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('scroll-visible');sectionObserver.unobserve(entry.target);}
    });
  },{threshold:0.08});
  scrollTargets.forEach((target,index)=>{
    target.classList.add('scroll-reveal');
    target.style.setProperty('--section-delay',`${(index%3)*0.07}s`);
    sectionObserver.observe(target);
  });
  document.documentElement.classList.add('scroll-motion-ready');
  reduceServiceMotion.addEventListener('change',event=>{
    if(event.matches){sectionObserver.disconnect();document.documentElement.classList.remove('scroll-motion-ready');}
  });
}
