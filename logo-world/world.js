import { photoFrame, EMPTY_IMAGE } from './photos.mjs?v=momentum-images-1';
import { mountGallery } from './gallery.mjs?v=momentum-images-1';
import { createLivingLogo } from './living-logo.mjs?v=locked-board-1';
import { BOARD_HEADER_AREA, boardHeaderPose } from './board-header.mjs?v=raised-header-2';
import { revealCamera, homePresence, homeAnchor, screenBox, inViewport } from './world-presence.mjs';
import { makeProjects, getExtent, fitCamera, clampCamera, zoomAt } from './world-layout.mjs?v=hoodie-growth-1';
import { SCROLL_FEEL, inputTime, damp, dampCamera, decayVelocity, createVelocityTracker, createWheelSmoothing } from './motion.mjs?v=mobile-coast-1';
import { createNativeIntroScroll } from './native-scroll.mjs?v=photo-wheel-1';
import { createImageQueue, replaceDecodedImage } from './image-loading.mjs?v=wave-load-2';

const view = document.querySelector('.world-viewport');
const plane = document.querySelector('.world-plane');
const measurement = document.querySelector('.world-measurement');
const header = document.querySelector('.world-header');
const dialog = document.querySelector('.world-gallery');
const announcement = document.getElementById('world-announcement');
const dragHint = document.querySelector('.world-drag-hint');
const scrollHint = document.createElement('p');
scrollHint.className = 'world-scroll-hint';
scrollHint.innerHTML = '<span>scroll down</span><svg aria-hidden="true" viewBox="0 0 16 20" width="12" height="15"><path d="M8 1v17m-5-5 5 5 5-5"/></svg>';
let scrollHintProgress = 0, scrollHintDismissed = false;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pieces = JSON.parse(document.getElementById('portfolio-data').textContent);
const projects = makeProjects(pieces);
const extent = getExtent(projects);
const sourceCovers = Array.from(measurement.querySelectorAll('button.piece')).sort((a, b) => Number(a.dataset.piece) - Number(b.dataset.piece));
const clamp01 = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp01(n); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
let size = { w: innerWidth, h: innerHeight, top: 0, fitTop: 139 };
let pivot = { x: size.w / 2, y: (size.h + size.top) / 2 };
let camera = { x: 0, y: pivot.y, z: 1 };
let mode = 'intro';
let progress = 0, targetProgress = 0, introFrame = 0, lastIntroTime = 0;
let introVelocity = 0, introResponse = 80, introGlideTime = 0;
let cameraFrame = 0, resizeFrame = 0, navigationReadyAt = 0;
let cameraTarget = null, cameraResponse = 80, lastCameraTime = 0, cameraGlideTime = 0;
let cameraInput = null;
let cameraVelocity = { x: 0, y: 0 };
const flickTracker = createVelocityTracker();
const wheelResponse = createWheelSmoothing();
let dragHintActive = false, dragHintShown = false, dragHintUsedZoom = false, dragHintUsedDrag = false;
let dragHintConsumed = false;
let overviewReady = false, hintDistance = 0, hintEvents = 0;
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
let previewWarmProgress = 0;
const previewQueue = createImageQueue({ concurrency: innerWidth < 620 ? 4 : 6 });
const detailQueue = createImageQueue({ concurrency: innerWidth < 620 ? 2 : 4 });

const items = projects.flatMap(project => project.items.map(item => {
  const element = item.photoIndex === 0 ? sourceCovers[project.index].cloneNode(true) : document.createElement('button');
  element.className = 'piece world-item';
  element.type = 'button';
  element.dataset.piece = project.index;
  element.dataset.photo = item.photoIndex;
  element.style.width = item.w + 'px';
  element.setAttribute('aria-label', 'View ' + project.piece.name + ', ' + item.image.label + ', image ' + (item.photoIndex + 1) + ' of ' + project.items.length);
  if (item.photoIndex > 0) element.append(photoFrame(item.image, item.ratio, true, true));
  const imageElement = element.querySelector('img');
  imageElement.src = EMPTY_IMAGE;
  imageElement.decoding = 'async';
  imageElement.dataset.imageReady = 'false';
  imageElement.removeAttribute('srcset');
  plane.append(element);
  return { imageElement, previewElement: null, imageLevel: null, previewRetryAt: 0, detailUsedAt: 0, frame: element.querySelector('.product-photo'), ...item, xLocal: item.x, yLocal: item.y, project, element, x: 0, y: 0, width: item.w, height: item.h, alpha: 0 };
}));

const living = createLivingLogo({ items, view, getScene: () => ({camera, pivot, size}), ready: () => mode === 'explore' && overviewReady && !dialog.open && !cameraFrame, reduced: () => reduce.matches, onDetail: scheduleImageQuality, reservedArea: BOARD_HEADER_AREA });

function minimumZoom() { return fitCamera(extent, size).z; }
function introScrollRange() { return size.w < 620 ? SCROLL_FEEL.introMobilePixels : SCROLL_FEEL.introDesktopPixels; }

function updateScrollHint(value) {
  if (scrollHintDismissed) return;
  // The opening instruction fades once and stays gone when scrolling back up.
  scrollHintProgress = Math.max(scrollHintProgress, value);
  const opacity = 1 - smooth(scrollHintProgress / .08);
  scrollHint.style.opacity = opacity.toFixed(3);
  if (opacity === 0) {
    scrollHintDismissed = true;
    scrollHint.remove();
  }
}

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
  if (!overviewReady || hintDistance < 140 || hintEvents < 2 || !dragHint || dialog.open || dragHintActive || dragHintConsumed) return;
  dragHintActive = true;
  dragHintShown = true;
  dragHint.style.setProperty('--hint-opacity', '1');
  dragHint.style.setProperty('--hint-blur', '9px');
  dragHint.classList.add('is-visible');
}

function considerDragHint(distance) {
  if (!overviewReady || !Number.isFinite(distance) || distance <= 0) return;
  hintDistance += distance;
  hintEvents++;
  showDragHint();
}

function readyOverview() {
  overviewReady = true;
  hintDistance = 0; hintEvents = 0;
  navigationReadyAt = performance.now();
  announcement.textContent = 'Portfolio ready to explore.';
  scheduleImageQuality();
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

function requestPreview(item, priority = 50) {
  if (item.imageLevel || performance.now() < item.previewRetryAt) return;
  previewQueue.request(item, '/previews/' + item.image.file + '.webp', {
    priority, wanted: () => !dialog.open,
    ready(image) {
      item.previewElement = replaceDecodedImage(item.imageElement, image);
      item.imageElement = item.previewElement; item.imageLevel = 'preview';
      if (item.visible) scheduleImageQuality();
    },
    error() { item.previewRetryAt = performance.now() + 5000; }
  });
}

function warmPreviews(value) {
  // Prepare the next part of the reveal, rather than decoding the whole board.
  const ahead = Math.min(1, (Math.floor(value * 10) + 2) / 10);
  if (ahead <= previewWarmProgress) return;
  previewWarmProgress = ahead;
  const future = revealCamera(ahead, pivot, fitCamera(extent, size));
  for (const item of items) {
    if (item.imageLevel) continue;
    const start = item.revealStart;
    if (item.photoIndex && ahead <= .16 + start.phase * 2 + item.photoIndex * .005) continue;
    const width = mix(start.width, item.w, ahead);
    const box = screenBox({
      x: mix(start.x, item.project.x + item.xLocal, ahead),
      y: mix(start.y, item.project.y + item.yLocal, ahead),
      width, height: width * item.h / item.w
    }, future, pivot);
    if (inViewport(box, size, 140)) requestPreview(item, 20 + item.photoIndex);
  }
}

function detailPixels(item) {
  return Math.max(item.width, item.height) * camera.z * (item.lift?.scale || 1) * Math.min(2, devicePixelRatio || 1);
}

function needsDetail(item) {
  return item.visible && detailPixels(item) > 200;
}

function trimDetailImages() {
  const limit = size.w < 620 ? 12 : 28;
  const detailed = items.filter(item => item.imageLevel === 'full').sort((a,b) => Number(b.rendered)-Number(a.rendered) || b.detailUsedAt-a.detailUsedAt);
  for (const [index, item] of detailed.entries()) if ((detailPixels(item) <= 200 || (!item.rendered && index >= limit)) && item.previewElement) {
    const full = item.imageElement;
    full.replaceWith(item.previewElement); full.removeAttribute('src');
    item.imageElement = item.previewElement; item.imageLevel = 'preview';
  }
}

function refreshImageQuality() {
  if (dialog.open || cameraFrame || introFrame || nativeIntro.scrolling) return;
  if (points.size) { scheduleImageQuality(); return; }
  detailQueue.resume();
  for (const item of items) {
    if (!needsDetail(item) || item.imageLevel !== 'preview') continue;
    detailQueue.request(item, '/pieces/' + item.image.file + '.webp', {
      priority: Math.max(1,1000-Math.max(item.width,item.height)*camera.z),
      wanted: () => !dialog.open && needsDetail(item) && !cameraFrame && !introFrame && !nativeIntro.scrolling && !points.size,
      ready(image) {
        item.imageElement = replaceDecodedImage(item.imageElement, image, { fade: false });
        item.imageLevel = 'full'; item.detailUsedAt = performance.now();
        trimDetailImages();
      }
    });
  }
  trimDetailImages();
}

function scheduleImageQuality() {
  clearTimeout(qualityTimer);
  qualityTimer = setTimeout(refreshImageQuality, 160);
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
    if (rendered) {
      const priority = item.project.index === 0 && item.photoIndex === 0 ? -1 : (item.photoIndex ? 2 : 0) + Math.hypot(box.x+box.w/2-pivot.x,box.y+box.h/2-pivot.y)/Math.max(size.w,size.h);
      requestPreview(item, priority);
      if (item.imageLevel === 'full') item.detailUsedAt = performance.now();
    }
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
  // Keep expensive full-size decodes and replacements out of moving frames.
  detailQueue.pause();
  plane.style.transform = 'translate3d(' + (-camera.x * camera.z).toFixed(3) + 'px,' + (pivot.y - camera.y * camera.z).toFixed(3) + 'px,0) scale(' + camera.z.toFixed(6) + ')';
  updateHitTargets();
  updateHomeHeader();
  updateDragHint();
  scheduleImageQuality();
}

function paintLayout(value) {
  updateScrollHint(value);
  const spread = value;
  if (value > .08) warmPreviews(value);
  if (value > .55) living.warm();
  for (const item of items) {
    const start = startingBoxes[item.project.index];
    const isCover = item.photoIndex === 0;
    const from = item.revealStart;
    item.x = mix(from.x, item.project.x + item.xLocal, spread);
    item.y = mix(from.y, item.project.y + item.yLocal, spread);
    item.width = mix(from.width, item.w, spread);
    item.height = item.width * item.h / item.w;
    item.alpha = isCover
      ? (start.y < size.h + 100 ? 1 : smooth((value - .08 - from.phase) / .36))
      : smooth((value - .16 - from.phase * 2 - item.photoIndex * .005) / .34);
    item.layoutDirty=true;
  }
  if (mode === 'intro') {
    camera = revealCamera(spread, pivot, fitCamera(extent, size));
  }
  view.dataset.progress = value.toFixed(5);
  paintCamera();
}

function finishIntro() {
  nativeIntro.disable();
  introVelocity = 0;
  progress = targetProgress = 1;
  mode = 'explore';
  preset = 'all';
  camera = fitCamera(extent, size);
  paintLayout(1);
  buildSpatialGrid();
  view.dataset.mode = mode;
  view.addEventListener('wheel', handleWorldWheel, { passive: false });
  readyOverview();
}

function animateIntro(time) {
  introFrame = 0;
  if (dialog.open || mode !== 'intro') { lastIntroTime = 0; return; }
  const elapsed = lastIntroTime ? Math.min(64, time - lastIntroTime) : 16;
  lastIntroTime = time;
  if (introVelocity && !reduce.matches) {
    const step = decayVelocity(introVelocity, elapsed);
    const next = progress + step.distance;
    progress = targetProgress = clamp01(next);
    introVelocity = step.velocity;
    introGlideTime += elapsed;
    if (next <= 0 || next >= 1 || Math.abs(introVelocity)*introScrollRange() < SCROLL_FEEL.stopSpeed || introGlideTime >= SCROLL_FEEL.maxGlideMs) introVelocity = 0;
  } else {
    progress = reduce.matches ? targetProgress : damp(progress, targetProgress, elapsed, introResponse);
    if (Math.abs(progress - targetProgress) < .00005) progress = targetProgress;
  }
  nativeIntro.sync(progress);
  paintLayout(progress);
  if (progress === 1) { finishIntro(); lastIntroTime = 0; return; }
  if (introVelocity || progress !== targetProgress) introFrame = requestAnimationFrame(animateIntro);
  else lastIntroTime = 0;
}

function stopIntro() {
  cancelAnimationFrame(introFrame); introFrame = 0; lastIntroTime = 0;
  introVelocity = 0; introGlideTime = 0; targetProgress = progress;
}

function advanceIntro(delta, { direct = false, response = 80 } = {}) {
  if (mode !== 'intro') return;
  living.clear(true);
  if (introVelocity || direct) { introVelocity = 0; targetProgress = progress; }
  targetProgress = clamp01(targetProgress + delta);
  introResponse = response;
  if (direct || reduce.matches) { progress = targetProgress; nativeIntro.sync(progress); }
  if (!introFrame) { lastIntroTime = performance.now(); introFrame = requestAnimationFrame(animateIntro); }
}

function startIntroGlide(velocity) {
  velocity *= SCROLL_FEEL.flickGain;
  if (mode !== 'intro' || reduce.matches || Math.abs(velocity)*introScrollRange() < SCROLL_FEEL.minGlideSpeed) return;
  stopIntro(); introVelocity = velocity;
  lastIntroTime = performance.now();
  introFrame = requestAnimationFrame(animateIntro);
}

function stopCamera() {
  cancelAnimationFrame(cameraFrame); cameraFrame = 0; lastCameraTime = 0;
  cameraTarget = null; cameraVelocity = { x: 0, y: 0 }; cameraGlideTime = 0;
  cameraInput = null;
}

function animateCamera(time) {
  cameraFrame = 0;
  if (dialog.open || mode !== 'explore') { stopCamera(); return; }
  const elapsed = lastCameraTime ? Math.min(64, time - lastCameraTime) : 16;
  lastCameraTime = time;
  if (cameraTarget) {
    camera = clampCamera(dampCamera(camera, cameraTarget, elapsed, cameraResponse), extent, size, minimumZoom());
    if (Math.hypot((camera.x-cameraTarget.x)*camera.z,(camera.y-cameraTarget.y)*camera.z) < .08 && Math.abs(Math.log(camera.z/cameraTarget.z)) < .00005) {
      camera = cameraTarget; cameraTarget = null;
    }
  } else {
    const x = decayVelocity(cameraVelocity.x, elapsed), y = decayVelocity(cameraVelocity.y, elapsed);
    const next = { x: camera.x + x.distance/camera.z, y: camera.y + y.distance/camera.z, z: camera.z };
    const bounded = clampCamera(next, extent, size, minimumZoom());
    cameraVelocity = { x: Math.abs(next.x-bounded.x) > .0001 ? 0 : x.velocity, y: Math.abs(next.y-bounded.y) > .0001 ? 0 : y.velocity };
    camera = bounded; cameraGlideTime += elapsed;
    if (Math.hypot(cameraVelocity.x,cameraVelocity.y) < SCROLL_FEEL.stopSpeed || cameraGlideTime >= SCROLL_FEEL.maxGlideMs) cameraVelocity = { x: 0, y: 0 };
  }
  paintCamera();
  if (cameraTarget || cameraVelocity.x || cameraVelocity.y) cameraFrame = requestAnimationFrame(animateCamera);
  else lastCameraTime = 0;
}

function moveCamera(next, animate = false, response = 80, input = 'program') {
  living.clear();
  const minimum = minimumZoom();
  const destination = clampCamera(next, extent, size, minimum);
  if (mode === 'explore' && camera.z <= minimum * 1.005 && next.z <= minimum * 1.005 && Math.abs(next.y-camera.y) > .001 && Math.abs(destination.y-camera.y) < .001) showDragHint();
  if(Math.abs(destination.x-camera.x)<.0001 && Math.abs(destination.y-camera.y)<.0001 && Math.abs(destination.z-camera.z)<.000001) { stopCamera(); return; }
  if (!animate || reduce.matches) { stopCamera(); camera = destination; requestCameraPaint(); return; }
  cameraVelocity = { x: 0, y: 0 }; cameraTarget = destination; cameraResponse = response;
  cameraInput = input;
  if (!cameraFrame) { lastCameraTime = performance.now(); cameraFrame = requestAnimationFrame(animateCamera); }
}

function startCameraGlide(velocity) {
  velocity = { x: velocity.x * SCROLL_FEEL.flickGain, y: velocity.y * SCROLL_FEEL.flickGain };
  if (mode !== 'explore' || reduce.matches || Math.hypot(velocity.x,velocity.y) < SCROLL_FEEL.minGlideSpeed) return;
  stopCamera(); living.clear(true); cameraVelocity = velocity;
  lastCameraTime = performance.now();
  cameraFrame = requestAnimationFrame(animateCamera);
}

function zoom(factor, point = pivot, animate = false, response = 80, input = 'zoom') {
  if (mode !== 'explore') return;
  if (factor > 1) markDragHintAction('zoom');
  if (factor < 1 && camera.z <= minimumZoom() * 1.005) showDragHint();
  preset = 'custom';
  moveCamera(zoomAt(animate && cameraInput === input && cameraTarget ? cameraTarget : camera, factor, point, pivot, minimumZoom()), animate, response, input);
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
  const layoutChanged = remeasureLayout || !startingBoxes.length;
  const widthChanged = Math.abs(innerWidth-layoutWidth) > 1 || !startingBoxes.length;
  const previousPivot = pivot;
  living.clear(true);
  if (widthChanged) { stopCamera(); introVelocity = 0; }
  headerHeight = header.offsetHeight;
  headerWidth = header.offsetWidth;
  size = { w: innerWidth, h: innerHeight, top: 0, fitTop: Math.ceil(measurement.querySelector('.site-header').offsetHeight + 16) };
  pivot = { x: size.w / 2, y: (size.h + size.top) / 2 };
  if (mode === 'intro') nativeIntro.resize(introScrollRange(), progress);
  if (layoutChanged) {
    const grid = measurement.querySelector('.masonry-grid');
    const tiles = [...grid.children];
    // Batch reads before writes so each tile does not force another layout.
    const rows = tiles.map(tile => Math.ceil(tile.querySelector('.product-photo').getBoundingClientRect().height + parseFloat(getComputedStyle(tile).paddingBottom)));
    tiles.forEach((tile, index) => { tile.style.gridRowEnd = 'span ' + rows[index]; });
    grid.dataset.masonry = 'true';
    startingBoxes = sourceCovers.map(tile => {
      const box = tile.querySelector('.product-photo').getBoundingClientRect();
      return { x: box.left - size.w / 2, y: box.top, w: box.width, h: box.height };
    });
    headerAnchor = homeAnchor(size);
    layoutWidth = innerWidth;
    previewWarmProgress = 0;
    for (const item of items) {
      const start = startingBoxes[item.project.index];
      const cover = item.photoIndex === 0, width = cover ? start.w : start.w * .45;
      item.revealStart = {
        x: cover ? start.x : start.x + (start.w - width) / 2 + (item.photoIndex % 2 ? 1 : -1) * start.w * .65,
        y: cover ? start.y : start.y + start.h * .3 + Math.floor(item.photoIndex / 2) * start.h * .12,
        width, phase: item.project.index / projects.length * .1
      };
    }
  }
  if (mode === 'explore') {
    if (!widthChanged) {
      const shift = pivot.y - previousPivot.y;
      camera = { ...camera, y: camera.y + shift / camera.z };
      if (cameraTarget) cameraTarget = { ...cameraTarget, y: cameraTarget.y + shift / cameraTarget.z };
    }
    const destination = preset === 'home' ? homeCamera() : preset === 'all' ? fitCamera(extent,size) : null;
    if (destination) {
      if (cameraTarget) cameraTarget = destination;
      else camera = destination;
    } else {
      camera = clampCamera(camera, extent, size, minimumZoom());
      if (cameraTarget) cameraTarget = clampCamera(cameraTarget, extent, size, minimumZoom());
    }
  }
  if (mode === 'explore' && !layoutChanged) paintCamera();
  else paintLayout(progress);
  if (layoutChanged) refreshImageQuality();
}

addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => measure(Math.abs(innerWidth - layoutWidth) > 1)); });
function isVerticalWheelZoom(event) {
  if (event.shiftKey || event.ctrlKey || event.metaKey || !event.deltaY) return false;
  const vertical = Math.abs(event.deltaY);
  const horizontal = Math.abs(event.deltaX);
  // A vertical-only wheel zooms. Horizontal or two-axis trackpad gestures keep
  // their existing panning behavior, and the canvas can always be dragged.
  return horizontal <= Math.max(2, vertical * .12);
}
function handleWorldWheel(event) {
  if (dialog.open) return;
  if (!overviewReady) { event.preventDefault(); return; }
  living.clear();
  event.preventDefault();
  const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.h : 1;
  const response = wheelResponse(event, performance.now());
  if (mode === 'intro') {
    if (!event.ctrlKey && !event.metaKey) advanceIntro(event.deltaY * factor / introScrollRange(), { response });
    return;
  }
  // Ignore only the remaining momentum of the gesture that completed the intro.
  if (performance.now() < navigationReadyAt) { navigationReadyAt = performance.now() + 100; return; }
  if (mode === 'explore' && !event.ctrlKey && !event.metaKey && camera.z <= minimumZoom() * 1.005 && Math.abs(event.deltaY) > 0) considerDragHint(Math.abs(event.deltaY * factor));
  if (event.ctrlKey || event.metaKey || isVerticalWheelZoom(event)) zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .01), { x: event.clientX, y: event.clientY }, true, response, 'wheel-zoom');
  else {
    const dx = (event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX) * factor * SCROLL_FEEL.wheelGain;
    const dy = (event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY) * factor * SCROLL_FEEL.wheelGain;
    preset = 'custom';
    if (dx || dy) markDragHintAction('drag');
    const origin = cameraInput === 'wheel-pan' && cameraTarget ? cameraTarget : camera;
    moveCamera({ x: origin.x + dx / origin.z, y: origin.y + dy / origin.z, z: origin.z }, true, response, 'wheel-pan');
  }
}
// Let native wheel/trackpad deltas and their momentum reach the opening scroller.
view.addEventListener('wheel', () => {
  if (mode === 'intro' && !dialog.open) { living.clear(); stopIntro(); }
}, { passive: true });

const points = new Map();
let gesture = null;
const pair = () => { const [a, b] = [...points.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) }; };
function resetGesture() { points.clear(); gesture = null; flickTracker.reset(); delete view.dataset.dragging; }
view.addEventListener('pointerdown', event => {
  if (event.target.closest('a,.portfolio-theme-toggle') || event.button > 0 || dialog.open) return;
  if (mode === 'intro' && event.pointerType === 'touch') {
    stopIntro();
    const point = { x: event.clientX, y: event.clientY };
    points.set(event.pointerId, point);
    if (!gesture) gesture = { start: point, last: point, startedMode: mode, moved: false, multi: false, native: true, pointerType: event.pointerType, item: event.target.closest('.world-item') };
    else gesture.multi = gesture.moved = true;
    return;
  }
  event.preventDefault();
  stopCamera();
  if (mode === 'intro') stopIntro();
  const point = { x: event.clientX, y: event.clientY };
  flickTracker.reset(point, inputTime(event));
  points.set(event.pointerId, point);
  view.setPointerCapture(event.pointerId);
  if (points.size === 1) {
    const hit = mode === 'explore' ? living.targetAt(point, true, event.pointerType === 'touch') : null;
    gesture = { start: point, last: point, startedMode: mode, moved: false, multi: false, pointerType: event.pointerType, item: mode === 'explore' ? hit?.element : event.target.closest('.world-item') };
  }
  else if (gesture) { flickTracker.reset(); gesture.multi = gesture.moved = true; gesture.pair = pair(); }
});
view.addEventListener('pointermove', event => {
  if (mode === 'explore' && !overviewReady) { if (event.cancelable) event.preventDefault(); return; }
  if (!points.has(event.pointerId) || !gesture) {
    if (!points.size && event.pointerType === 'mouse') living.pointer({x:event.clientX,y:event.clientY});
    return;
  }
  if (gesture.native) {
    const point = { x: event.clientX, y: event.clientY };
    points.set(event.pointerId, point);
    if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 6) gesture.moved = true;
    gesture.last = point;
    return;
  }
  event.preventDefault();
  const point = { x: event.clientX, y: event.clientY };
  points.set(event.pointerId, point);
  if (gesture.startedMode === 'intro' && mode === 'explore') { gesture.moved = true; gesture.last = point; return; }
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
  const samples = event.getCoalescedEvents?.();
  if (samples?.length) for (const sample of samples) flickTracker.sample({ x: sample.clientX, y: sample.clientY }, inputTime(sample));
  flickTracker.sample(point, inputTime(event));
  if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 6) gesture.moved = true;
  if (gesture.moved) {
    living.clear();
    if (mode === 'intro') advanceIntro((gesture.last.y - point.y) / introScrollRange(), { direct: true });
    else {
      preset = 'custom';
      view.dataset.dragging = 'true';
      if (camera.z <= minimumZoom() * 1.005 && Math.abs(point.y - gesture.last.y) > .1) considerDragHint(Math.abs(point.y - gesture.last.y));
      markDragHintAction('drag');
      moveCamera({ x: camera.x - (point.x - gesture.last.x) / camera.z, y: camera.y - (point.y - gesture.last.y) / camera.z, z: camera.z });
    }
  }
  gesture.last = point;
});
function releasePointer(event, cancelled = false) {
  if (!points.has(event.pointerId)) return;
  if (cancelled) { living.clear(true); stopCamera(); stopIntro(); }
  const previous = gesture;
  const releaseTime = inputTime(event);
  if (!cancelled && previous && !previous.multi && Number.isFinite(event.clientX) && Number.isFinite(event.clientY) && (event.clientX !== previous.last.x || event.clientY !== previous.last.y)) flickTracker.sample({ x: event.clientX, y: event.clientY }, releaseTime);
  const velocity = flickTracker.velocity(releaseTime);
  points.delete(event.pointerId);
  if (view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
  if (points.size && gesture) {
    gesture.start = gesture.last = [...points.values()][0];
    gesture.moved = true;
    gesture.pair = points.size >= 2 ? pair() : null;
    return;
  }
  resetGesture();
  if (!cancelled && previous?.moved && !previous.native && !previous.multi && previous.pointerType !== 'mouse' && previous.startedMode === mode) {
    if (mode === 'intro') startIntroGlide(-velocity.y / introScrollRange());
    else startCameraGlide({ x: -velocity.x, y: -velocity.y });
  }
  if (!cancelled && previous && !previous.moved && !previous.multi) {
    if (previous.item) {
      const item = items.find(item => item.element === previous.item);
      openGallery(Number(previous.item.dataset.piece), Number(previous.item.dataset.photo), previous.item);
    } else living.clear();
  }
}
view.addEventListener('pointerup', event => releasePointer(event));
view.addEventListener('pointercancel', event => releasePointer(event, true));
// Capture can be released before the final up event. A genuine cancel still
// stops motion, while a normal release is also observed outside the canvas.
addEventListener('pointerup', event => releasePointer(event));
addEventListener('pointercancel', event => releasePointer(event, true));
view.addEventListener('pointerleave', () => { if (!points.size) living.clear(); });
view.addEventListener('focusin', event => { const item = items.find(item => item.element === event.target); if (item && event.target.matches(':focus-visible')) living.emphasize(item); });
view.addEventListener('focusout', event => { if (!event.relatedTarget?.closest('.world-item')) living.clear(); });
view.addEventListener('dragstart', event => event.preventDefault());
view.addEventListener('dblclick', event => {
  if (mode === 'explore' && !overviewReady) { event.preventDefault(); return; }
  if (mode === 'explore' && !event.target.closest('.world-item,a,.portfolio-theme-toggle')) { event.preventDefault(); zoom(1.8, { x: event.clientX, y: event.clientY }, true); }
});
view.addEventListener('click', event => {
  if (mode === 'explore' && !overviewReady && !event.target.closest('a,.portfolio-theme-toggle')) { event.preventDefault(); return; }
  const item = event.target.closest('.world-item');
  if (item) { event.preventDefault(); if (event.detail === 0) openGallery(Number(item.dataset.piece), Number(item.dataset.photo), item); }
});
function stopMotion() { resetGesture(); stopCamera(); stopIntro(); living.clear(true); }
addEventListener('blur', stopMotion);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopMotion(); previewQueue.pause(); detailQueue.pause(); }
  else if (!dialog.open) { previewQueue.resume(); detailQueue.resume(); requestCameraPaint(); }
});
reduce.addEventListener('change', stopMotion);

let safariScale = 1;
document.addEventListener('gesturestart', event => { if (!dialog.open) { stopCamera(); living.clear(); event.preventDefault(); safariScale = event.scale || 1; } }, { passive: false });
document.addEventListener('gesturechange', event => {
  if (dialog.open) return;
  event.preventDefault();
  if (mode === 'explore' && points.size < 2) zoom(event.scale / safariScale, { x: event.clientX || pivot.x, y: event.clientY || pivot.y });
  safariScale = event.scale;
}, { passive: false });
document.addEventListener('gestureend', event => { if (!dialog.open) event.preventDefault(); }, { passive: false });

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  items[0].element.focus({ preventScroll: true });
});
addEventListener('keydown', event => {
  if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('.portfolio-theme-toggle')) return;
  if (mode === 'explore' && !overviewReady) { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageDown','PageUp',' ','End','Home','+','=','-','0'].includes(event.key)) event.preventDefault(); return; }
  if (mode === 'intro') {
    const amount = { ArrowDown: .065, ArrowUp: -.065, PageDown: .23, PageUp: -.23, ' ': .23, End: 1, Home: -1 }[event.key];
    if (amount !== undefined) { event.preventDefault(); advanceIntro(amount); }
    return;
  }
  const direction = { ArrowLeft: [-120, 0], ArrowRight: [120, 0], ArrowUp: [0, -120], ArrowDown: [0, 120], PageDown: [0, (size.h - size.top) * .7], PageUp: [0, -(size.h - size.top) * .7] }[event.key];
  if (direction) { event.preventDefault(); preset = 'custom'; const origin = cameraInput === 'keys' && cameraTarget ? cameraTarget : camera; moveCamera({ x: origin.x + direction[0] / origin.z, y: origin.y + direction[1] / origin.z, z: origin.z }, true, 80, 'keys'); }
  else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.35, pivot, true); }
  else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.35, pivot, true); }
  else if (event.key === '0') { event.preventDefault(); showAll(); }
  else if (event.key === 'Home') { event.preventDefault(); returnHome(); }
});

let gallery = null;
function getGallery() {
  if (!gallery) gallery = mountGallery({ pieces, onOpen() {
  stopIntro(); stopCamera(); living.clear(true);
  nativeIntro.pause();
  previewQueue.pause(); detailQueue.pause(); detailQueue.clear();
}, onClose() {
  nativeIntro.resume(progress);
  previewQueue.resume(); requestCameraPaint();
  if(pendingMeasure) {pendingMeasure=false;measure(Math.abs(innerWidth-layoutWidth)>1);}
  scheduleImageQuality();
} });
  return gallery;
}
function openGallery(pieceIndex, photoIndex, trigger) { if (mode === 'explore' && !overviewReady) return; getGallery().open(pieceIndex, photoIndex, trigger); }
function closeGallery() { gallery?.close(); }

// Keep the header inside the native scroll hit area without changing its pose.
view.prepend(header);
view.append(scrollHint);
const nativeIntro = createNativeIntroScroll({ view,
  onChange(value) {
    if (mode !== 'intro' || dialog.open) return;
    stopIntro();
    progress = targetProgress = value;
    paintLayout(value);
    if (value === 1) finishIntro();
  },
  onIdle: scheduleImageQuality
});

measure();
document.fonts.ready.then(() => measure(true));



