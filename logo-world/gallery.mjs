import { photoFrame } from './photos.mjs?v=momentum-images-1';
import { orderCatalogProjects } from './catalog-order.mjs?v=grouped-trousers-1';
import { createImageQueue, replaceDecodedImage } from './image-loading.mjs?v=momentum-images-1';

export function galleryWindow(index, count, radius = 2) {
  return {first:Math.max(0,index-radius),last:Math.min(count-1,index+radius)};
}
export function nearestGalleryIndex(left, geometry, count) {
  return Math.max(0,Math.min(count-1,Math.round((left+geometry.width/2-geometry.firstCenter)/Math.max(1,geometry.step))));
}

export function mountGallery({ pieces, onOpen = () => {}, onClose = () => {} }) {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const imageQueue=createImageQueue({concurrency:innerWidth<620?2:4});
  const pieceIndices=new Map(pieces.map((piece,index)=>[piece.id,index]));
  const photographs=orderCatalogProjects(pieces).flatMap(piece=>piece.images.map((image,photoIndex)=>({piece,pieceIndex:pieceIndices.get(piece.id),image,photoIndex})));
  const photoIndices=new Map(photographs.map((photo,index)=>[photo.piece.id+':'+photo.photoIndex,index]));
  const dialog=document.querySelector('.world-gallery');
  const rail=dialog.querySelector('.gallery-rail');
  const count=dialog.querySelector('.gallery-count');
  const descriptions={"04": "crocodile-textured backpack with alyx buckles.", "02": "black denim jacket with red lining.", "49": "french terry hoodie, based on a favorite.", "06": "canvas messenger bag with tied strap.", "35": "quilted canvas bag with rose lining.", "20": "canvas pants with striped pocket lining.", "21": "black canvas jacket with copper hardware.", "27": "green canvas carpenter pants with bronze hardware.", "25": "heavy-nep denim with plaid lining.", "03": "cream canvas pants with workwear pockets.", "47": "cream canvas pants with button fly.", "22": "indigo shorts with double-button waistband.", "09": "hybrid pants combining canvas and denim.", "10": "black denim with crocodile pocket accents.", "41": "raw denim with plaid-lined pockets.", "24": "black selvedge jeans with welt pockets.", "42": "black selvedge jeans with buckle back.", "43": "raw denim with blue floral lining.", "44": "black carpenter pants with red floral lining.", "01": "selvedge denim with contrasting stitching.", "34": "handmade denim cushion cover with pleats.", "48": "slub denim jeans with crocodile accents.", "18": "indigo trousers with patch pockets.", "45": "skull backpack with floral lining", "05": "13 oz selvedge low rise jeans with buckle back", "07": "charcoal denim with crocodile patch.", "17": "nine pocket indigo denim", "16": "straight cut raw denim with frog pocket lining", "19": "black wide leg jeans with contrast stitching", "23": "selvedge denim with double-button waist.", "08": "black bootcut 14.5 oz broken twill pants", "46": "12.5 loose fit denim jeans from turkey", "26": "asymmetric back pockets with contrast stitching.", "13": "denim handbags", "11": "crocodile-textured pouches with zip closure.", "12": "silver crocodile-textured pouch with white zipper.", "39": "crocodile-textured pouch with red lining.", "40": "crocodile-textured pouch with blue lining.", "28": "zip cases with red lining.", "29": "denim pouch with wrist strap.", "14": "quilted pouch with zipper closure.", "37": "quilted box pouch with monogram detail.", "31": "box pouch with grey lining.", "38": "denim pouches with printed linings.", "32": "quilted pouch for a watch.", "30": "quilted laptop case with blue binding", "33": "quilted laptop case with purple binding", "36": "quilted laptop case with red binding"};
  const caption=document.createElement('p');
  caption.className='gallery-description';
  caption.setAttribute('aria-live','polite');
  dialog.querySelector('.gallery-footer').before(caption);
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
  const loaded=new Set(), decoded=new Set(), pointers=new Set();
  let galleryActive=false;
  let activePhoto=0, visiblePhoto=-1, intendedPhoto=null, lastFocus=null;
  let scrollFrame=0, openFrame=0, wheelTimer=0, settleTimer=0, resizeTimer=0;
  let railDrag=null, nativeTouches=0, pendingResize=false, lastScroll=-Infinity;
  let measuredWidth=innerWidth, resizePhoto=null;
  let geometry={step:1,firstCenter:0,width:0};

  function releaseImage(index) {
    imageQueue.cancel(slides[index]);decoded.delete(index);
    slides[index].querySelector('img')?.removeAttribute('src');
    slides[index].replaceChildren();
    loaded.delete(index);
  }
  function hydrateGallery(index) {
    const range=galleryWindow(index,slides.length,innerWidth<620?2:3);
    for(const i of loaded) if(i<range.first || i>range.last) releaseImage(i);
    for(let i=range.first;i<=range.last;i++) {
      if(!loaded.has(i)) {
        const frame=photoFrame(photographs[i].image,.8,false,true);
        frame.querySelector('img').dataset.imageReady='false';
        slides[i].append(frame);loaded.add(i);
      }
      if(!decoded.has(i)) {
        const image=slides[i].querySelector('img');
        imageQueue.request(slides[i],'/pieces/'+photographs[i].image.file+'.webp',{
          priority:Math.abs(i-index),
          wanted:()=>galleryActive && loaded.has(i) && slides[i].contains(image),
          ready(photo){replaceDecodedImage(image,photo);decoded.add(i);}
        });
      }
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
    caption.textContent=descriptions[photographs[destination].piece.id] || '';
    caption.hidden=!caption.textContent;
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
    galleryActive=true;imageQueue.resume();
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
    galleryActive=false;imageQueue.clear();imageQueue.pause();
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden) imageQueue.pause();else if(galleryActive) imageQueue.resume();});
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

