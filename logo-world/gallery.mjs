import { photoFrame } from './photos.mjs';

export function mountGallery({ pieces, onOpen = () => {}, onClose = () => {} }) {
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const photographs = pieces.flatMap((piece, pieceIndex) => piece.images.map((image, photoIndex) => ({ piece, pieceIndex, image, photoIndex })));
const photoIndices = new Map(photographs.map((photo, index) => [photo.piece.id + ':' + photo.photoIndex, index]));
// A real horizontal rail: wheel distance moves pixels, never one photo per event.
const dialog = document.querySelector('.world-gallery');
const rail = dialog.querySelector('.gallery-rail');
const count = dialog.querySelector('.gallery-count');
const previous = document.getElementById('gallery-previous');
const next = document.getElementById('gallery-next');
const slides = photographs.map((photo, index) => {
  const slide = document.createElement('figure');
  slide.className = 'gallery-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', (index + 1) + ' of ' + photographs.length);
  rail.append(slide);
  return slide;
});
let activePhoto = 0, lastFocus = null, galleryScrollFrame = 0, wheelTimer = 0, railDrag = null, galleryOpenFrame = 0;

function hydrateGallery(index) {
  for (let i = Math.max(0, index - 3); i <= Math.min(slides.length - 1, index + 3); i++) {
    if (!slides[i].firstChild) { const frame = photoFrame(photographs[i].image); frame.querySelector('img').loading = 'eager'; slides[i].append(frame); }
  }
}
function updateGallery(index) {
  activePhoto = Math.max(0, Math.min(photographs.length - 1, index));
  hydrateGallery(activePhoto);
  count.textContent = String(activePhoto + 1).padStart(2, '0') + ' / ' + photographs.length;
  previous.disabled = activePhoto === 0;
  next.disabled = activePhoto === photographs.length - 1;
  slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== activePhoto)));
}
function nearestPhoto() {
  const step = slides[1].offsetLeft - slides[0].offsetLeft;
  return Math.max(0, Math.min(slides.length - 1, Math.round(rail.scrollLeft / Math.max(1, step))));
}
function goToPhoto(index, animate = true) {
  const destination = Math.max(0, Math.min(slides.length - 1, index));
  hydrateGallery(destination);
  const slide = slides[destination];
  rail.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - rail.clientWidth / 2, behavior: animate && !reduce.matches ? 'smooth' : 'instant' });
  if (!animate) updateGallery(destination);
}
function openGallery(pieceIndex, photoIndex, trigger) {
  onOpen();
  lastFocus = trigger;
  activePhoto = photoIndices.get(pieces[pieceIndex].id + ':' + photoIndex);
  rail.style.scrollSnapType = 'none';
  updateGallery(activePhoto);
  document.documentElement.classList.add('gallery-open');
  dialog.showModal();
  goToPhoto(activePhoto, false);
  galleryOpenFrame = requestAnimationFrame(() => { goToPhoto(activePhoto, false); rail.style.scrollSnapType = ''; });
}
function closeGallery() {
  clearTimeout(wheelTimer);
  cancelAnimationFrame(galleryOpenFrame);
  railDrag = null;
  dialog.close();
  document.documentElement.classList.remove('gallery-open');
  onClose();
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
rail.addEventListener('scroll', () => {
  if (!galleryScrollFrame) galleryScrollFrame = requestAnimationFrame(() => { galleryScrollFrame = 0; if (dialog.open) updateGallery(nearestPhoto()); });
}, { passive: true });
rail.addEventListener('wheel', event => {
  if (event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  event.stopPropagation();
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1;
  const distance = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  clearTimeout(wheelTimer);
  rail.style.scrollSnapType = 'none';
  rail.scrollBy({ left: distance * factor, behavior: 'instant' });
  wheelTimer = setTimeout(() => { rail.style.scrollSnapType = ''; goToPhoto(nearestPhoto()); }, 170);
}, { passive: false });
rail.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  railDrag = { id: event.pointerId, x: event.clientX, scroll: rail.scrollLeft };
  clearTimeout(wheelTimer);
  rail.setPointerCapture(event.pointerId);
  rail.style.scrollSnapType = 'none';
  rail.dataset.dragging = 'true';
});
rail.addEventListener('pointermove', event => { if (railDrag && railDrag.id === event.pointerId) rail.scrollLeft = railDrag.scroll - (event.clientX - railDrag.x); });
function endRailDrag(event) {
  if (!railDrag || railDrag.id !== event.pointerId) return;
  railDrag = null;
  delete rail.dataset.dragging;
  if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  rail.style.scrollSnapType = '';
  goToPhoto(nearestPhoto());
}
rail.addEventListener('pointerup', endRailDrag);
rail.addEventListener('pointercancel', endRailDrag);
rail.addEventListener('lostpointercapture', endRailDrag);
rail.addEventListener('keydown', event => { if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goToPhoto(event.key === 'Home' ? 0 : slides.length - 1); } });
dialog.querySelector('.close-button').addEventListener('click', closeGallery);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeGallery(); });
previous.addEventListener('click', () => goToPhoto(activePhoto - 1));
next.addEventListener('click', () => goToPhoto(activePhoto + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); goToPhoto(activePhoto + (event.key === 'ArrowRight' ? 1 : -1)); }
});

return { dialog, open: openGallery, close: closeGallery, goToPhoto };
}
