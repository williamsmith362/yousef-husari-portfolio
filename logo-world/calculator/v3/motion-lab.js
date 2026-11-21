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

export function connectDisclosureMotion(root){
 if(CSS.supports('selector(details::details-content)')&&CSS.supports('block-size','calc-size(auto, size)'))return;
 const closing=new WeakMap();
 root.addEventListener('click',event=>{
  const summary=event.target.closest('summary');
  const details=summary?.parentElement;
  if(event.defaultPrevented||!motionEnabled()||!details?.open||details.matches('.more-menu'))return;
  event.preventDefault();
  const previous=closing.get(details);
  if(previous){previous.cancel();return;}
  const bottom=summary.getBoundingClientRect().bottom;
  const bounds=details.getBoundingClientRect();
  const previousOverflow=details.style.overflow;
  details.style.overflow='clip';
  const collapse=animate(details,[{height:`${bounds.height}px`},{height:`${bottom-bounds.top}px`}],{duration:250});
  if(!collapse){details.style.overflow=previousOverflow;details.open=false;return;}
  closing.set(details,collapse);
  const finish=close=>{
   if(close)details.open=false;
   details.style.overflow=previousOverflow;
   closing.delete(details);
  };
  collapse.finished.then(()=>finish(true),()=>finish(!motionEnabled()));
 });
}

export function revealChangedContent(element){
 entrance(element,0,4,{duration:230,opacity:.63});
}

export function revealEstimate(root){
 if(!motionEnabled()||!root)return;
 // Keep the final amount readable during the reveal.
 entrance(root.querySelector('.fabric-total'),0,5,{duration:330,curve:settle,opacity:.52});
 for(const [i,fact] of [...root.querySelectorAll('.calc-facts>div')].entries()){
  entrance(fact,0,5,{duration:260,delay:42+i*36,opacity:.45});
 }
}

export function connectFabricUnroll(root){
 let svg=null,frame=0,played=false,startTime=null,previousTime=null,scrollStart=0,progress=1;
 let compact=false,replayRequested=false;
 const print=matchMedia('print');
 const duration=1320;
 const clamp=value=>Math.max(0,Math.min(1,value));

 function paint(value){
  const clip=svg?.querySelector('[data-roll-clip]');
  const edge=svg?.querySelector('[data-roll-edge]');
  if(!clip||!edge)return;
  const top=Number(svg.dataset.rollTop),end=Number(svg.dataset.rollEnd);
  const leaf=top+(end-top)*value;
  clip.setAttribute('height',value===1?svg.viewBox.baseVal.height:leaf);
  edge.setAttribute('transform',`translate(0 ${leaf})`);
  edge.classList.toggle('is-rolling',value<1);
 }

 function refresh(){if(!frame)frame=requestAnimationFrame(draw);}
 function reset(){
  played=false;
  startTime=null;previousTime=null;
  progress=1;
 }
 function setSize(){
  const stage=svg.closest('.fabric-unroll-stage');
  stage.dataset.layoutSize=compact?'compact':'full';
  for(const button of root.querySelectorAll('[data-layout-size-choice]')){
   button.setAttribute('aria-pressed',String((button.dataset.layoutSizeChoice==='compact')===compact));
  }
 }
 function draw(now){
  frame=0;
  const next=root.querySelector('.cutting-layout');
  if(next!==svg){svg=next;reset();if(svg)setSize();}
  if(!svg)return;
  const layout=svg.getBoundingClientRect();
  const replay=root.querySelector('[data-fabric-replay]');
  if(replay)replay.hidden=!motionEnabled();
  if(!layout.height)return;
  const labelSize=Math.min(64,Math.max(22,11*svg.viewBox.baseVal.width/layout.width))+'px';
  if(svg.style.getPropertyValue('--roll-label-size')!==labelSize)svg.style.setProperty('--roll-label-size',labelSize);
  if(!motionEnabled()||print.matches){reset();paint(1);return;}
  const stickyTop=document.querySelector('.appbar')?.getBoundingClientRect().bottom??0;
  const actions=document.querySelector('.step-actions')?.getBoundingClientRect().height??0;
  const visible=Math.min(layout.bottom,window.innerHeight-actions)-Math.max(layout.top,stickyTop);
  if(replayRequested){
   replayRequested=false;
   reset();
  }
  if(!played&&visible>=Math.min(90,layout.height*.45)){
   played=true;
   startTime=previousTime=now;
   scrollStart=window.scrollY;
   progress=0;
  }
  if(startTime===null)return;
  const time=clamp((now-startTime)/duration);
  const scroll=clamp((window.scrollY-scrollStart)/385);
  const target=Math.max(time*time*(3-2*time),scroll);
  // Scrolling can move the roll forward without skipping the reveal in one frame.
  progress=Math.max(progress,Math.min(target,progress+Math.max(0,now-previousTime)*.00155));
  previousTime=now;
  if(time===1||progress>=.999){
   startTime=null;
   paint(1);
   return;
  }
  paint(progress);
  refresh();
 }

 root.addEventListener('click',event=>{
  const size=event.target.closest('[data-layout-size-choice]');
  if(size&&svg){
   compact=size.dataset.layoutSizeChoice==='compact';
   setSize();
   refresh();
  }
  if(event.target.closest('[data-fabric-replay]')){
   replayRequested=true;
   refresh();
  }
 });
 window.addEventListener('scroll',refresh,{passive:true});
 window.addEventListener('resize',refresh);
 window.addEventListener('beforeprint',()=>{reset();paint(1);});
 window.addEventListener('afterprint',refresh);
 reducedMotion.addEventListener?.('change',refresh);
 root.addEventListener('toggle',refresh,true);
 new MutationObserver(refresh).observe(root,{childList:true});
 refresh();
 return refresh;
}

export function releaseLegGhosts(chart){
 for(const ghost of chart.querySelectorAll('.leg-motion-ghost')){
  const fade=animate(ghost,[{opacity:.56},{opacity:0}],{duration:210});
  const remove=()=>ghost.remove();
  if(fade)fade.finished.then(remove,remove);
  else remove();
 }
}
