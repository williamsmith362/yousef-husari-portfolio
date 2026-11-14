import { createImageQueue } from './image-loading.mjs?v=wave-load-2';

const chooser = document.getElementById('view-choice');
const fancy = document.getElementById('choose-fancy');
const pieces = JSON.parse(document.getElementById('portfolio-data').textContent);
const connection = navigator.connection;
const warming = createImageQueue({ concurrency: connection?.saveData ? 1 : 3 });
let entering = false;
// Warm small previews in order: covers first, then the rest of the canvas.
// Full-size gallery photographs remain on demand.
function warmImages() {
  const photos = pieces.flatMap(piece => piece.images.map((photo, index) => ({ photo, index })));
  const selected = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')
    ? photos.filter(item => item.index === 0).slice(0, 8) : photos;
  if (!connection?.saveData && !/(^|-)2g$/.test(connection?.effectiveType || '')) {
    for (const piece of pieces.slice(0, 6)) {
      const file = piece.images[0].file;
      warming.request('cover-' + file, '/pieces/' + file + '.webp', { priority: 0, ready() {} });
    }
  }
  for (const { photo, index } of selected) {
    warming.request(photo.file, '/previews/' + photo.file + '.webp', { priority: index, ready() {} });
  }
}
async function enterFancy(event) {
  event?.preventDefault();
  if (entering) return;
  entering = true;
  warming.clear();
  // Keep the chooser visible until the world module has mounted successfully.
  try {
    await import('./world.js?v=mouse-wheel-3');
    chooser.hidden = true;
    document.body.classList.remove('choosing-view');
    history.replaceState(null, '', '/?view=fancy');
    document.querySelector('.world-viewport').setAttribute('tabindex', '-1');
    document.querySelector('.world-viewport').focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
  } catch {
    entering = false;
    chooser.querySelector('.choice-error').hidden = false;
  }
}
fancy.addEventListener('click', enterFancy);
document.getElementById('choose-simple').addEventListener('click', () => warming.clear());
if (new URLSearchParams(location.search).get('view') === 'fancy') enterFancy();
else warmImages();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) warming.pause(); else if (!entering) warming.resume();
});
