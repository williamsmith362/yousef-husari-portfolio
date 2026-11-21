import {formatNumber,parseLength} from './model.js';
import {escapeHTML,patternBounds,panelOutline,allowanceOutline,patternMeasurement} from './pattern-view.js';

import {motionEnabled,releaseLegGhosts} from './motion-lab.js';

const points=['knee','hem'];
const axes=['width','height'];
const sides=['front','back'];
const chartTop=32;
const chartBottom=382;
const panelSpace=188;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function createLegPlayground(dialog,{read,apply,add,remove}){
 const chart=dialog.querySelector('svg');
 const fields=Object.fromEntries([...dialog.querySelectorAll('[data-leg-input]')].map(input=>[input.dataset.legInput,input]));
 const message=dialog.querySelector('[data-leg-message]');
 const unitLabel=dialog.querySelector('[data-leg-unit]');
 const pivotSelect=dialog.querySelector('[data-pivot-select]');
 const pivotEditor=dialog.querySelector('[data-pivot-editor]');
 const pivotName=dialog.querySelector('[data-pivot-name]');
 const pivotWidth=dialog.querySelector('[data-pivot-width]');
 const pivotHeight=dialog.querySelector('[data-pivot-height]');
 let selectedPivot=null;
 let limits,drag,frame=0,pending;
 const factor=unit=>unit==='cm'?2.54:1;
 const direction=side=>side==='front'?1:-1;

 function chartLayout(draft){
  const bounds=sides.map(side=>patternBounds(draft,side));
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
   const handles=[{key:'knee',name:'Knee'},...draft.pivots.map(pivot=>({key:pivot.id,name:pivot.name})),{key:'hem',name:'Hem'}].map(({key:point,name:label})=>{
    const mark=patternMeasurement(draft,point,side);
    const [width,level]=mark.end;
    const px=x(width),py=y(level);
    const shortLabel=label.length>15?label.slice(0,14)+'…':label;
    const active=point===selectedPivot?' class="leg-point-selected"':'';
    return `<g data-leg-point="${point}" data-leg-side="${side}"${active}><title>${escapeHTML(label)}</title>
     <path class="leg-guide" d="M ${origin} ${py} H ${px}"/>
     <circle class="leg-hit-point" cx="${px}" cy="${py}" r="20"/>
     <circle class="leg-handle" cx="${px}" cy="${py}" r="6"/>
     <text class="leg-point-name" x="${px+sign*9}" y="${py-9}" text-anchor="${side==='front'?'end':'start'}">${escapeHTML(shortLabel)}</text>
    </g>`;
   }).join('');
   return `<g class="leg-pattern" data-leg-panel="${side}">
    <text class="leg-panel-title" x="${x(inside/2)}" y="17" text-anchor="middle">${side==='front'?'Front':'Back'}</text>
    ${grid}<path class="leg-axis" d="M ${origin} ${y(height)} V ${y(draft.rise)} H ${x(inside)}"/>
    <path class="leg-cut-band" fill-rule="evenodd" d="${cut} ${outline}"/>
    <path class="leg-cut-line" d="${cut}"/>
    <path class="leg-panel-outline" d="${outline}"/>
    ${drag?.ghosts?.[side]?`<path class="leg-motion-ghost" d="${drag.ghosts[side]}"/>`:''}
    ${handles}
   </g>`;
  });
  chart.innerHTML=`<title>Front and back pattern panels with draggable knee, hem, and custom pivot points</title>${panels.join('')}`;
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
  syncPivotEditor(values);
  drawPanels(values);
 }

 function syncPivotEditor(values){
  if(!values.pivots.some(pivot=>pivot.id===selectedPivot))selectedPivot=values.pivots[0]?.id??null;
  const selected=values.pivots.find(pivot=>pivot.id===selectedPivot);
  pivotEditor.hidden=!selected;
  if(!selected)return;
  pivotSelect.innerHTML=values.pivots.map(pivot=>`<option value="${pivot.id}">${escapeHTML(pivot.name)}</option>`).join('');
  pivotSelect.value=selected.id;
  pivotName.value=selected.name;
  pivotWidth.value=formatNumber(selected.width,values.unit);
  pivotHeight.value=formatNumber(selected.height,values.unit);
  for(const input of [pivotName,pivotWidth,pivotHeight])input.removeAttribute('aria-invalid');
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
  const point=drag.point;
  const current=values[point]??values.pivots.find(pivot=>pivot.id===point);
  const step=values.unit==='cm'?0.1/unitScale:1/16;
  const snap=value=>Math.round(value/step)*step;
  const offsetX=(p.x-drag.origin.x)*direction(drag.side)/(limits.scale*drag.share);
  const offsetY=(p.y-drag.origin.y)/limits.scale;
  const minY=point==='knee'?values.minKnee+step:point==='hem'?Math.max(values.knee.height,...values.draft.pivots.map(pivot=>pivot.height))+step:step;
  const maxY=point==='hem'?limits.height-values.draft.rise:values.hem.height-step;
  const width=clamp(snap(drag.start.width+offsetX),step,limits.inside/Math.max(values.frontShare,1-values.frontShare));
  const height=minY<=maxY?clamp(snap(drag.start.height+offsetY),minY,maxY):current.height;
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
  const start=values[point]??values.pivots.find(pivot=>pivot.id===point);
  if(!start)return;
  const ghosts=motionEnabled()?Object.fromEntries(sides.map(side=>[side,chart.querySelector(`[data-leg-panel="${side}"] .leg-panel-outline`)?.getAttribute('d')])):null;
  drag={point,side,share,id:event.pointerId,origin:originPoint,start,ghosts};
  if(!points.includes(point))selectedPivot=point;
  event.preventDefault();
  chart.setPointerCapture(event.pointerId);
  if(ghosts||!points.includes(point))redraw();
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
  releaseLegGhosts(chart);
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
    message.textContent=invalid?'Enter a positive measurement.':'Keep the knee and pivot points at different heights between the crotch and hem.';
    return;
   }
   message.textContent='';
   redraw();
  }
  input.addEventListener('change',commit);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')input.blur();});
 }

 dialog.querySelector('[data-add-pivot]').addEventListener('click',()=>{
  const id=add();
  if(!id){message.textContent='There is no room for another point between the crotch and hem.';return;}
  selectedPivot=id;
  message.textContent='';
  redraw();
  pivotName.focus();
 });
 pivotSelect.addEventListener('change',()=>{selectedPivot=pivotSelect.value;message.textContent='';redraw();});
 dialog.querySelector('[data-remove-pivot]').addEventListener('click',()=>{
  if(!selectedPivot||!remove(selectedPivot))return;
  message.textContent='';
  redraw();
  (selectedPivot?pivotSelect:dialog.querySelector('[data-add-pivot]')).focus();
 });
 for(const [key,input] of [['name',pivotName],['width',pivotWidth],['height',pivotHeight]]){
  input.addEventListener('change',()=>{
   const value=key==='name'?input.value.trim():parseLength(input.value,read().unit).value;
   if(!value||(key!=='name'&&value<=0)||!apply(selectedPivot,{[key]:value})){
    input.setAttribute('aria-invalid','true');
    message.textContent=key==='height'?'Use a distinct height between the crotch and hem.':key==='width'?'Enter a positive width.':'Enter a name for this point.';
    return;
   }
   input.removeAttribute('aria-invalid');
   message.textContent='';
   redraw();
  });
  input.addEventListener('keydown',event=>{if(event.key==='Enter')input.blur();});
 }

 dialog.addEventListener('close',()=>{
  if(frame)cancelAnimationFrame(frame);
  drag=null;frame=0;pending=null;
 });
 return {open(){limits=null;message.textContent='';redraw();dialog.showModal();}};
}
