document.querySelectorAll('.mobile-menu').forEach(menu=>{menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});});

if(!document.querySelector('.whatsapp-float')){
 const whatsapp=document.createElement('a');
 whatsapp.className='whatsapp-float';
 whatsapp.href='https://wa.me/393923568381';
 whatsapp.target='_blank';
 whatsapp.rel='noopener noreferrer';
 whatsapp.setAttribute('aria-label','Scrivi a Eleven Studio su WhatsApp');
 whatsapp.title='Scrivici su WhatsApp';
 whatsapp.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 .8A15.1 15.1 0 0 0 3 23.6L.9 31.1l7.7-2A15.1 15.1 0 1 0 16 .8Zm0 27.6a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.6 1.2 1.2-4.5-.3-.5A12.4 12.4 0 1 1 16 28.4Zm6.8-9.3c-.4-.2-2.2-1.1-2.5-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7.4-.6c.1-.2 0-.5 0-.7l-1.1-2.6c-.3-.7-.6-.6-.8-.6H11c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1 0 1.8 1.3 3.5 1.5 3.8.2.3 2.7 4.1 6.5 5.7.9.4 1.6.6 2.2.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z"/></svg>';
 document.body.appendChild(whatsapp);
}
