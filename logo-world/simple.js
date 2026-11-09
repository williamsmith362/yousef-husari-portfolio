import { mountGallery } from './gallery.mjs?v=20261109';

const pieces=JSON.parse(document.getElementById('portfolio-data').textContent);
const covers=[...document.querySelectorAll('.photo-portfolio button.piece')];
for (const tile of covers) {
  const image=tile.querySelector('img'), piece=pieces[Number(tile.dataset.piece)];
  image.src='/pieces/'+piece.images[0].file+'.webp';
  image.removeAttribute('srcset');
  image.loading=tile.classList.contains('featured-piece')?'eager':'lazy';
}
let pendingMeasure=false;
const gallery=mountGallery({pieces,onClose(){if(pendingMeasure){pendingMeasure=false;measure();}}});
for(const tile of covers) tile.addEventListener('click',()=>gallery.open(Number(tile.dataset.piece),0,tile));
gallery.dialog.querySelector('[data-home]').addEventListener('click',event=>{event.preventDefault();gallery.close();window.scrollTo({top:0,behavior:'instant'});});
const grid=document.querySelector('.masonry-grid');
let width=0, frame=0;
function measure() {
  if(gallery.dialog.open){pendingMeasure=true;return;}
  width=innerWidth;
  for(const tile of grid.children) tile.style.gridRowEnd='span '+Math.ceil(tile.querySelector('.product-photo').getBoundingClientRect().height+parseFloat(getComputedStyle(tile).paddingBottom));
  grid.dataset.masonry='true';
}
addEventListener('resize',()=>{if(innerWidth!==width){cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);}});
measure();document.fonts.ready.then(measure);
