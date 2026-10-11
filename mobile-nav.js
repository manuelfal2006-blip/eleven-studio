document.querySelectorAll('.mobile-menu').forEach(menu=>{menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});});


if(!document.querySelector('.whatsapp-float')){
 const icon="<svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"currentColor\" d=\"M16 .8A15.1 15.1 0 0 0 3 23.6L.9 31.1l7.7-2A15.1 15.1 0 1 0 16 .8Zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.6 1.2 1.2-4.5-.3-.5A12.4 12.4 0 1 1 16 28.4Zm6.8-9.3c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5 0-.7l-1.1-2.6c-.3-.7-.6-.6-.8-.6H11c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1 0 1.8 1.3 3.5 1.5 3.8.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z\"/></svg>";
 const launcher=document.createElement('button');
 launcher.type='button';launcher.className='whatsapp-float';launcher.innerHTML=icon;
 launcher.setAttribute('aria-label','Apri il contatto WhatsApp di Eleven Studio');
 launcher.setAttribute('aria-haspopup','dialog');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','eleven-whatsapp-chat');
 const panel=document.createElement('dialog');panel.id='eleven-whatsapp-chat';panel.className='wa-panel';
 panel.setAttribute('aria-labelledby','wa-title');
 panel.innerHTML='<div class="wa-header"><span class="wa-avatar">'+icon+'</span><div><strong id="wa-title">Eleven Studio</strong><span class="wa-subtitle">Parliamo del tuo progetto</span></div><button type="button" class="wa-close" aria-label="Chiudi la finestra WhatsApp">×</button></div><div class="wa-conversation"><div class="wa-bubble"><p>Ciao! Benvenuto in Eleven Studio. 👋</p><p>Hai un dubbio o un’idea? Raccontaci cosa vuoi realizzare: un sito, un e-commerce, una landing page, un CRM o un assistente IA.</p><span class="wa-time"></span></div></div><div class="wa-compose"><form class="wa-message-form"><label class="wa-sr-only" for="wa-message">Il tuo messaggio per Eleven Studio</label><textarea id="wa-message" rows="2" maxlength="2000" placeholder="Scrivi un messaggio…" required></textarea><button type="submit" class="wa-send" aria-label="Continua su WhatsApp con il messaggio"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3v7l12 2-12 2v7l19-9Z"/></svg></button></form><p class="wa-note">Il messaggio viene inviato solo quando confermi su WhatsApp.</p><a class="wa-open" href="https://wa.me/393923568381" target="_blank" rel="noopener noreferrer">Apri su WhatsApp ↗</a></div>';
 document.body.append(launcher,panel);
 panel.querySelector('.wa-time').textContent=new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit'}).format(new Date());
 const input=panel.querySelector('textarea');
 const link=panel.querySelector('.wa-open');
 function destination(){const text=input.value.trim();return 'https://wa.me/393923568381'+(text?'?text='+encodeURIComponent(text):'');}
 input.addEventListener('input',()=>{link.href=destination();});
 launcher.addEventListener('click',()=>{panel.showModal();launcher.setAttribute('aria-expanded','true');});
 panel.querySelector('.wa-close').addEventListener('click',()=>panel.close());
 panel.addEventListener('click',event=>{if(event.target===panel){const box=panel.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)panel.close();}});
 panel.addEventListener('close',()=>{launcher.setAttribute('aria-expanded','false');launcher.focus({preventScroll:true});});
 panel.querySelector('form').addEventListener('submit',event=>{event.preventDefault();if(!input.value.trim()){input.setCustomValidity('Scrivi il tuo messaggio prima di continuare.');input.reportValidity();input.setCustomValidity('');return;}link.href=destination();link.click();});
}
