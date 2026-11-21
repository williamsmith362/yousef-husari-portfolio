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
  const button=document.getElementById('themeToggle');
  if(button){button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');button.title=dark?'Switch to light mode':'Switch to dark mode';}
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#1b1b1b':'#f7f7f7';
  if(notify)document.dispatchEvent(new CustomEvent('appearance:change',{detail:{theme:value,external:false}}));
 }
 apply(readTheme());
 document.addEventListener('appearance:apply',e=>apply(e.detail));
 document.addEventListener('DOMContentLoaded',()=>{
  apply(document.documentElement.dataset.theme);
  document.getElementById('themeToggle')?.addEventListener('click',()=>{
   const next=document.documentElement.dataset.theme==='parchment'?'midnight':'parchment';
   try{localStorage.setItem(key,next);}catch{}
   apply(next,true);
  });
 });
 window.addEventListener('storage',e=>{if(e.key===key||e.key===null)apply(readTheme(),true);});
 window.addEventListener('pageshow',e=>{if(e.persisted)apply(readTheme(),true);});
})();
