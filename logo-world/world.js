import { photoFrame } from './photos.mjs';
import { mountGallery } from './gallery.mjs?v=grouped-trousers-1';
import { createLivingLogo } from './living-logo.mjs?v=locked-board-1';
import { BOARD_HEADER_AREA, boardHeaderPose } from './board-header.mjs?v=locked-board-1';
import { revealCamera, homePresence, homeAnchor, screenBox, inViewport } from './world-presence.mjs';
import { makeProjects, getExtent, fitCamera, clampCamera, zoomAt } from './world-layout.mjs?v=locked-board-1';

const view = document.querySelector('.world-viewport');
const plane = document.querySelector('.world-plane');
const measurement = document.querySelector('.world-measurement');
const header = document.querySelector('.world-header');
const dialog = document.querySelector('.world-gallery');
const announcement = document.getElementById('world-announcement');
const dragHint = document.querySelector('.world-drag-hint');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pieces = JSON.parse(document.getElementById('portfolio-data').textContent);
const projects = makeProjects(pieces);
const extent = getExtent(projects);
const sourceCovers = Array.from(measurement.querySelectorAll('button.piece'));
const clamp01 = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp01(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
let size = { w: innerWidth, h: innerHeight, top: 0, fitTop: 139 };
let pivot = { x: size.w / 2, y: (size.h + size.top) / 2 };
let camera = { x: 0, y: pivot.y, z: 1 };
let mode = 'intro';
let progress = 0, targetProgress = 0, introFrame = 0, lastIntroTime = 0;
let cameraFrame = 0, resizeFrame = 0, navigationReadyAt = 0;
let dragHintActive = false, dragHintShown = false, dragHintUsedZoom = false, dragHintUsedDrag = false;
let dragHintConsumed = false;
try { dragHintConsumed = window.sessionStorage.getItem('portfolio-zoom-drag-hint-used') === '1'; } catch {}
const worldCellSize = 512;
let spatialGrid = null;
const renderedItems = new Set();
const candidateItems = new Set();
let preset = 'home';
let startingBoxes = [];
let headerHeight = 115, headerWidth = 0, previousHeaderOpacity = -1;
let paintFrame = 0, qualityTimer = 0, layoutWidth = 0;
let headerAnchor = homeAnchor(size), pendingMeasure = false;

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
  return { imageElement, frame: element.querySelector('.product-photo'), ...item, xLocal: item.x, yLocal: item.y, project, element, x: 0, y: 0, width: item.w, height: item.h, alpha: 0 };
}));

const living = createLivingLogo({ items, view, getScene: () => ({camera, pivot, size}), ready: () => mode === 'explore' && !dialog.open, reduced: () => reduce.matches, onDetail: scheduleImageQuality, reservedArea: BOARD_HEADER_AREA });

function minimumZoom() { return fitCamera(extent, size).z; }

function finishDragHint() {
  dragHintActive = false;
  dragHint?.classList.remove('is-visible');
  dragHint?.style.removeProperty('--hint-opacity');
  dragHint?.style.removeProperty('--hint-blur');
}

function markDragHintAction(action) {
  if (!dragHintShown || dragHintConsumed) return;
  if (action === 'zoom') dragHintUsedZoom = true;
  if (action === 'drag') dragHintUsedDrag = true;
  if (dragHintUsedZoom && dragHintUsedDrag) {
    dragHintConsumed = true;
    try { window.sessionStorage.setItem('portfolio-zoom-drag-hint-used', '1'); } catch {}
    if (dragHintActive) finishDragHint();
  }
}

function showDragHint() {
  if (!dragHint || dialog.open || dragHintActive || dragHintConsumed) return;
  dragHintActive = true;
  dragHintShown = true;
  dragHint.style.setProperty('--hint-opacity', '1');
  dragHint.style.setProperty('--hint-blur', '9px');
  dragHint.classList.add('is-visible');
}

function updateDragHint() {
  if (!dragHint || !dragHintActive) return;
  const progress = clamp01((camera.z / minimumZoom() - 1) / .8);
  const remaining = 1 - progress;
  dragHint.style.setProperty('--hint-opacity', remaining.toFixed(3));
  dragHint.style.setProperty('--hint-blur', (9 * remaining).toFixed(2) + 'px');
  if (progress >= .999) finishDragHint();
}

function buildSpatialGrid() {
  spatialGrid = new Map();
  for (const item of items) {
    const left = Math.floor(item.x / worldCellSize);
    const right = Math.floor((item.x + item.width) / worldCellSize);
    const top = Math.floor(item.y / worldCellSize);
    const bottom = Math.floor((item.y + item.height) / worldCellSize);
    for (let x = left; x <= right; x++) for (let y = top; y <= bottom; y++) {
      const key = x + ',' + y;
      if (!spatialGrid.has(key)) spatialGrid.set(key, []);
      spatialGrid.get(key).push(item);
    }
  }
}

function collectVisibleCandidates() {
  candidateItems.clear();
  if (!spatialGrid) return items;
  const margin = 96 / camera.z;
  const left = camera.x - pivot.x / camera.z - margin;
  const right = camera.x + (size.w - pivot.x) / camera.z + margin;
  const top = camera.y - pivot.y / camera.z - margin;
  const bottom = camera.y + (size.h - pivot.y) / camera.z + margin;
  for (let x = Math.floor(left / worldCellSize); x <= Math.floor(right / worldCellSize); x++) {
    for (let y = Math.floor(top / worldCellSize); y <= Math.floor(bottom / worldCellSize); y++) {
      const cell = spatialGrid.get(x + ',' + y);
      if (cell) for (const item of cell) candidateItems.add(item);
    }
  }
  return candidateItems;
}
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

// Keep one world coordinate beside the spawn area, just like the photographs.
function updateHomeHeader() {
  const presence = homePresence(camera, minimumZoom(), headerAnchor, pivot);
  const pose = mode === 'intro' ? presence : boardHeaderPose(camera, pivot, { width: headerWidth, height: headerHeight });
  header.style.transform = 'translate3d(' + pose.x.toFixed(3) + 'px,' + pose.top.toFixed(3) + 'px,0) scale(' + pose.scale.toFixed(6) + ')';
  setHeaderOpacity(presence.opacity);
}

// Touch events can arrive faster than the display. Paint only the latest pose.
function requestCameraPaint() {
  if (!paintFrame) paintFrame = requestAnimationFrame(() => { paintFrame = 0; paintCamera(); });
}

function refreshImageQuality() {
  if (dialog.open) return;
  const density = Math.min(2, devicePixelRatio || 1);
  for (const item of items) {
    const needsDetail = item.visible && Math.max(item.width, item.height) * camera.z * (item.lift?.scale || 1) * density > 200;
    const src = (needsDetail ? '/pieces/' : '/previews/') + item.image.file + '.webp';
    if (item.imageElement.getAttribute('src') !== src) item.imageElement.src = src;
  }
}

function scheduleImageQuality() {
  clearTimeout(qualityTimer);
  qualityTimer = setTimeout(refreshImageQuality, 110);
}

function updateHitTargets() {
  const candidates = collectVisibleCandidates();
  if (spatialGrid) for (const item of renderedItems) if (!candidateItems.has(item)) {
    item.element.hidden = true;
    item.rendered = false;
    item.visible = false;
    item.element.setAttribute('aria-hidden', 'true');
    item.element.tabIndex = -1;
    renderedItems.delete(item);
  }
  for (const item of candidates) {
    const box=screenBox(item,camera,pivot);
    const rendered=item.alpha>.001 && inViewport(box,size,96);
    if(item.rendered!==rendered) {item.element.hidden=!rendered;item.rendered=rendered;}
    if (rendered) renderedItems.add(item); else renderedItems.delete(item);
    if(rendered && item.layoutDirty) {
      const opacity=item.alpha.toFixed(4);
      if(item.lastOpacity!==opacity) {item.element.style.opacity=opacity;item.lastOpacity=opacity;}
      item.element.style.transform='translate('+item.x.toFixed(3)+'px,'+item.y.toFixed(3)+'px) scale('+(item.width/item.w).toFixed(6)+')';
      item.layoutDirty=false;
    }
    const visible = item.alpha>.3 && inViewport(box,size);
    if (item.visible !== visible) {
      item.visible = visible;
      item.element.setAttribute('aria-hidden', String(!visible));
      item.element.tabIndex = visible ? 0 : -1;
    }
  }
}

function paintCamera() {
  plane.style.transform = 'translate3d(' + (-camera.x * camera.z).toFixed(3) + 'px,' + (pivot.y - camera.y * camera.z).toFixed(3) + 'px,0) scale(' + camera.z.toFixed(6) + ')';
  updateHitTargets();
  updateHomeHeader();
  updateDragHint();
  scheduleImageQuality();
}

function paintLayout(value) {
  const spread = value;
  if (value > .55) living.warm();
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
    item.layoutDirty=true;
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
  buildSpatialGrid();
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
  living.clear(true);
  targetProgress = clamp01(targetProgress + delta);
  if (!introFrame) introFrame = requestAnimationFrame(animateIntro);
}

function stopCamera() { cancelAnimationFrame(cameraFrame); cameraFrame = 0; }
function moveCamera(next, animate = false) {
  living.clear();
  stopCamera();
  const minimum = minimumZoom();
  const destination = clampCamera(next, extent, size, minimum);
  if (mode === 'explore' && camera.z <= minimum * 1.005 && next.z <= minimum * 1.005 && Math.abs(next.y-camera.y) > .001 && Math.abs(destination.y-camera.y) < .001) showDragHint();
  if(Math.abs(destination.x-camera.x)<.0001 && Math.abs(destination.y-camera.y)<.0001 && Math.abs(destination.z-camera.z)<.000001) return;
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
  if (factor > 1) markDragHintAction('zoom');
  if (factor < 1 && camera.z <= minimumZoom() * 1.005) showDragHint();
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
  const overview = fitCamera(extent, size);
  moveCamera(overview, true);
}

function measure(remeasureLayout = true) {
  if(dialog.open) {pendingMeasure=true;return;}
  living.clear(true);
  stopCamera();
  headerHeight = header.offsetHeight;
  headerWidth = header.offsetWidth;
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
    headerAnchor = homeAnchor(size);
    layoutWidth = innerWidth;
  }
  if (mode === 'explore') {
    if (preset === 'home') camera = homeCamera();
    else if (preset === 'all') camera = fitCamera(extent, size);
    else camera = clampCamera(camera, extent, size, minimumZoom());
  }
  if (mode === 'explore' && !layoutChanged) paintCamera();
  else paintLayout(progress);
  if (layoutChanged) refreshImageQuality();
}

addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => measure(Math.abs(innerWidth - layoutWidth) > 1)); });
addEventListener('wheel', event => {
  if (dialog.open) return;
  living.clear();
  event.preventDefault();
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.h : 1;
  if (mode === 'intro') {
    if (!event.ctrlKey && !event.metaKey) advanceIntro(event.deltaY * factor / (size.w < 620 ? 2400 : 2700));
    return;
  }
  // Ignore only the remaining momentum of the gesture that completed the intro.
  if (performance.now() < navigationReadyAt) { navigationReadyAt = performance.now() + 100; return; }
  if (mode === 'explore' && !event.ctrlKey && !event.metaKey && camera.z <= minimumZoom() * 1.005 && Math.abs(event.deltaY) > 0) showDragHint();
  if (event.ctrlKey || event.metaKey) zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .01), { x: event.clientX, y: event.clientY });
  else {
    const dx = (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX) * factor;
    const dy = (event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY) * factor;
    preset = 'custom';
    if (dx || dy) markDragHintAction('drag');
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
  if (points.size === 1) {
    const hit = mode === 'explore' ? living.targetAt(point, true, event.pointerType === 'touch') : null;
    gesture = { start: point, last: point, moved: false, multi: false, pointerType: event.pointerType, selectedAtStart: living.selected(), item: mode === 'explore' ? hit?.element : event.target.closest('.world-item') };
  }
  else if (gesture) { gesture.multi = gesture.moved = true; gesture.pair = pair(); }
});
view.addEventListener('pointermove', event => {
  if (!points.has(event.pointerId) || !gesture) {
    if (!points.size && event.pointerType === 'mouse') living.pointer({x:event.clientX,y:event.clientY});
    return;
  }
  event.preventDefault();
  const point = { x: event.clientX, y: event.clientY };
  points.set(event.pointerId, point);
  if (points.size >= 2) {
    const current = pair(), previous = gesture.pair || current;
    gesture.multi = gesture.moved = true;
    living.clear();
    if (mode === 'explore' && current.distance >= 8 && previous.distance >= 8) {
      if (current.distance > previous.distance) markDragHintAction('zoom');
      if (current.distance < previous.distance && camera.z <= minimumZoom() * 1.005) showDragHint();
      const z = Math.max(minimumZoom(), Math.min(3, camera.z * current.distance / previous.distance));
      preset = 'custom';
      moveCamera({ x: camera.x + (previous.x - pivot.x) / camera.z - (current.x - pivot.x) / z, y: camera.y + (previous.y - pivot.y) / camera.z - (current.y - pivot.y) / z, z });
    }
    gesture.pair = current;
    return;
  }
  if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 6) gesture.moved = true;
  if (gesture.moved) {
    living.clear();
    if (mode === 'intro') advanceIntro((gesture.last.y - point.y) / (size.w < 620 ? 2400 : 2700));
    else {
      preset = 'custom';
      view.dataset.dragging = 'true';
      if (camera.z <= minimumZoom() * 1.005 && Math.abs(point.y - gesture.last.y) > .1) showDragHint();
      markDragHintAction('drag');
      moveCamera({ x: camera.x - (point.x - gesture.last.x) / camera.z, y: camera.y - (point.y - gesture.last.y) / camera.z, z: camera.z });
    }
  }
  gesture.last = point;
});
function releasePointer(event, cancelled = false) {
  if (!points.has(event.pointerId)) return;
  if (cancelled) living.clear(true);
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
  if (!cancelled && previous && !previous.moved && !previous.multi) {
    if (previous.item) {
      const item = items.find(item => item.element === previous.item);
      openGallery(Number(previous.item.dataset.piece), Number(previous.item.dataset.photo), previous.item);
    } else living.clear();
  }
}
view.addEventListener('pointerup', event => releasePointer(event));
view.addEventListener('pointercancel', event => releasePointer(event, true));
view.addEventListener('lostpointercapture', event => { if (points.has(event.pointerId)) releasePointer(event, true); });
view.addEventListener('pointerleave', () => { if (!points.size) living.clear(); });
view.addEventListener('focusin', event => { const item = items.find(item => item.element === event.target); if (item && event.target.matches(':focus-visible')) living.emphasize(item); });
view.addEventListener('focusout', event => { if (!event.relatedTarget?.closest('.world-item')) living.clear(); });
view.addEventListener('dragstart', event => event.preventDefault());
view.addEventListener('dblclick', event => {
  if (mode === 'explore' && !event.target.closest('.world-item,a')) { event.preventDefault(); zoom(1.8, { x: event.clientX, y: event.clientY }); }
});
view.addEventListener('click', event => {
  const item = event.target.closest('.world-item');
  if (item) { event.preventDefault(); if (event.detail === 0) openGallery(Number(item.dataset.piece), Number(item.dataset.photo), item); }
});
addEventListener('blur', () => { resetGesture(); living.clear(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { resetGesture(); living.clear(true); } });
reduce.addEventListener('change', () => living.clear(true));

let safariScale = 1;
document.addEventListener('gesturestart', event => { if (!dialog.open) { living.clear(); event.preventDefault(); safariScale = event.scale || 1; } }, { passive: false });
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

const gallery = mountGallery({ pieces, onOpen() {
  cancelAnimationFrame(introFrame); introFrame = 0; lastIntroTime = 0;
  targetProgress = progress; stopCamera(); living.clear(true);
}, onClose() {
  if(pendingMeasure) {pendingMeasure=false;measure(Math.abs(innerWidth-layoutWidth)>1);}
  scheduleImageQuality();
} });
function openGallery(pieceIndex, photoIndex, trigger) { gallery.open(pieceIndex, photoIndex, trigger); }
function closeGallery() { gallery.close(); }

measure();
document.fonts.ready.then(() => measure(true));

