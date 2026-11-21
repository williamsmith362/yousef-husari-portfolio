import {formatNumber,parseLength} from './model.js';
import {panelBounds,panelOutline,allowanceOutline,patternMeasurement} from './pattern-view.js';

const points=['knee','hem'];
const axes=['width','height'];
const sides=['front','back'];
const chartTop=32;
const chartBottom=382;
const panelSpace=188;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function createLegPlayground(dialog,{read,apply}){
 const chart=dialog.querySelector('svg');
 const fields=Object.fromEntries([...dialog.querySelectorAll('[data-leg-input]')].map(input=>[input.dataset.legInput,input]));
 const message=dialog.querySelector('[data-leg-message]');
 const unitLabel=dialog.querySelector('[data-leg-unit]');
 let limits,drag,frame=0,pending;
 const factor=unit=>unit==='cm'?2.54:1;
 const direction=side=>side==='front'?1:-1;

 function chartLayout(draft){
  const bounds=sides.map(side=>panelBounds(draft[side]));
  const outside=Math.max(limits?.outside??0,...bounds.map(panel=>-panel.min));
  const inside=Math.max(limits?.inside??0,...bounds.map(panel=>panel.max*1.22));
  const height=Math.max(limits?.height??0,draft.rise+draft.leg*1.14);
  const scale=Math.min(panelSpace/(outside+inside),(chartBottom-chartTop)/height);
  return {outside,inside,height,scale};
 }

 function drawPanels(values){
  const {draft,seams}=values,{scale,outside,inside,height}=limits;
  const y=value=>chartTop+value*scale;
  const unitScale=factor(values.unit);
  const inchStep=values.unit==='cm'?20/unitScale:6;
  const tickCount=Math.min(12,Math.floor((height-draft.rise)/inchStep));
  const panels=sides.map(side=>{
   const sign=direction(side);
   const origin=side==='front'?56+outside*scale:464-outside*scale;
   const x=value=>origin+sign*value*scale;
   const xy=(a,b)=>`${x(a)} ${y(b)}`;
   const outline=panelOutline(draft,side,xy,true);
   const cut=allowanceOutline(draft,side,seams,xy,true);
   const grid=Array.from({length:tickCount+1},(_,i)=>{
    const dy=y(draft.rise+i*inchStep);
    return `<path class="leg-grid" d="M ${origin} ${dy} H ${x(inside)}"/>${side==='front'?`<text x="46" y="${dy+4}" text-anchor="end">${i*(values.unit==='cm'?20:6)}</text>`:''}`;
   }).join('');
   const handles=points.map(point=>{
    const mark=patternMeasurement(draft,point,side);
    const [width,level]=mark.end;
    const px=x(width),py=y(level);
    const label=point==='knee'?'Knee':'Hem';
    return `<g data-leg-point="${point}" data-leg-side="${side}">
     <path class="leg-guide" d="M ${origin} ${py} H ${px}"/>
     <circle class="leg-hit-point" cx="${px}" cy="${py}" r="20"/>
     <circle class="leg-handle" cx="${px}" cy="${py}" r="6"/>
     <text class="leg-point-name" x="${px+sign*9}" y="${py-9}" text-anchor="${side==='front'?'end':'start'}">${label}</text>
    </g>`;
   }).join('');
   return `<g class="leg-pattern" data-leg-panel="${side}">
    <text class="leg-panel-title" x="${x(inside/2)}" y="17" text-anchor="middle">${side==='front'?'Front':'Back'}</text>
    ${grid}<path class="leg-axis" d="M ${origin} ${y(height)} V ${y(draft.rise)} H ${x(inside)}"/>
    <path class="leg-cut-band" fill-rule="evenodd" d="${cut} ${outline}"/>
    <path class="leg-cut-line" d="${cut}"/>
    <path class="leg-panel-outline" d="${outline}"/>
    ${handles}
   </g>`;
  });
  chart.innerHTML=`<title>Front and back pattern panels with draggable knee and hem points</title>${panels.join('')}`;
 }

 function redraw(){
  const values=read();
  if(!drag)limits=chartLayout(values.draft);
  unitLabel.textContent=values.unit;
  for(const point of points)for(const axis of axes){
   const input=fields[point+'-'+axis];
   input.value=formatNumber(values[point][axis],values.unit);
   input.removeAttribute('aria-invalid');
  }
  drawPanels(values);
 }

 function position(event){
  const transform=chart.getScreenCTM();
  return transform?new DOMPoint(event.clientX,event.clientY).matrixTransform(transform.inverse()):null;
 }

 function move(){
  frame=0;
  if(!drag||!pending)return;
  const p=pending;
  pending=null;
  const values=read(),unitScale=factor(values.unit);
  const step=values.unit==='cm'?0.1/unitScale:1/16;
  const snap=value=>Math.round(value/step)*step;
  const offsetX=(p.x-drag.origin.x)*direction(drag.side)/(limits.scale*drag.share);
  const offsetY=(p.y-drag.origin.y)/limits.scale;
  const minY=drag.point==='knee'?values.minKnee+step:values.knee.height+step;
  const maxY=drag.point==='knee'?values.hem.height-step:limits.height-values.draft.rise;
  const width=clamp(snap(drag.start.width+offsetX),step,limits.inside/Math.max(values.frontShare,1-values.frontShare));
  const height=minY<=maxY?clamp(snap(drag.start.height+offsetY),minY,maxY):values[drag.point].height;
  const patch={};
  if(Math.abs(offsetX)>=step/2)patch.width=width;
  else if(drag.changedWidth)patch.width=drag.start.width;
  if(Math.abs(offsetY)>=step/2)patch.height=height;
  else if(drag.changedHeight)patch.height=drag.start.height;
  if(!Object.keys(patch).length)return;
  if(apply(drag.point,patch)){
   drag.changedWidth=Math.abs(offsetX)>=step/2;
   drag.changedHeight=Math.abs(offsetY)>=step/2;
   message.textContent='';
   redraw();
  }
 }

 chart.addEventListener('pointerdown',event=>{
  const target=event.target.closest('[data-leg-point]');
  if(!target||drag||event.button!==0)return;
  const originPoint=position(event);
  if(!originPoint)return;
  const point=target.dataset.legPoint,side=target.dataset.legSide;
  const values=read();
  const share=side==='front'?values.frontShare:1-values.frontShare;
  drag={point,side,share,id:event.pointerId,origin:originPoint,start:values[point]};
  event.preventDefault();
  chart.setPointerCapture(event.pointerId);
 });
 chart.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  pending=position(event);
  if(!frame)frame=requestAnimationFrame(move);
 });
 function finish(event){
  if(!drag||drag.id!==event.pointerId)return;
  if(frame)cancelAnimationFrame(frame);
  if(event.type==='pointerup')move();
  drag=null;frame=0;pending=null;
 }
 for(const event of ['pointerup','pointercancel','lostpointercapture'])chart.addEventListener(event,finish);

 for(const [key,input] of Object.entries(fields)){
  function commit(){
   const [point,axis]=key.split('-');
   const values=read();
   const parsed=parseLength(input.value,values.unit);
   const invalid=parsed.error||parsed.value===null||parsed.value<=0;
   if(invalid||!apply(point,{[axis]:parsed.value})){
    input.setAttribute('aria-invalid','true');
    message.textContent=invalid?'Enter a positive measurement.':'The knee must stay above the hem and below the crotch or thigh line.';
    return;
   }
   message.textContent='';
   redraw();
  }
  input.addEventListener('change',commit);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')input.blur();});
 }

 dialog.addEventListener('close',()=>{
  if(frame)cancelAnimationFrame(frame);
  drag=null;frame=0;pending=null;
 });
 return {open(){limits=null;message.textContent='';redraw();dialog.showModal();}};
}
