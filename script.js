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
