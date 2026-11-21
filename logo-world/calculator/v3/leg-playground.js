import {formatNumber,parseLength} from './model.js';

const points=['knee','hem'];
const axes=['width','height'];
const origin={x:47,y:16};
const size={x:451,y:244};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function createLegPlayground(dialog,{read,apply}){
 const chart=dialog.querySelector('svg');
 const fields=Object.fromEntries([...dialog.querySelectorAll('[data-leg-input]')].map(input=>[input.dataset.legInput,input]));
 const message=dialog.querySelector('[data-leg-message]');
 const unitLabel=dialog.querySelector('[data-leg-unit]');
 let limits,drag,frame=0,pending;
 const factor=unit=>unit==='cm'?2.54:1;

 function redraw(){
  const values=read();
  const scale=factor(values.unit);
  if(!drag){
   const xMax=Math.max(values.knee.width,values.hem.width)*scale;
   const yMax=values.hem.height*scale;
   limits={x:Math.max(limits?.x??0,Math.ceil(xMax*1.25/2)*2),y:Math.max(limits?.y??0,Math.ceil(yMax*1.16/5)*5)};
  }
  unitLabel.textContent=values.unit;
  for(const point of points)for(const axis of axes){
   const input=fields[point+'-'+axis];
   input.value=formatNumber(values[point][axis],values.unit);
   input.removeAttribute('aria-invalid');
  }
  const xPos=value=>origin.x+value*scale/limits.x*size.x;
  const yPos=value=>origin.y+value*scale/limits.y*size.y;
  const grid=[];
  for(let n=0;n<=5;n++){
   const x=origin.x+n*size.x/5,y=origin.y+n*size.y/5;
   grid.push(`<path class="leg-grid" d="M ${x} ${origin.y} v ${size.y} M ${origin.x} ${y} h ${size.x}"/>
   <text x="${x}" y="282" text-anchor="middle">${Number((n*limits.x/5).toFixed(1))}</text>
   <text x="37" y="${y+4}" text-anchor="end">${Number((n*limits.y/5).toFixed(1))}</text>`);
  }
  const k=values.knee,h=values.hem,kx=xPos(k.width),ky=yPos(k.height),hx=xPos(h.width),hy=yPos(h.height);
  const handle=(name,x,y)=>`<g data-leg-point="${name.toLowerCase()}">
   <path class="leg-guide" d="M ${origin.x} ${y} H ${x} V ${origin.y+size.y}"/>
   <circle class="leg-hit-point" cx="${x}" cy="${y}" r="22"/>
   <circle class="leg-handle" cx="${x}" cy="${y}" r="7"/>
   <text class="leg-point-name" x="${x-12}" y="${y-10}" text-anchor="end">${name}</text>
  </g>`;
  chart.innerHTML=`<title>Knee and hem on a width and height grid</title>${grid.join('')}
   <path class="leg-axis" d="M ${origin.x} ${origin.y} v ${size.y} h ${size.x}"/>
   <path class="leg-profile" d="M ${kx} ${ky} L ${hx} ${hy}"/>
   ${handle('Knee',kx,ky)}${handle('Hem',hx,hy)}`;
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
  const offsetX=(p.x-drag.origin.x)*limits.x/size.x/unitScale;
  const offsetY=(p.y-drag.origin.y)*limits.y/size.y/unitScale;
  const minY=drag.point==='knee'?values.minKnee+step:values.knee.height+step;
  const maxY=drag.point==='knee'?values.hem.height-step:limits.y/unitScale;
  const width=clamp(snap(drag.start.width+offsetX),step,limits.x/unitScale);
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
  const point=target.dataset.legPoint;
  drag={point,id:event.pointerId,origin:originPoint,start:read()[point]};
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
