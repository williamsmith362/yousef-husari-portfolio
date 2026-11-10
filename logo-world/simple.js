import { mountGallery } from './gallery.mjs?v=momentum-images-1';
import { orderCatalogProjects } from './catalog-order.mjs?v=grouped-trousers-1';
import { EMPTY_IMAGE } from './photos.mjs?v=momentum-images-1';
import { createImageQueue, replaceDecodedImage } from './image-loading.mjs?v=momentum-images-1';

const pieces=JSON.parse(document.getElementById('portfolio-data').textContent);
const covers=[...document.querySelectorAll('.photo-portfolio button.piece')];
const coverQueue=createImageQueue({concurrency:innerWidth<620?2:4});
const coverLoaded=new Set();
let viewerOpen=false, observer=null;
for (const tile of covers) {
  const image=tile.querySelector('img');
  image.src=EMPTY_IMAGE;image.dataset.imageReady='false';image.decoding='async';
  image.removeAttribute('srcset');
}
function requestCover(tile,priority=1) {
  if(coverLoaded.has(tile)) return;
  const image=tile.querySelector('img'),piece=pieces[Number(tile.dataset.piece)];
  coverQueue.request(tile,'/pieces/'+piece.images[0].file+'.webp',{
    priority,wanted:()=>!viewerOpen && tile.isConnected,
    ready(photo){replaceDecodedImage(image,photo);coverLoaded.add(tile);observer?.unobserve(tile);}
  });
}
let pendingMeasure=false;
const gallery=mountGallery({pieces,onOpen(){viewerOpen=true;coverQueue.pause();},onClose(){viewerOpen=false;coverQueue.resume();if(pendingMeasure){pendingMeasure=false;measure();}}});
for(const tile of covers) tile.addEventListener('click',()=>gallery.open(Number(tile.dataset.piece),0,tile));
gallery.dialog.querySelector('[data-home]').addEventListener('click',event=>{event.preventDefault();gallery.close();window.scrollTo({top:0,behavior:'instant'});});
const grid=document.querySelector('.masonry-grid');
const order=new Map(orderCatalogProjects(pieces).map((piece,index)=>[piece.id,index]));
grid.replaceChildren(...[...grid.children].sort((a,b)=>order.get(pieces[Number(a.dataset.piece)].id)-order.get(pieces[Number(b.dataset.piece)].id)));
if('IntersectionObserver' in window) {
  observer=new window.IntersectionObserver(entries=>{for(const entry of entries) if(entry.isIntersecting) requestCover(entry.target);},{rootMargin:'240px'});
  for(const tile of covers) observer.observe(tile);
} else for(const tile of covers) requestCover(tile,2);
requestCover(covers[0],0);
document.addEventListener('visibilitychange',()=>{if(document.hidden) coverQueue.pause();else if(!viewerOpen) coverQueue.resume();});
let width=0, frame=0;
function measure() {
  if(gallery.dialog.open){pendingMeasure=true;return;}
  width=innerWidth;
  for(const tile of grid.children) tile.style.gridRowEnd='span '+Math.ceil(tile.querySelector('.product-photo').getBoundingClientRect().height+parseFloat(getComputedStyle(tile).paddingBottom));
  grid.dataset.masonry='true';
}
addEventListener('resize',()=>{if(innerWidth!==width){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);}});
measure();document.fonts.ready.then(measure);

