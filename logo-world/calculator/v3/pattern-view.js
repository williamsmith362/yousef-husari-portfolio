import {formatLength} from './model.js';

export const panelBounds=v=>{const inside=v.seat-v.offset;return {inside,outside:inside-v.waist,min:Math.min(0,inside-v.waist),max:Math.max(inside,v.seat,v.riseH,v.knee,v.calf,v.hem)};};
export function panelOutline(r,side,xy){
 const v=r[side],bounds=panelBounds(v);
  const ys=[r.rise,r.rise+r.kneeY,r.rise+r.kneeY+r.section2,r.panelLength];
  const xs=[v.riseH,v.knee,v.calf,v.hem];
  const ds=ys.slice(1).map((y,i)=>(xs[i+1]-xs[i])/(y-ys[i]));
  const m=[ds[0],0,0,ds[2]];
  for(let i=1;i<3;i++)m[i]=ds[i-1]*ds[i]<=0?0:2/(1/ds[i-1]+1/ds[i]);
  for(let i=0;i<3;i++){
   if(ds[i]===0){m[i]=m[i+1]=0;continue;}
   const a=m[i]/ds[i],b=m[i+1]/ds[i],norm=a*a+b*b;
   if(norm>9){const t=3/Math.sqrt(norm);m[i]=t*a*ds[i];m[i+1]=t*b*ds[i];}
  }
  let d=`M ${xy(bounds.outside,0)} L ${xy(bounds.inside,0)} `;
  if(side==='back'){
   const ty=Math.min(r.seatY,r.rise-r.seatY)*.3,tx=Math.min(v.offset*.5,(v.riseH-v.seat)*.25);
   d+=`C ${xy(bounds.inside+Math.min(.05,v.offset*.25),r.seatY*.34)} ${xy(v.seat-tx,r.seatY-ty)} ${xy(v.seat,r.seatY)} C ${xy(v.seat+tx,r.seatY+ty)} ${xy(v.riseH-(v.riseH-v.seat)*.4,r.rise)} ${xy(v.riseH,r.rise)} `;
  }else{
   const k=.5522847498;
   d+=`C ${xy(bounds.inside,r.seatY*.34)} ${xy(v.seat,r.seatY*.7)} ${xy(v.seat,r.seatY)} C ${xy(v.seat,r.seatY+k*(r.rise-r.seatY))} ${xy(v.riseH-k*(v.riseH-v.seat),r.rise)} ${xy(v.riseH,r.rise)} `;
  }
  for(let i=0;i<3;i++){const h=ys[i+1]-ys[i];d+=`C ${xy(xs[i]+m[i]*h/3,ys[i]+h/3)} ${xy(xs[i+1]-m[i+1]*h/3,ys[i+1]-h/3)} ${xy(xs[i+1],ys[i+1])} `;}
  d+=`L ${xy(0,r.panelLength)} L ${xy(0,r.seatY)} C ${xy(0,r.seatY*.58)} ${xy(bounds.outside*.45,r.seatY*.2)} ${xy(bounds.outside,0)} Z`;
 return d;
}

// Exact projected dimensions in the same inch coordinates as panelOutline.
// Heights are vertical distances; waist and seat offset are construction targets.
export function patternMeasurement(r,key,side){
 if(!r?.valid||!['front','back'].includes(side))return null;
 const row=r.rows.find(row=>row.key===key),v=r[side],bounds=panelBounds(v);
 const value=row?.[side==='front'?'f':'b'];
 if(value===null||value===undefined)return null;
 const knee=r.rise+r.kneeY,calf=knee+r.section2,x=bounds.min-1.4;
 const positions={
  panelLength:[[x,0],[x,r.panelLength]],
  rise:[[x,0],[x,r.rise]],
  seatY:[[x,0],[x,r.seatY]],
  seat:[[0,r.seatY],[v.seat,r.seatY]],
  riseH:[[0,r.rise],[v.riseH,r.rise]],
  offset:[[bounds.inside,r.seatY],[v.seat,r.seatY]],
  waist:[[bounds.outside,0],[bounds.inside,0]],
  section1:[[x,r.rise],[x,knee]],
  knee:[[0,knee],[v.knee,knee]],
  section2:[[x,knee],[x,calf]],
  calf:[[0,calf],[v.calf,calf]],
  section3:[[x,calf],[x,r.panelLength]],
  hem:[[0,r.panelLength],[v.hem,r.panelLength]]
 };
 const points=positions[key];
 return points?{start:points[0],end:points[1],value,vertical:points[0][0]===points[1][0]}:null;
}

// One scale for both panels and both axes, including focused detail views.
export function patternView(r,{key=null,unit='in',fractions=false,detail=false,id='currentPattern'}={}){
 if(!r?.valid)return '';
 const width=500,pad=42,gap=44,top=64;
 const f=panelBounds(r.front),b=panelBounds(r.back);
 const s=Math.min(14,(width-2*pad-gap)/(f.max-f.min+b.max-b.min),560/r.panelLength);
 const height=top+r.panelLength*s+36,n=v=>Number(v.toFixed(3));
 const selected=r.rows.find(row=>row.key===key);
 const measurements=['front','back'].map(side=>patternMeasurement(r,key,side)).filter(Boolean);
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
  const knee=r.rise+r.kneeY,calf=knee+r.section2;
  const d=panelOutline(r,side,xy);
  const levels=[[r.seatY,v.seat],[r.rise,v.riseH],[knee,v.knee],[calf,v.calf]].map(([y,x])=>`M ${xy(0,y)} L ${xy(x,y)}`).join(' ');
  const reference=`M ${xy(0,0)} L ${xy(0,r.panelLength)} M ${xy(bounds.inside,0)} L ${xy(bounds.inside,r.seatY)}`;
  const gx=v.hem/2,gy1=r.rise+r.leg*.1,gy2=r.panelLength-r.leg*.1;
  const arrow=`M ${xy(gx,gy1)} L ${xy(gx,gy2)}`;
  const lx=origin+direction*(bounds.min+bounds.max)*s/2;
  let dimension='';
  const m=patternMeasurement(r,key,side);
  if(m){
   let [a,c]=[point(m.start),point(m.end)];
   const lift=['waist','offset'].includes(key)?-12:key==='hem'?12:0;
   const extension=m.vertical?`M ${xy(m.start[1]===0?bounds.outside:0,m.start[1])} L ${a.map(n).join(' ')} M ${xy(0,m.end[1])} L ${c.map(n).join(' ')}`:lift?`M ${a.map(n).join(' ')} v ${lift} M ${c.map(n).join(' ')} v ${lift}`:'';
   a=[a[0],a[1]+lift];c=[c[0],c[1]+lift];
   const tx=m.vertical?a[0]-direction*10:(a[0]+c[0])/2;
   const ty=m.vertical?(a[1]+c[1])/2:a[1]-10;
   dimension=`<g class="pattern-dimension" data-side="${side}" data-measurement="${key}" data-value="${m.value}"><path class="dimension-extension" d="${extension}"/><path class="dimension-line" d="M ${a.map(n).join(' ')} L ${c.map(n).join(' ')}" marker-start="url(#${id}Arrow)" marker-end="url(#${id}Arrow)"/><circle cx="${n(a[0])}" cy="${n(a[1])}" r="2.5"/><circle cx="${n(c[0])}" cy="${n(c[1])}" r="2.5"/><text class="dimension-value" x="${n(tx)}" y="${n(ty)}" text-anchor="middle" ${m.vertical?`transform="rotate(-90 ${n(tx)} ${n(ty)})"`:''}>${formatLength(m.value,unit,fractions)}</text></g>`;
  }
  return `<g class="pattern-panel" data-pattern-side="${side}"><g clip-path="url(#${id}Clip)"><path class="level" d="${levels} ${reference}"/><path class="outline" d="${d}"/><path class="grain" d="${arrow}"/></g><text class="panel-title" x="${n(lx)}" y="${n(viewTop+17)}" text-anchor="middle">${side.toUpperCase()}</text>${dimension}</g>`;
 }
 return `<svg class="current-pattern${selected?' has-measurement':''}" viewBox="0 ${n(viewTop)} ${width} ${n(viewBottom-viewTop)}" data-scale="${s}" role="img" aria-labelledby="${id}Title ${id}Description"><title id="${id}Title">${selected?selected.label+' on the front and back panels':'Front and back drafting reference for your current measurements'}</title><desc id="${id}Description">Both panels use the same scale. ${selected?'Highlighted arrows show '+selected.label.toLowerCase()+'. ':''}Straight dimensions match your results. Curved seams are shaping references; cutting allowances are separate.</desc><defs><marker id="${id}Arrow" viewBox="0 0 6 6" markerWidth="5" markerHeight="5" refX="3" refY="3" orient="auto-start-reverse"><path d="M6 3 0 0 0 6Z" fill="var(--pattern-accent)"/></marker><clipPath id="${id}Clip"><rect x="0" y="${n(viewTop+28)}" width="${width}" height="${n(viewBottom-viewTop-28)}"/></clipPath></defs>${panel(r.front,f,'front')}${panel(r.back,b,'back')}</svg>`;
}
