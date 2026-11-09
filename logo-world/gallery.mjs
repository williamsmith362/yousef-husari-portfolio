import { photoFrame } from './photos.mjs';

export function galleryWindow(index, count, radius = 2) {
  return {first:Math.max(0,index-radius),last:Math.min(count-1,index+radius)};
}
export function nearestGalleryIndex(left, geometry, count) {
  return Math.max(0,Math.min(count-1,Math.round((left+geometry.width/2-geometry.firstCenter)/Math.max(1,geometry.step))));
}

export function mountGallery({ pieces, onOpen = () => {}, onClose = () => {} }) {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const photographs=pieces.flatMap((piece,pieceIndex)=>piece.images.map((image,photoIndex)=>({piece,pieceIndex,image,photoIndex})));
  const photoIndices=new Map(photographs.map((photo,index)=>[photo.piece.id+':'+photo.photoIndex,index]));
  const dialog=document.querySelector('.world-gallery');
  const rail=dialog.querySelector('.gallery-rail');
  const count=dialog.querySelector('.gallery-count');
  const previous=dialog.querySelector('#gallery-previous');
  const next=dialog.querySelector('#gallery-next');
  const slides=photographs.map((photo,index)=>{
    const slide=document.createElement('figure');
    slide.className='gallery-slide';
    slide.setAttribute('role','group');
    slide.setAttribute('aria-roledescription','slide');
    slide.setAttribute('aria-label',(index+1)+' of '+photographs.length);
    slide.setAttribute('aria-hidden','true');
    rail.append(slide);
    return slide;
  });
  const loaded=new Set(), pointers=new Set();
  let activePhoto=0, visiblePhoto=-1, intendedPhoto=null, lastFocus=null;
  let scrollFrame=0, openFrame=0, wheelTimer=0, settleTimer=0, resizeTimer=0;
  let railDrag=null, nativeTouches=0, pendingResize=false, lastScroll=-Infinity;
  let measuredWidth=innerWidth, resizePhoto=null;
  let geometry={step:1,firstCenter:0,width:0};

  function releaseImage(index) {
    slides[index].querySelector('img')?.removeAttribute('src');
    slides[index].replaceChildren();
    loaded.delete(index);
  }
  function hydrateGallery(index) {
    const range=galleryWindow(index,slides.length,innerWidth<620?2:3);
    for(const i of loaded) if(i<range.first || i>range.last) releaseImage(i);
    for(let i=range.first;i<=range.last;i++) if(!loaded.has(i)) {
      const frame=photoFrame(photographs[i].image);
      const image=frame.querySelector('img');
      image.loading='eager';
      image.fetchPriority=i===index?'high':'low';
      slides[i].append(frame);loaded.add(i);
    }
  }
  function measureGeometry() {
    const first=slides[0];
    geometry={step:slides.length>1?slides[1].offsetLeft-first.offsetLeft:first.offsetWidth,firstCenter:first.offsetLeft+first.offsetWidth/2,width:rail.clientWidth};
    measuredWidth=innerWidth;
  }
  function nearestPhoto() {return nearestGalleryIndex(rail.scrollLeft,geometry,slides.length);}
  function updateGallery(index,force=false) {
    const destination=Math.max(0,Math.min(slides.length-1,index));
    if(destination===visiblePhoto && !force) return;
    activePhoto=destination;hydrateGallery(destination);
    if(visiblePhoto>=0 && visiblePhoto!==destination) slides[visiblePhoto].setAttribute('aria-hidden','true');
    slides[destination].setAttribute('aria-hidden','false');
    visiblePhoto=destination;
    count.textContent=String(destination+1).padStart(2,'0')+' / '+photographs.length;
    previous.disabled=destination===0;next.disabled=destination===slides.length-1;
  }
  function goToPhoto(index,animate=true) {
    const destination=Math.max(0,Math.min(slides.length-1,index));
    if(Math.abs(destination-activePhoto)>4) animate=false;
    intendedPhoto=destination;hydrateGallery(destination);
    const left=geometry.firstCenter+destination*geometry.step-geometry.width/2;
    rail.scrollTo({left,behavior:animate && !reduce.matches?'smooth':'auto'});
    if(!animate) updateGallery(destination);
  }
  function setHeight() {dialog.style.setProperty('--gallery-height',innerHeight+'px');}
  function queueResize() {
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      if(!dialog.open || !pendingResize) return;
      // Safari's browser bars can resize the viewport during a native swipe.
      // Let that swipe and its momentum finish before changing slide geometry.
      if(nativeTouches || pointers.size || railDrag || performance.now()-lastScroll<160) {queueResize();return;}
      const index=resizePhoto??nearestPhoto();pendingResize=false;resizePhoto=null;
      setHeight();measureGeometry();goToPhoto(index,false);
    },100);
  }
  function openGallery(pieceIndex,photoIndex,trigger) {
    onOpen();lastFocus=trigger;
    const destination=photoIndices.get(pieces[pieceIndex].id+':'+photoIndex);
    document.documentElement.classList.add('gallery-open');
    setHeight();rail.style.scrollSnapType='none';
    updateGallery(destination,true);dialog.showModal();
    measureGeometry();goToPhoto(destination,false);
    openFrame=requestAnimationFrame(()=>{
      if(!dialog.open) return;
      measureGeometry();goToPhoto(destination,false);rail.style.scrollSnapType='';
    });
  }
  function closeGallery() {
    clearTimeout(wheelTimer);clearTimeout(settleTimer);clearTimeout(resizeTimer);
    cancelAnimationFrame(openFrame);cancelAnimationFrame(scrollFrame);scrollFrame=0;
    railDrag=null;nativeTouches=0;pointers.clear();pendingResize=false;resizePhoto=null;intendedPhoto=null;
    delete rail.dataset.dragging;rail.style.scrollSnapType='';
    dialog.close();document.documentElement.classList.remove('gallery-open');
    for(const i of [...loaded]) releaseImage(i);
    onClose();lastFocus?.focus({preventScroll:true});
  }
  rail.addEventListener('scroll',()=>{
    if(!dialog.open) return;
    // A narrower viewport can clamp scrollLeft before the resize event. Keep
    // the selected photograph until the new slide geometry has been measured.
    if(innerWidth!==measuredWidth) {
      resizePhoto??=activePhoto;pendingResize=true;queueResize();return;
    }
    if(resizePhoto!==null) return;
    lastScroll=performance.now();
    clearTimeout(settleTimer);settleTimer=setTimeout(()=>{intendedPhoto=null;},160);
    if(!scrollFrame) scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(dialog.open && resizePhoto===null) updateGallery(nearestPhoto());});
  },{passive:true});
  rail.addEventListener('wheel',event=>{
    if(event.ctrlKey || event.metaKey) return;
    event.preventDefault();event.stopPropagation();intendedPhoto=null;
    const factor=event.deltaMode===1?16:event.deltaMode===2?geometry.width:1;
    const distance=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
    clearTimeout(wheelTimer);rail.style.scrollSnapType='none';
    rail.scrollBy({left:distance*factor,behavior:'auto'});
    wheelTimer=setTimeout(()=>{rail.style.scrollSnapType='';if(dialog.open) goToPhoto(nearestPhoto());},170);
  },{passive:false});
  rail.addEventListener('pointerdown',event=>{
    intendedPhoto=null;clearTimeout(wheelTimer);
    if(event.pointerType!=='mouse') {pointers.add(event.pointerId);return;}
    if(event.button!==0) return;
    railDrag={id:event.pointerId,x:event.clientX,scroll:rail.scrollLeft};
    rail.setPointerCapture(event.pointerId);rail.style.scrollSnapType='none';rail.dataset.dragging='true';
  });
  rail.addEventListener('pointermove',event=>{if(railDrag && railDrag.id===event.pointerId) rail.scrollLeft=railDrag.scroll-(event.clientX-railDrag.x);});
  function endDrag(event) {
    pointers.delete(event.pointerId);
    if(railDrag && railDrag.id===event.pointerId) {
      railDrag=null;delete rail.dataset.dragging;
      if(rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      rail.style.scrollSnapType='';goToPhoto(nearestPhoto());
    }
    if(pendingResize) queueResize();
  }
  for(const name of ['pointerup','pointercancel','lostpointercapture']) rail.addEventListener(name,endDrag);
  for(const name of ['touchstart','touchend','touchcancel']) rail.addEventListener(name,event=>{
    nativeTouches=event.touches.length;intendedPhoto=null;
    if(pendingResize) queueResize();
  },{passive:true});
  addEventListener('resize',()=>{if(dialog.open){if(innerWidth!==measuredWidth) resizePhoto??=activePhoto;pendingResize=true;queueResize();}});
  rail.addEventListener('keydown',event=>{if(event.key==='Home' || event.key==='End'){event.preventDefault();goToPhoto(event.key==='Home'?0:slides.length-1,false);}});
  dialog.querySelector('.close-button').addEventListener('click',closeGallery);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeGallery();});
  previous.addEventListener('click',()=>goToPhoto((intendedPhoto??activePhoto)-1));
  next.addEventListener('click',()=>goToPhoto((intendedPhoto??activePhoto)+1));
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft' || event.key==='ArrowRight') {event.preventDefault();goToPhoto((intendedPhoto??activePhoto)+(event.key==='ArrowRight'?1:-1));}
  });
  return {dialog,open:openGallery,close:closeGallery,goToPhoto};
}
