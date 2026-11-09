const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Exact critically damped spring step; equal timing at 60Hz and 120Hz.
export function spring(value, velocity, target, dt, frequency = 22) {
  const offset = value - target, impulse = velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  return [target + (offset + impulse * dt) * decay, (velocity - frequency * impulse * dt) * decay];
}

export function liftTargets(items, selected, camera, pivot, size, reduced = false) {
  const targets = new Map();
  if (!selected) return targets;
  const z = camera.z, length = Math.max(selected.w, selected.h) * z;
  const desired = Math.min(200, Math.max(length * (reduced ? 1.12 : 1.42), reduced ? 72 : Math.min(116, size.w * .26)));
  const available = Math.min((size.w-20)/(selected.w*z),(size.h-20)/(selected.h*z));
  const scale = Math.min(Math.max(1,available),clamp(desired / length, 1.08, reduced ? 32 : 48));
  const center = {x:selected.x + selected.w / 2, y:selected.y + selected.h / 2};
  const screen = {x:pivot.x + (center.x-camera.x)*z, y:pivot.y + (center.y-camera.y)*z};
  const halfW = selected.w*z*scale/2, halfH = selected.h*z*scale/2;
  const edgeW=Math.min(halfW,size.w/2-10), edgeH=Math.min(halfH,size.h/2-10);
  const dx = (clamp(screen.x, edgeW+10, size.w-edgeW-10)-screen.x)/z;
  const dy = (clamp(screen.y, edgeH+10, size.h-edgeH-10)-screen.y)/z;
  targets.set(selected, {x:dx,y:dy,scale});
  if (reduced) return targets;
  const compact=size.w<620;
  const radius = Math.max(compact?44:68, Math.max(halfW,halfH)*(compact?1.25:1.65));
  for (const item of items) {
    if (item === selected) continue;
    const x = (item.x+item.w/2-center.x)*z, y = (item.y+item.h/2-center.y)*z;
    const distance = Math.hypot(x,y);
    if (distance >= radius) continue;
    const falloff = (1-distance/radius)**2;
    const push = Math.min(compact?14:24, 9+desired*.14)*falloff;
    const angle = distance < .01 ? item.photoIndex*2.4+item.project.index : Math.atan2(y,x);
    targets.set(item, {x:Math.cos(angle)*push/z,y:Math.sin(angle)*push/z,scale:1});
  }
  return targets;
}

// Use the original, unmoving garment coordinates for targeting. A picture that
// yields to its neighbour cannot steal the hover from a stationary pointer.
export function shapeHit(item, point, mask, pose = {x:0,y:0,scale:1}) {
  const u = (point.x-item.x-item.w/2-pose.x)/(item.w*pose.scale)+.5;
  const v = (point.y-item.y-item.h/2-pose.y)/(item.h*pose.scale)+.5;
  const b=item.image.bounds, ratio=b.width/b.height;
  const cw=ratio>item.ratio ? .91 : .91*ratio/item.ratio;
  const ch=ratio>item.ratio ? .91*item.ratio/ratio : .91;
  const cx=(u-(1-cw)/2)/cw, cy=(v-(1-ch)/2)/ch;
  if (cx<0 || cx>1 || cy<0 || cy>1) return false;
  if (!mask) return true;
  const sx=clamp(Math.floor((b.x+cx*b.width)/b.sourceWidth*mask.w),0,mask.w-1);
  const sy=clamp(Math.floor((b.y+cy*b.height)/b.sourceHeight*mask.h),0,mask.h-1);
  const bit=sy*mask.w+sx;
  return Boolean(mask.bits[bit>>3] & (1<<(bit&7)));
}

export function createLivingLogo({items,view,getScene,ready,reduced,onDetail}) {
  let active=null, targets=new Map(), frame=0, lastTime=0;
  let candidate=null, switchTimer=0, leaveTimer=0, lastPoint=null, warming=null;
  const masks=new Map(), moving=new Set();
  for (const item of items) item.lift={x:0,y:0,scale:1,vx:0,vy:0,vs:0};
  function warm() {
    if (!warming) warming=fetch('/garment-shapes.json').then(r=>{if(!r.ok)throw Error('mask unavailable');return r.json();}).then(data=>{
      for(const [file,encoded] of Object.entries(data.masks)) masks.set(file,{w:data.width,h:data.height,bits:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))});
    }).catch(()=>{});
    return warming;
  }
  function worldPoint(point) {
    const {camera,pivot}=getScene();
    return {x:camera.x+(point.x-pivot.x)/camera.z,y:camera.y+(point.y-pivot.y)/camera.z};
  }
  function hit(item,point,expanded=false) {return shapeHit(item,point,masks.get(item.image.file),expanded?item.lift:undefined);}
  function targetAt(point,preferExpanded=false,touch=false) {
    if (!ready()) return null;
    const p=worldPoint(point);
    if (preferExpanded && active && hit(active,p,true)) return active;
    const direct=items.find(item=>item.visible && hit(item,p));
    if (direct) return direct;
    if (active && hit(active,p,true)) return active;
    if (touch) {
      const {camera}=getScene(), d=7/camera.z;
      for (const offset of [{x:d,y:0},{x:-d,y:0},{x:0,y:d},{x:0,y:-d}]) {
        const near=items.find(item=>item.visible && hit(item,{x:p.x+offset.x,y:p.y+offset.y}));
        if (near) return near;
      }
    }
    return null;
  }
  function render(item) {
    const s=item.lift, settling=Math.abs(s.scale-1)>.002 || Math.hypot(s.x,s.y)>.05;
    item.frame.style.transform=settling ? 'translate('+s.x.toFixed(3)+'px,'+s.y.toFixed(3)+'px) scale('+s.scale.toFixed(5)+')' : '';
    item.frame.style.willChange=settling ? 'transform' : '';
    item.element.style.zIndex=item===active ? '100' : settling ? '50' : '';
    item.element.dataset.lift=s.scale.toFixed(4);
  }
  function tick(time) {
    frame=0;
    const dt=lastTime ? Math.min(.05,(time-lastTime)/1000) : 1/60;
    lastTime=time;
    for (const item of moving) {
      const s=item.lift, t=targets.get(item)||{x:0,y:0,scale:1};
      if (reduced()) {s.x=t.x;s.y=t.y;s.scale=t.scale;s.vx=s.vy=s.vs=0;}
      else {
        [s.x,s.vx]=spring(s.x,s.vx,t.x,dt);
        [s.y,s.vy]=spring(s.y,s.vy,t.y,dt);
        [s.scale,s.vs]=spring(s.scale,s.vs,t.scale,dt);
      }
      const resting=Math.abs(s.x-t.x)<.03 && Math.abs(s.y-t.y)<.03 && Math.abs(s.scale-t.scale)<.0005 && Math.abs(s.vx)+Math.abs(s.vy)+Math.abs(s.vs)<.08;
      if(resting) {s.x=t.x;s.y=t.y;s.scale=t.scale;s.vx=s.vy=s.vs=0;moving.delete(item);}
      render(item);
    }
    if(moving.size) frame=requestAnimationFrame(tick);
    else {lastTime=0;onDetail();}
  }
  function start() {if(!frame && moving.size) frame=requestAnimationFrame(tick);}
  function cancelPending() {clearTimeout(switchTimer);clearTimeout(leaveTimer);candidate=null;}
  function emphasize(item,touch=false) {
    if(item && !ready()) return;
    cancelPending();
    if(active===item) return;
    if(active) {delete active.element.dataset.emphasized;active.element.removeAttribute('aria-pressed');}
    active=item;
    if(item) {
      warm();item.element.dataset.emphasized='true';
      if(touch) item.element.setAttribute('aria-pressed','true');
      view.dataset.hover=item.image.file;
    } else delete view.dataset.hover;
    const {camera,pivot,size}=getScene();
    const previous=targets;
    targets=liftTargets(items,item,camera,pivot,size,reduced());
    for(const target of previous.keys()) moving.add(target);
    for(const target of targets.keys()) moving.add(target);
    start();onDetail();
  }
  function clear(immediate=false) {
    emphasize(null);
    if(immediate) {
      cancelAnimationFrame(frame);frame=lastTime=0;
      for(const item of moving) {Object.assign(item.lift,{x:0,y:0,scale:1,vx:0,vy:0,vs:0});render(item);}
      moving.clear();targets.clear();
    }
  }
  function pointer(point) {
    if(!ready()) return;
    lastPoint=point;warm();
    const next=targetAt(point);
    clearTimeout(leaveTimer);
    if(next===active) {clearTimeout(switchTimer);candidate=null;return;}
    if(!next) {
      clearTimeout(switchTimer);candidate=null;
      leaveTimer=setTimeout(()=>{if(!targetAt(lastPoint)) clear();},65);
    } else if(!active) emphasize(next);
    else if(candidate!==next) {
      clearTimeout(switchTimer);candidate=next;
      switchTimer=setTimeout(()=>{if(targetAt(lastPoint)===next) emphasize(next);},35);
    }
  }
  return {warm,pointer,targetAt,emphasize,clear,selected:()=>active};
}
