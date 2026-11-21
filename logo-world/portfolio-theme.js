// Apply the saved appearance before the page paints.
(()=>{
 const key='sp_theme';
 function readTheme(){
  try{return localStorage.getItem(key)==='parchment'?'parchment':'midnight';}catch{return 'midnight';}
 }
 function apply(theme,notify=false){
  const dark=theme==='midnight'||theme==='indigo';
  const value=dark?'midnight':'parchment';
  document.documentElement.dataset.theme=value;
  const buttons=document.querySelectorAll('.portfolio-theme-toggle');
  for(const button of buttons){button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');button.title=dark?'Switch to light mode':'Switch to dark mode';}
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#171717':'#ffffff';
  if(notify)document.dispatchEvent(new CustomEvent('appearance:change',{detail:{theme:value,external:false}}));
 }
 apply(readTheme());
 document.addEventListener('appearance:apply',e=>apply(e.detail));
 document.addEventListener('DOMContentLoaded',()=>{
  apply(document.documentElement.dataset.theme);
  document.querySelectorAll('.portfolio-theme-toggle').forEach(button=>button.addEventListener('click',()=>{
   if(document.documentElement.classList.contains('theme-swoosh'))return;
   const next=document.documentElement.dataset.theme==='parchment'?'midnight':'parchment';
   try{localStorage.setItem(key,next);}catch{}
   if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('theme-swoosh');
    const transition=document.startViewTransition(()=>apply(next,true));
    transition.finished.catch(()=>{}).finally(()=>document.documentElement.classList.remove('theme-swoosh'));
   }else apply(next,true);
  }));
 });
 window.addEventListener('storage',e=>{if(e.key===key||e.key===null)apply(readTheme(),true);});
 window.addEventListener('pageshow',e=>{if(e.persisted)apply(readTheme(),true);});
})();
