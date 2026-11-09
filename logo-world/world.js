import { revealCamera, homePresence } from './world-presence.mjs';
import { makeProjects, getExtent, fitCamera, clampCamera, zoomAt } from './world-layout.mjs';

const view = document.querySelector('.world-viewport');
const plane = document.querySelector('.world-plane');
const measurement = document.querySelector('.world-measurement');
const header = document.querySelector('.world-header');
const announcement = document.getElementById('world-announcement');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pieces = JSON.parse(document.getElementById('portfolio-data').textContent);
const projects = makeProjects(pieces);
const extent = getExtent(projects);
const sourceCovers = Array.from(measurement.querySelectorAll('button.piece'));
const photographs = pieces.flatMap((piece, pieceIndex) => piece.images.map((image, photoIndex) => ({ piece, pieceIndex, image, photoIndex })));
const photoIndices = new Map(photographs.map((photo, index) => [photo.piece.id + ':' + photo.photoIndex, index]));
const clamp01 = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp01(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
let size = { w: innerWidth, h: innerHeight, top: 0, fitTop: 139 };
let pivot = { x: size.w / 2, y: (size.h + size.top) / 2 };
let camera = { x: 0, y: pivot.y, z: 1 };
let mode = 'intro';
let progress = 0, targetProgress = 0, introFrame = 0, lastIntroTime = 0;
let cameraFrame = 0, resizeFrame = 0, navigationReadyAt = 0;
let preset = 'home';
let startingBoxes = [];
let headerHeight = 115, previousHeaderOpacity = -1;
let paintFrame = 0, qualityTimer = 0, layoutWidth = 0;
let heroOpeningSource = null;

function photoFrame(image, ratio = .8, preview = false) {
  const b = image.bounds;
  const productRatio = b.width / b.height;
  const frame = document.createElement('span');
  frame.className = 'product-photo';
  frame.style.aspectRatio = ratio;
  const crop = document.createElement('span');
  crop.className = 'cutout-window';
  crop.style.width = (productRatio > ratio ? 91 : 91 * productRatio / ratio) + '%';
  crop.style.height = (productRatio > ratio ? 91 * ratio / productRatio : 91) + '%';
  const img = document.createElement('img');
  img.src = (preview ? '/previews/' : '/pieces/') + image.file + '.webp';
  img.alt = image.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.draggable = false;
  img.style.cssText = 'width:' + b.sourceWidth / b.width * 100 + '%;height:' + b.sourceHeight / b.height * 100 + '%;left:' + -b.x / b.width * 100 + '%;top:' + -b.y / b.height * 100 + '%';
  crop.append(img);
  frame.append(crop);
  return frame;
}

const items = projects.flatMap(project => project.items.map(item => {
  const element = item.photoIndex === 0 ? sourceCovers[project.index].cloneNode(true) : document.createElement('button');
  element.className = 'piece world-item';
  element.type = 'button';
  element.dataset.piece = project.index;
  element.dataset.photo = item.photoIndex;
  element.style.width = item.w + 'px';
  element.setAttribute('aria-label', 'View ' + project.piece.name + ', ' + item.image.label + ', image ' + (item.photoIndex + 1) + ' of ' + project.items.length);
  if (item.photoIndex > 0) element.append(photoFrame(item.image, item.ratio, true));
  const imageElement = element.querySelector('img');
  imageElement.src = '/previews/' + item.image.file + '.webp';
  imageElement.loading = 'lazy';
  imageElement.removeAttribute('srcset');
  plane.append(element);
  return { imageElement, ...item, xLocal: item.x, yLocal: item.y, project, element, x: 0, y: 0, width: item.w, height: item.h, alpha: 0 };
}));

function minimumZoom() { return fitCamera(extent, size).z; }
function homeCamera() {
  const overviewZoom = size.w < 620 ? Math.max(.22, Math.min(.4, size.w / 1250)) : Math.min(.65, size.w / 2000);
  const z = Math.min(overviewZoom, Math.max(.2, (size.h - size.top - 52) / 430));
  const first = projects[0].items[0];
  return { x: 0, y: 340 + first.h / 2 + (headerHeight / 2 + 28) / z, z };
}

function setHeaderOpacity(value) {
  if (Math.abs(value - previousHeaderOpacity) < .001) return;
  previousHeaderOpacity = value;
  header.style.opacity = value.toFixed(4);
  header.inert = value < .06;
  header.setAttribute('aria-hidden', String(value < .06));
}

// Position is entirely CSS-owned. Pan never moves or hides the name.
function updateHomeHeader() {
  setHeaderOpacity(homePresence(camera, minimumZoom(), null, pivot, size, headerHeight).opacity);
}

// Touch events can arrive faster than the display. Paint only the latest pose.
function requestCameraPaint() {
  if (!paintFrame) paintFrame = requestAnimationFrame(() => { paintFrame = 0; paintCamera(); });
}

function refreshImageQuality() {
  if (dialog.open) return;
  const density = Math.min(2, devicePixelRatio || 1);
  for (const item of items) {
    const needsDetail = item.visible && Math.max(item.width, item.height) * camera.z * density > 220;
    const src = (needsDetail ? '/pieces/' : '/previews/') + item.image.file + '.webp';
    if (item.imageElement.getAttribute('src') !== src) item.imageElement.src = src;
  }
}

function scheduleImageQuality() {
  clearTimeout(qualityTimer);
  qualityTimer = setTimeout(refreshImageQuality, 110);
}

function updateHitTargets() {
  for (const item of items) {
    const x = pivot.x + (item.x - camera.x) * camera.z;
    const y = pivot.y + (item.y - camera.y) * camera.z;
    const visible = item.alpha > .3 && x < size.w && x + item.width * camera.z > 0 && y < size.h - 45 && y + item.height * camera.z > size.top;
    if (item.visible !== visible) {
      item.visible = visible;
      item.element.setAttribute('aria-hidden', String(!visible));
      item.element.tabIndex = visible ? 0 : -1;
    }
  }
}

function paintCamera() {
  plane.style.transform = 'translate3d(' + (-camera.x * camera.z).toFixed(3) + 'px,' + (pivot.y - camera.y * camera.z).toFixed(3) + 'px,0) scale(' + camera.z.toFixed(6) + ')';
  plane.dataset.camera = JSON.stringify(camera);
  updateHitTargets();
  updateHomeHeader();
  scheduleImageQuality();
}

function paintLayout(value) {
  const spread = value;
  for (const item of items) {
    const start = startingBoxes[item.project.index];
    const isCover = item.photoIndex === 0;
    const fromWidth = isCover ? start.w : start.w * .45;
    const fromX = isCover ? start.x : start.x + (start.w - fromWidth) / 2 + (item.photoIndex % 2 ? 1 : -1) * start.w * .65;
    const fromY = isCover ? start.y : start.y + start.h * .3 + Math.floor(item.photoIndex / 2) * start.h * .12;
    item.x = mix(fromX, item.project.x + item.xLocal, spread);
    item.y = mix(fromY, item.project.y + item.yLocal, spread);
    item.width = mix(fromWidth, item.w, spread);
    item.height = item.width * item.h / item.w;
    item.alpha = isCover
      ? (start.y < size.h + 100 ? 1 : smooth((value - .08 - item.project.index / projects.length * .1) / .36))
      : smooth((value - .16 - item.project.index / projects.length * .2 - item.photoIndex * .005) / .34);
    item.element.style.opacity = item.alpha.toFixed(4);
    item.element.style.transform = 'translate(' + item.x.toFixed(3) + 'px,' + item.y.toFixed(3) + 'px) scale(' + (item.width / item.w).toFixed(6) + ')';
  }
  if (mode === 'intro') {
    camera = revealCamera(spread, pivot, fitCamera(extent, size));
  }
  view.dataset.progress = value.toFixed(5);
  paintCamera();
}

function finishIntro() {
  progress = targetProgress = 1;
  mode = 'explore';
  preset = 'all';
  camera = fitCamera(extent, size);
  paintLayout(1);
  view.dataset.mode = mode;
  announcement.textContent = 'Portfolio expanded.';
  navigationReadyAt = performance.now() + 220;
}

function animateIntro(time) {
  introFrame = 0;
  if (dialog.open) return;
  const elapsed = lastIntroTime ? Math.min(64, time - lastIntroTime) : 16;
  lastIntroTime = time;
  progress = reduce.matches ? targetProgress : progress + (targetProgress - progress) * (1 - Math.exp(-elapsed / 65));
  if (Math.abs(progress - targetProgress) < .0002) progress = targetProgress;
  paintLayout(progress);
  if (progress === 1) { finishIntro(); lastIntroTime = 0; return; }
  if (progress !== targetProgress) introFrame = requestAnimationFrame(animateIntro);
  else lastIntroTime = 0;
}

function advanceIntro(delta) {
  if (mode !== 'intro') return;
  targetProgress = clamp01(targetProgress + delta);
  if (!introFrame) introFrame = requestAnimationFrame(animateIntro);
}

function stopCamera() { cancelAnimationFrame(cameraFrame); cameraFrame = 0; }
function moveCamera(next, animate = false) {
  stopCamera();
  const destination = clampCamera(next, extent, size, minimumZoom());
  if (!animate || reduce.matches) { camera = destination; requestCameraPaint(); return; }
  const from = { ...camera }, start = performance.now();
  function tick(time) {
    const t = clamp01((time - start) / 190), eased = smooth(t);
    camera = { x: mix(from.x, destination.x, eased), y: mix(from.y, destination.y, eased), z: mix(from.z, destination.z, eased) };
    paintCamera();
    if (t < 1) cameraFrame = requestAnimationFrame(tick);
    else cameraFrame = 0;
  }
  cameraFrame = requestAnimationFrame(tick);
}

function zoom(factor, point = pivot, animate = false) {
  if (mode !== 'explore') return;
  preset = 'custom';
  moveCamera(zoomAt(camera, factor, point, pivot, minimumZoom()), animate);
}

function returnHome(event) {
  if (event) event.preventDefault();
  if (dialog.open) closeGallery();
  if (mode === 'intro') advanceIntro(-targetProgress);
  else { preset = 'home'; moveCamera(homeCamera(), true); }
}

function showAll() {
  if (mode !== 'explore') return;
  preset = 'all';
  moveCamera(fitCamera(extent, size), true);
}

function measure(remeasureLayout = true) {
  stopCamera();
  headerHeight = header.offsetHeight;
  size = { w: innerWidth, h: innerHeight, top: 0, fitTop: Math.ceil(measurement.querySelector('.site-header').offsetHeight + 16) };
  pivot = { x: size.w / 2, y: (size.h + size.top) / 2 };
  const layoutChanged = remeasureLayout || !startingBoxes.length;
  if (layoutChanged) {
    const grid = measurement.querySelector('.masonry-grid');
    for (const tile of grid.children) tile.style.gridRowEnd = 'span ' + Math.ceil(tile.querySelector('.product-photo').getBoundingClientRect().height + parseFloat(getComputedStyle(tile).paddingBottom));
    grid.dataset.masonry = 'true';
    startingBoxes = sourceCovers.map(tile => {
      const box = tile.querySelector('.product-photo').getBoundingClientRect();
      return { x: box.left - size.w / 2, y: box.top, w: box.width, h: box.height };
    });
    heroOpeningSource = { ...startingBoxes[0] };
    layoutWidth = innerWidth;
  }
  // Leave the centered name clear without cropping the opening backpack.
  const headerTop = (size.h - headerHeight) / 2;
  const openingScale = Math.min(1, Math.max(70, headerTop - 40) / heroOpeningSource.h);
  startingBoxes[0] = { x: -heroOpeningSource.w * openingScale / 2, y: Math.max(20, headerTop - heroOpeningSource.h * openingScale - 16), w: heroOpeningSource.w * openingScale, h: heroOpeningSource.h * openingScale };
  if (mode === 'explore') {
    if (preset === 'home') camera = homeCamera();
    else if (preset === 'all') camera = fitCamera(extent, size);
    else camera = clampCamera(camera, extent, size, minimumZoom());
  }
  if (mode === 'explore' && !layoutChanged) paintCamera();
  else paintLayout(progress);
  if (layoutChanged) refreshImageQuality();
  if (dialog.open) goToPhoto(activePhoto, false);
}

addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => measure(Math.abs(innerWidth - layoutWidth) > 1)); });
addEventListener('wheel', event => {
  if (dialog.open) return;
  event.preventDefault();
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.h : 1;
  if (mode === 'intro') {
    if (!event.ctrlKey && !event.metaKey) advanceIntro(event.deltaY * factor / (size.w < 620 ? 2400 : 2700));
    return;
  }
  // Ignore only the remaining momentum of the gesture that completed the intro.
  if (performance.now() < navigationReadyAt) { navigationReadyAt = performance.now() + 100; return; }
  if (event.ctrlKey || event.metaKey) zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .01), { x: event.clientX, y: event.clientY });
  else {
    const dx = (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX) * factor;
    const dy = (event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY) * factor;
    preset = 'custom';
    moveCamera({ x: camera.x + dx / camera.z, y: camera.y + dy / camera.z, z: camera.z });
  }
}, { passive: false });

const points = new Map();
let gesture = null;
const pair = () => { const [a, b] = [...points.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) }; };
function resetGesture() { points.clear(); gesture = null; delete view.dataset.dragging; }
view.addEventListener('pointerdown', event => {
  if (event.target.closest('a') || event.button > 0 || dialog.open) return;
  event.preventDefault();
  stopCamera();
  const point = { x: event.clientX, y: event.clientY };
  points.set(event.pointerId, point);
  view.setPointerCapture(event.pointerId);
  if (points.size === 1) gesture = { start: point, last: point, moved: false, multi: false, item: event.target.closest('.world-item') };
  else if (gesture) { gesture.multi = gesture.moved = true; gesture.pair = pair(); }
});
view.addEventListener('pointermove', event => {
  if (!points.has(event.pointerId) || !gesture) return;
  event.preventDefault();
  const point = { x: event.clientX, y: event.clientY };
  points.set(event.pointerId, point);
  if (points.size >= 2) {
    const current = pair(), previous = gesture.pair || current;
    gesture.multi = gesture.moved = true;
    if (mode === 'explore' && current.distance >= 8 && previous.distance >= 8) {
      const z = Math.max(minimumZoom(), Math.min(3, camera.z * current.distance / previous.distance));
      preset = 'custom';
      moveCamera({ x: camera.x + (previous.x - pivot.x) / camera.z - (current.x - pivot.x) / z, y: camera.y + (previous.y - pivot.y) / camera.z - (current.y - pivot.y) / z, z });
    }
    gesture.pair = current;
    return;
  }
  if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 6) gesture.moved = true;
  if (gesture.moved) {
    if (mode === 'intro') advanceIntro((gesture.last.y - point.y) / (size.w < 620 ? 2400 : 2700));
    else {
      preset = 'custom';
      view.dataset.dragging = 'true';
      moveCamera({ x: camera.x - (point.x - gesture.last.x) / camera.z, y: camera.y - (point.y - gesture.last.y) / camera.z, z: camera.z });
    }
  }
  gesture.last = point;
});
function releasePointer(event, cancelled = false) {
  if (!points.has(event.pointerId)) return;
  const previous = gesture;
  points.delete(event.pointerId);
  if (view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
  if (points.size && gesture) {
    gesture.start = gesture.last = [...points.values()][0];
    gesture.moved = true;
    gesture.pair = points.size >= 2 ? pair() : null;
    return;
  }
  resetGesture();
  if (!cancelled && previous && !previous.moved && !previous.multi && previous.item) openGallery(Number(previous.item.dataset.piece), Number(previous.item.dataset.photo), previous.item);
}
view.addEventListener('pointerup', event => releasePointer(event));
view.addEventListener('pointercancel', event => releasePointer(event, true));
view.addEventListener('lostpointercapture', event => { if (points.has(event.pointerId)) releasePointer(event, true); });
view.addEventListener('dragstart', event => event.preventDefault());
view.addEventListener('dblclick', event => {
  if (mode === 'explore' && !event.target.closest('.world-item,a')) { event.preventDefault(); zoom(1.8, { x: event.clientX, y: event.clientY }); }
});
view.addEventListener('click', event => {
  const item = event.target.closest('.world-item');
  if (item) { event.preventDefault(); if (event.detail === 0) openGallery(Number(item.dataset.piece), Number(item.dataset.photo), item); }
});
addEventListener('blur', resetGesture);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetGesture(); });

let safariScale = 1;
document.addEventListener('gesturestart', event => { if (!dialog.open) { event.preventDefault(); safariScale = event.scale || 1; } }, { passive: false });
document.addEventListener('gesturechange', event => {
  if (dialog.open) return;
  event.preventDefault();
  if (mode === 'explore' && points.size < 2) zoom(event.scale / safariScale, { x: event.clientX || pivot.x, y: event.clientY || pivot.y });
  safariScale = event.scale;
}, { passive: false });
document.addEventListener('gestureend', event => { if (!dialog.open) event.preventDefault(); }, { passive: false });

document.querySelectorAll('.world-header [data-home], .world-gallery [data-home]').forEach(link => link.addEventListener('click', returnHome));
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  items[0].element.focus({ preventScroll: true });
});
addEventListener('keydown', event => {
  if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
  if (mode === 'intro') {
    const amount = { ArrowDown: .065, ArrowUp: -.065, PageDown: .23, PageUp: -.23, ' ': .23, End: 1, Home: -1 }[event.key];
    if (amount !== undefined) { event.preventDefault(); advanceIntro(amount); }
    return;
  }
  const direction = { ArrowLeft: [-120, 0], ArrowRight: [120, 0], ArrowUp: [0, -120], ArrowDown: [0, 120], PageDown: [0, (size.h - size.top) * .7], PageUp: [0, -(size.h - size.top) * .7] }[event.key];
  if (direction) { event.preventDefault(); preset = 'custom'; moveCamera({ x: camera.x + direction[0] / camera.z, y: camera.y + direction[1] / camera.z, z: camera.z }, true); }
  else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.35, pivot, true); }
  else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.35, pivot, true); }
  else if (event.key === '0') { event.preventDefault(); showAll(); }
  else if (event.key === 'Home') { event.preventDefault(); returnHome(); }
});

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
  cancelAnimationFrame(introFrame); introFrame = 0; lastIntroTime = 0;
  targetProgress = progress;
  stopCamera();
  lastFocus = trigger;
  activePhoto = photoIndices.get(pieces[pieceIndex].id + ':' + photoIndex);
  rail.style.scrollSnapType = 'none';
  updateGallery(activePhoto);
  dialog.showModal();
  goToPhoto(activePhoto, false);
  galleryOpenFrame = requestAnimationFrame(() => { goToPhoto(activePhoto, false); rail.style.scrollSnapType = ''; });
}
function closeGallery() {
  clearTimeout(wheelTimer);
  cancelAnimationFrame(galleryOpenFrame);
  railDrag = null;
  dialog.close();
  scheduleImageQuality();
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

measure();
document.fonts.ready.then(() => measure(true));
