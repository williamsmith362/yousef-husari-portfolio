const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const easing='cubic-bezier(.2,.76,.23,1)';
const settle='cubic-bezier(.18,.78,.26,1)';
const latest=new WeakMap();
const running=new Set();
const svgNS='http://www.w3.org/2000/svg';

export const motionEnabled=()=>!reducedMotion.matches;

reducedMotion.addEventListener?.('change',event=>{
 if(event.matches)for(const animation of running)animation.cancel();
});

function animate(element,frames,{duration=240,delay=0,curve=easing}={}){
 if(!motionEnabled()||!element?.animate)return null;
 latest.get(element)?.cancel();
 const animation=element.animate(frames,{duration,delay,easing:curve,fill:'backwards'});
 latest.set(element,animation);
 running.add(animation);
 const done=()=>running.delete(animation);
 animation.finished.then(done,done);
 return animation;
}

function entrance(element,x,y,{duration=290,delay=0,opacity=.5,curve=easing}={}){
 return animate(element,[{opacity,translate:`${x}px ${y}px`},{opacity:1,translate:'0px 0px'}],{duration,delay,curve});
}

export function enterStep(heading,panel,direction){
 entrance(heading,9*direction,0,{duration:280,opacity:.42});
 entrance(panel,12*direction,3,{duration:330,delay:22,opacity:.48});
}

export function confirmField(input){
 if(input.getAttribute('aria-invalid')==='true'||!input.value.trim())return;
 animate(input,[
  {boxShadow:'0 0 0 0 color-mix(in srgb, var(--ink) 24%, transparent)'},
  {boxShadow:'0 0 0 3px color-mix(in srgb, var(--ink) 12%, transparent)',offset:.34},
  {boxShadow:'0 0 0 5px transparent'}
 ],{duration:330});
 const target=input.closest('.field')?.querySelector('.target-note:not(:empty)');
 entrance(target,0,3,{duration:250,opacity:.55});
}

function traceOutlines(figure){
 if(!motionEnabled()||!figure)return;
 for(const [i,outline] of [...figure.querySelectorAll('.pattern-panel .outline')].entries()){
  const parent=outline.parentElement;
  parent.querySelector('.motion-trace')?.remove();
  const trace=document.createElementNS(svgNS,'path');
  trace.setAttribute('class','motion-trace');
  trace.setAttribute('d',outline.getAttribute('d'));
  trace.setAttribute('pathLength','1');
  trace.setAttribute('aria-hidden','true');
  parent.append(trace);
  const drawing=animate(trace,[
   {strokeDashoffset:'1',opacity:.82},
   {strokeDashoffset:'0',opacity:.72,offset:.83},
   {strokeDashoffset:'0',opacity:0}
  ],{duration:770,delay:i*68,curve:'cubic-bezier(.24,.63,.25,1)'});
  const remove=()=>trace.remove();
  if(drawing)drawing.finished.then(remove,remove);
  else remove();
 }
}

function marks(figure){return [...(figure?.querySelectorAll('.pattern-dimension:not(.motion-mark-exit)')??[])];}
function markKey(mark){return mark.dataset.side+':'+mark.dataset.measurement;}

function revealMarks(elements,delay=0){
 elements.forEach((mark,i)=>{
  const timing={duration:285,delay:delay+Math.min(i,9)*14};
  animate(mark,[{opacity:0},{opacity:1}],timing);
  animate(mark.querySelector('.dimension-value'),[{opacity:0,translate:'0px 3px'},{opacity:1,translate:'0px 0px'}],{...timing,delay:timing.delay+38});
 });
}

export function revealPattern(figure){
 if(!motionEnabled()||!figure)return;
 traceOutlines(figure);
 revealMarks(marks(figure),135);
}

export function captureMeasurements(figure){
 return motionEnabled()?new Map(marks(figure).map(mark=>[markKey(mark),mark])):null;
}

export function animateMeasurementChange(figure,previous){
 if(!motionEnabled()||!previous)return;
 const current=marks(figure);
 const currentKeys=new Set(current.map(markKey));
 revealMarks(current.filter(mark=>!previous.has(markKey(mark))));
 for(const [key,mark] of previous){
  if(currentKeys.has(key))continue;
  const panel=figure.querySelector(`[data-pattern-side="${mark.dataset.side}"]`);
  if(!panel)continue;
  mark.removeAttribute('role');
  mark.removeAttribute('tabindex');
  mark.removeAttribute('aria-label');
  mark.setAttribute('aria-hidden','true');
  mark.classList.add('motion-mark-exit');
  panel.append(mark);
  const fade=animate(mark,[{opacity:.6},{opacity:0}],{duration:145});
  const remove=()=>mark.remove();
  if(fade)fade.finished.then(remove,remove);
  else remove();
 }
}

export function revealFabricLayout(root){
 if(!motionEnabled()||!root?.querySelector('.layout-details[open]'))return;
 const pieces=root.querySelectorAll('.layout-panel');
 pieces.forEach((piece,i)=>{
  for(const part of piece.querySelectorAll('.layout-outline,.layout-grain,.layout-panel-label')){
   entrance(part,piece.dataset.panel==='front'?-12:12,-8,{duration:380,delay:35+i*58,curve:settle,opacity:.12});
  }
 });
}

export function revealEstimate(root){
 if(!motionEnabled()||!root)return;
 const total=root.querySelector('.fabric-total');
 animate(total,[
  {opacity:.15,translate:'0px 7px',clipPath:'inset(0 0 100% 0)'},
  {opacity:1,translate:'0px 0px',clipPath:'inset(0 0 0% 0)'}
 ],{duration:380,curve:settle});
 for(const [i,fact] of [...root.querySelectorAll('.calc-facts>div')].entries()){
  entrance(fact,0,6,{duration:285,delay:85+i*44,opacity:.2});
 }
 revealFabricLayout(root);
}

export function releaseLegGhosts(chart){
 for(const ghost of chart.querySelectorAll('.leg-motion-ghost')){
  const fade=animate(ghost,[{opacity:.56},{opacity:0}],{duration:210});
  const remove=()=>ghost.remove();
  if(fade)fade.finished.then(remove,remove);
  else remove();
 }
}
