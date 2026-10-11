const requestedService=new URLSearchParams(window.location.search).get("progetto");
const serviceSelect=document.getElementById("service");
if(requestedService&&serviceSelect&&Array.from(serviceSelect.options).some(option=>option.value===requestedService)){serviceSelect.value=requestedService;}
document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('service').value=button.dataset.service;document.getElementById('contatti').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));
document.getElementById('contact-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const data=new FormData(form);const body=`Ciao Eleven studio,\n\nMi chiamo ${data.get('name')}.\nEmail: ${data.get('email')}\nProgetto: ${data.get('service')}\n\n${data.get('message')}\n\nVorrei parlarne con voi.`;const uri=`mailto:manuelfal2006@gmail.com?subject=${encodeURIComponent('Nuovo progetto: '+data.get('service'))}&body=${encodeURIComponent(body)}`;window.location.href=uri;const status=document.getElementById('form-status');status.hidden=false;status.textContent='La richiesta è pronta nella tua app email. Se non si apre, contattaci via WhatsApp o scrivi all’indirizzo qui accanto.';});

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
