import {formatLength,waistPoint} from './model.js';

export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const panelBounds=(v,pivotWidths=[])=>{const inside=v.seat-v.offset;return {inside,outside:inside-v.waist,min:Math.min(0,inside-v.waist),max:Math.max(inside,v.seat,v.riseH,v.thigh??0,v.knee,v.hem,...pivotWidths)};};
export {waistPoint} from './model.js';
export const pivotWidth=(pivot,side)=>side==='front'?pivot.f:pivot.b;
export const patternBounds=(draft,side)=>panelBounds(draft[side],draft.pivots.map(pivot=>pivotWidth(pivot,side)));
export function panelOutline(r,side,xy,shapeWaist=false){
 const v=r[side],bounds=patternBounds(r,side);
  const stations=[[0,v.riseH],[r.kneeY,v.knee],[r.leg,v.hem],...r.pivots.map(pivot=>[pivot.height,pivotWidth(pivot,side)])];
  if(r.thighY!==null)stations.push([r.thighY,v.thigh]);
  stations.sort((a,b)=>a[0]-b[0]);
  const ys=stations.map(([height])=>height===r.leg?r.panelLength:r.rise+height);
  const xs=stations.map(([,width])=>width);
  const segments=ys.length-1;
  const ds=ys.slice(1).map((y,i)=>(xs[i+1]-xs[i])/(y-ys[i]));
  const m=[ds[0],...Array(segments-1).fill(0),ds.at(-1)];
  for(let i=1;i<segments;i++)m[i]=ds[i-1]*ds[i]<=0?0:2/(1/ds[i-1]+1/ds[i]);
  for(let i=0;i<segments;i++){
   if(ds[i]===0){m[i]=m[i+1]=0;continue;}
   const a=m[i]/ds[i],b=m[i+1]/ds[i],norm=a*a+b*b;
   if(norm>9){const t=3/Math.sqrt(norm);m[i]=t*a*ds[i];m[i+1]=t*b*ds[i];}
  }
  const waist=shapeWaist?waistPoint(side,bounds.inside):{x:bounds.inside,y:0};
  let d=`M ${xy(bounds.outside,0)} L ${xy(waist.x,waist.y)} `;
  if(side==='back'){
   const ty=Math.min(r.seatY,r.rise-r.seatY)*.3,tx=Math.min(v.offset*.5,(v.riseH-v.seat)*.25);
   d+=`C ${xy(waist.x+Math.min(.05,v.offset*.25),r.seatY*.34)} ${xy(v.seat-tx,r.seatY-ty)} ${xy(v.seat,r.seatY)} C ${xy(v.seat+tx,r.seatY+ty)} ${xy(v.riseH-(v.riseH-v.seat)*.4,r.rise)} ${xy(v.riseH,r.rise)} `;
  }else{
   const k=.5522847498;
   const straightRun=v.seat-waist.x,straightDepth=r.seatY-waist.y;
   const curveRun=v.riseH-v.seat,curveDepth=r.rise-r.seatY;
   // Match the straight segment's angle where it meets the crotch curve.
   const handle=straightDepth>0?Math.min(k*curveDepth/straightDepth,straightRun>0?(1-k)*curveRun/straightRun:Infinity):0;
   d+=`L ${xy(v.seat,r.seatY)} C ${xy(v.seat+straightRun*handle,r.seatY+straightDepth*handle)} ${xy(v.riseH-k*curveRun,r.rise)} ${xy(v.riseH,r.rise)} `;
  }
  for(let i=0;i<segments;i++){const h=ys[i+1]-ys[i];d+=`C ${xy(xs[i]+m[i]*h/3,ys[i]+h/3)} ${xy(xs[i+1]-m[i+1]*h/3,ys[i+1]-h/3)} ${xy(xs[i+1],ys[i+1])} `;}
  d+=`L ${xy(0,r.panelLength)} L ${xy(0,r.seatY)} C ${xy(0,r.seatY*.58)} ${xy(bounds.outside*.45,r.seatY*.2)} ${xy(bounds.outside,0)} Z`;
 return d;
}

// Offset the sampled stitching curve in inches, using the allowance for each edge.
export function allowanceOutline(r,side,seams,xy,shapeWaist=false){
 const raw=panelOutline(r,side,(x,y)=>`${x} ${y}`,shapeWaist);
 const commands=raw.match(/[MLCZ][^MLCZ]*/g), points=[], widths=[];
 const front=side==='front',riseCurves=front?1:2;
 const inseamCurves=(r.thighY===null?2:3)+r.pivots.length;
 let current,cubic=0;
 const add=(p,w)=>{if(current){widths.push(w);}points.push(p);current=p;};
 for(const command of commands){
  const type=command[0],a=(command.slice(1).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]).map(Number);
  if(type==='M')add(a,0);
  if(type==='L'){
   const hem=Math.abs(a[1]-r.panelLength)<1e-6&&Math.abs(current[1]-r.panelLength)<1e-6;
   const w=points.length===1?seams.waist:front&&points.length===2?seams.frontStraight:hem?seams.hem:front?seams.frontOut:seams.backOut;
   add(a,w);
  }
  if(type==='C'){
   const start=current;
   const w=front&&cubic===0?seams.frontCurve:cubic<riseCurves+inseamCurves?seams.inseam:front?seams.frontOut:seams.backOut;
   for(let j=1;j<=32;j++){const t=j/32,u=1-t;add([u*u*u*start[0]+3*u*u*t*a[0]+3*u*t*t*a[2]+t*t*t*a[4],u*u*u*start[1]+3*u*u*t*a[1]+3*u*t*t*a[3]+t*t*t*a[5]],w);}cubic++;
  }
 }
 // The final cubic reaches the first point. Keep one vertex at the closure.
 points.pop(); const count=points.length;
 const area=points.reduce((v,p,i)=>{const q=points[(i+1)%count];return v+p[0]*q[1]-q[0]*p[1];},0);
 const edges=points.map((p,i)=>{const q=points[(i+1)%count],dx=q[0]-p[0],dy=q[1]-p[1],len=Math.hypot(dx,dy)||1,sign=area>0?1:-1;return {normal:[sign*dy/len,-sign*dx/len],w:widths[i]};});
 const offset=points.flatMap((p,i)=>{
 const prev=edges[(i+count-1)%count],next=edges[i],a=prev.normal,b=next.normal,det=a[0]*b[1]-a[1]*b[0];
 // Offset both edges at the front rise join so an allowance change stays at the join.
 if(front&&i===2&&prev.w!==next.w)return [[p[0]+a[0]*prev.w,p[1]+a[1]*prev.w],[p[0]+b[0]*next.w,p[1]+b[1]*next.w]];
 let dx,dy;if(Math.abs(det)<1e-5){dx=b[0]*next.w;dy=b[1]*next.w;}else{dx=(prev.w*b[1]-a[1]*next.w)/det;dy=(a[0]*next.w-prev.w*b[0])/det;}
 const limit=Math.max(prev.w,next.w)*4;if(Math.hypot(dx,dy)>limit){dx=(a[0]*prev.w+b[0]*next.w)/2;dy=(a[1]*prev.w+b[1]*next.w)/2;}
 return [[p[0]+dx,p[1]+dy]];});
 return offset.map((p,i)=>`${i?'L':'M'} ${xy(...p)}`).join(' ')+' Z';
}

// Exact projected dimensions in the same inch coordinates as panelOutline.
// Heights are vertical distances; waist and seat offset are construction targets.
export function patternMeasurement(r,key,side){
 if(!r?.valid||!['front','back'].includes(side))return null;
 const row=r.rows.find(row=>row.key===key),v=r[side],bounds=patternBounds(r,side);
 const value=row?.[side==='front'?'f':'b'];
 if(value===null||value===undefined)return null;
 const knee=r.rise+r.kneeY,x=bounds.min-1.4;
 const positions={
  panelLength:[[x,0],[x,r.panelLength]],
  rise:[[x,0],[x,r.rise]],
  seatY:[[x,0],[x,r.seatY]],
  seat:[[0,r.seatY],[v.seat,r.seatY]],
  riseH:[[0,r.rise],[v.riseH,r.rise]],
  offset:[[bounds.inside,r.seatY],[v.seat,r.seatY]],
  thigh:[[0,r.rise+r.thighY],[v.thigh,r.rise+r.thighY]],
  waist:[[bounds.outside,0],[waistPoint(side,bounds.inside).x,waistPoint(side,bounds.inside).y]],
  section1:[[x,r.rise],[x,knee]],
  knee:[[0,knee],[v.knee,knee]],
  kneeToHem:[[x,knee],[x,r.panelLength]],
  hem:[[0,r.panelLength],[v.hem,r.panelLength]]
 };
 const pivot=r.pivots.find(candidate=>candidate.id===key);
 const points=pivot?[[0,r.rise+pivot.height],[pivotWidth(pivot,side),r.rise+pivot.height]]:positions[key];
 return points?{start:points[0],end:points[1],value,vertical:points[0][0]===points[1][0]}:null;
}

// One scale for both panels and both axes, including focused detail views.
export function patternView(r,{key=null,keys=null,unit='in',fractions=false,detail=false,seams=null,id='currentPattern',interactive=false}={}){
 if(!r?.valid)return '';
 const visibleRows=keys!==null?r.rows.filter(row=>keys.includes(row.key)):r.rows.filter(row=>key==='all'||row.key===key);
 const wide=keys!==null||key==='all';
 const width=wide?640:500,pad=wide?88:52,gap=64,top=64;
 const f=patternBounds(r,'front'),b=patternBounds(r,'back');
 const s=Math.min(14,(width-2*pad-gap)/(f.max-f.min+b.max-b.min),560/r.panelLength);
 const height=top+r.panelLength*s+56,n=v=>Number(v.toFixed(3));
 const frontSeatOffset=Math.max(1.8*s,16);
 const frontRiseOffset=Math.max(3.1*s,frontSeatOffset+18);
 const frontHeightOffsets={seatY:frontSeatOffset,rise:frontRiseOffset,panelLength:Math.max(4.4*s,frontRiseOffset+16)};
 const selected=visibleRows.length===1?visibleRows[0]:null;
 const all=visibleRows.length===r.rows.length;
 const title=all?'All measurements on the front and back panels':selected?selected.label+' on the front and back panels':visibleRows.length?'Selected measurements on the front and back panels':'Front and back drafting reference for your current measurements';
 const measurements=visibleRows.flatMap(row=>['front','back'].map(side=>patternMeasurement(r,row.key,side))).filter(Boolean);
 let viewTop=0,viewBottom=height;
 if(detail&&measurements.length){
  const lo=Math.min(...measurements.flatMap(m=>[m.start[1],m.end[1]]));
  const hi=Math.max(...measurements.flatMap(m=>[m.start[1],m.end[1]]));
  const margin=Math.max(2.5,Math.max(f.max-f.min,b.max-b.min)*.3);
  viewTop=Math.max(0,top+(lo-margin)*s-30);
  viewBottom=Math.min(height,top+(hi+margin)*s+30);
 }
 function panel(v,bounds,side){
  const direction=side==='front'?1:-1;
  const origin=side==='front'?pad-bounds.min*s:width-pad+bounds.min*s;
  const point=([x,y])=>[origin+direction*x*s,top+y*s];
  const xy=(x,y)=>point([x,y]).map(n).join(' ');
  const knee=r.rise+r.kneeY;
  const d=panelOutline(r,side,xy,true);
  const allowance=seams?allowanceOutline(r,side,seams,xy,true):'';
  const levels=[[r.seatY,v.seat],[r.rise,v.riseH],...(r.thighY===null?[]:[[r.rise+r.thighY,v.thigh]]),[knee,v.knee],...r.pivots.map(pivot=>[r.rise+pivot.height,pivotWidth(pivot,side)])].map(([y,x])=>`M ${xy(0,y)} L ${xy(x,y)}`).join(' ');
  const centerReference=side==='back'?` M ${xy(waistPoint(side,bounds.inside).x,waistPoint(side,bounds.inside).y)} L ${xy(bounds.inside,r.seatY)}`:'';
  const reference=`M ${xy(0,0)} L ${xy(0,r.panelLength)}${centerReference}`;
  const gx=v.hem/2,gy1=r.rise+r.leg*.1,gy2=r.panelLength-r.leg*.1;
  const arrow=`M ${xy(gx,gy1)} L ${xy(gx,gy2)}`;
  const lx=origin+direction*(bounds.min+bounds.max)*s/2;
  let dimension='';
  for(const {key,label} of visibleRows){
  const m=patternMeasurement(r,key,side);
  if(m){
   const spacedFrontHeight=wide&&side==='front'&&m.vertical&&Object.hasOwn(frontHeightOffsets,key);
   if(wide&&m.vertical&&!spacedFrontHeight){const lane={panelLength:3,rise:1.7,seatY:.4}[key]??.4;m.start[0]-=lane;m.end[0]-=lane;}
   let [a,c]=[point(m.start),point(m.end)];
   if(spacedFrontHeight){
    a[0]=c[0]=pad-frontHeightOffsets[key];
   }
   const lift=['waist','offset'].includes(key)?-12:key==='hem'?12:0;
   const extension=m.vertical?`M ${xy(m.start[1]===0?bounds.outside:0,m.start[1])} L ${a.map(n).join(' ')} M ${xy(0,m.end[1])} L ${c.map(n).join(' ')}`:lift?`M ${a.map(n).join(' ')} v ${lift} M ${c.map(n).join(' ')} v ${lift}`:'';
   a=[a[0],a[1]+lift];c=[c[0],c[1]+lift];
   const tx=m.vertical?a[0]-direction*10:(a[0]+c[0])/2;
   const ty=m.vertical?(a[1]+c[1])/2:(a[1]+c[1])/2-10;
   const value=formatLength(m.value,unit,fractions);
   const line=`M ${a.map(n).join(' ')} L ${c.map(n).join(' ')}`;
   const rotation=m.vertical?` transform="rotate(-90 ${n(tx)} ${n(ty)})"`:'';
   const labelWidth=Math.max(32,value.length*8+10);
   const target=interactive?`<path class="dimension-hit-line${spacedFrontHeight?' dimension-hit-line-front-height':''}" d="${line}"/><rect class="dimension-hit-label" x="${n(tx-labelWidth/2)}" y="${n(ty-16)}" width="${labelWidth}" height="23"${rotation}/>`:'';
   const control=interactive?` role="button" tabindex="0" aria-label="${side==='front'?'Front':'Back'} ${escapeHTML(label)}, ${value}"`:'';
   dimension+=`<g class="pattern-dimension" data-side="${side}" data-measurement="${key}" data-value="${m.value}"${control}><path class="dimension-extension" d="${extension}"/><path class="dimension-line" d="${line}" marker-start="url(#${id}Arrow)" marker-end="url(#${id}Arrow)"/><circle cx="${n(a[0])}" cy="${n(a[1])}" r="2.5"/><circle cx="${n(c[0])}" cy="${n(c[1])}" r="2.5"/>${target}<text class="dimension-value" x="${n(tx)}" y="${n(ty)}" text-anchor="middle"${rotation}>${value}</text></g>`;
  }
  }
  return `<g class="pattern-panel" data-pattern-side="${side}"><g clip-path="url(#${id}Clip)"><path class="level" d="${levels} ${reference}"/>${allowance?`<path class="allowance-fill" fill-rule="evenodd" d="${allowance} ${d}"/><path class="cutting-line" d="${allowance}"/>`:''}<path class="outline" d="${d}"/><path class="grain" d="${arrow}"/></g><text class="panel-title" x="${n(lx)}" y="${n(viewTop+17)}" text-anchor="middle">${side.toUpperCase()}</text>${dimension}</g>`;
 }
 return `<svg class="current-pattern${selected?' has-measurement':''}" viewBox="0 ${n(viewTop)} ${width} ${n(viewBottom-viewTop)}" data-scale="${s}" role="${interactive&&visibleRows.length?'group':'img'}" aria-labelledby="${id}Title" aria-describedby="${id}Description"><title id="${id}Title">${escapeHTML(title)}</title><desc id="${id}Description">Both panels use the same scale. ${selected?'Highlighted arrows show '+escapeHTML(selected.label.toLowerCase())+'. ':''}${interactive&&visibleRows.length?'Choose a dimension for its detail view. ':''}Straight dimensions match your results. Curved seams are shaping references; cutting allowances are separate.</desc><defs><marker id="${id}Arrow" viewBox="0 0 6 6" markerWidth="5" markerHeight="5" refX="3" refY="3" orient="auto-start-reverse"><path d="M6 3 0 0 0 6Z" fill="var(--pattern-accent)"/></marker><clipPath id="${id}Clip"><rect x="0" y="${n(viewTop+28)}" width="${width}" height="${n(viewBottom-viewTop-28)}"/></clipPath></defs>${panel(r.front,f,'front')}${panel(r.back,b,'back')}</svg>`;
}
