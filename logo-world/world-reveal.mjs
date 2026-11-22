const clamp = value => Math.max(0, Math.min(1, value));
const mix = (from, to, weight) => from + (to - from) * weight;
const phase = (start, end, progress) => clamp((progress - start) / (end - start));
const smooth = t => t * t * (3 - 2 * t);
const leadTimes = [.018, .108, .154, .060];

function variation(seed) {
  const bits = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296;
}

export function easeReveal(progress) {
  const t = clamp(progress);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function revealCamera(progress, pivot, overview) {
  const travel = easeReveal(phase(.035, .88, progress));
  return {
    x: overview.x * travel,
    y: mix(pivot.y, overview.y, travel),
    z: Math.exp(Math.log(overview.z) * travel)
  };
}

export function planReveal(items, extent, size, overview) {
  const halfWidth = (extent.r - extent.l) / 2;
  const halfHeight = (extent.b - extent.t) / 2;
  const routes = items.map(item => {
    const endX = item.project.x + item.xLocal;
    const endY = item.project.y + item.yLocal;
    const centerX = endX + item.w / 2 - overview.x;
    const centerY = endY + item.h / 2 - overview.y;
    const x = centerX / halfWidth;
    const y = centerY / halfHeight;
    const horizontal = Math.abs(x) >= Math.abs(y);
    const primary = horizontal ? x : y;
    const direction = primary < 0 ? -1 : 1;
    const edge = horizontal ? (direction < 0 ? 0 : 1) : (direction < 0 ? 2 : 3);
    return { item, endX, endY, toX: centerX * overview.z, toY: centerY * overview.z,
      edge, x, y, reach: clamp(Math.abs(primary)) };
  });

  // Keep a recognizable lead from every side. The rest use a stable mix
  // of launch times and directions, so neighboring photos can pass in waves.
  const covers = new Map();
  for (const route of routes) {
    if (!route.item.photoIndex && !covers.has(route.edge)) covers.set(route.edge, route);
  }

  const displayWidth = Math.min(size.w, size.h);
  for (const route of routes) {
    const { item, edge, reach, x, y, toX, toY } = route;
    const lead = covers.get(edge) === route;
    const cover = item.photoIndex === 0;
    const seed = (item.project.index + 1) * 1013 + (item.photoIndex + 1) * 173;
    const rhythm = variation(seed);
    const speed = variation(seed + 541);
    const turn = variation(seed + 827) * 2 - 1;
    const appear = lead ? leadTimes[edge] : cover
      ? .035 + .28 * rhythm + .075 * (1 - reach)
      : .11 + .41 * rhythm + Math.min(.095, item.photoIndex * .013);
    const land = Math.min(.975, appear + (lead ? .46 : .33) + .29 * speed);
    const entryWidth = lead ? Math.min(154, displayWidth * .255) :
      Math.min(126, displayWidth * (cover ? .184 : .123)) * (.88 + .12 * reach);
    const entryHeight = entryWidth * item.h / item.w;
    const angle = lead ? [Math.PI, 0, -Math.PI / 2, Math.PI / 2][edge] : Math.atan2(y, x) + turn * .52;
    const vx = Math.cos(angle) * size.w;
    const vy = Math.sin(angle) * size.h;
    const limitX = Math.sign(vx) * (size.w / 2 + entryWidth / 2 + 5);
    const limitY = Math.sign(vy) * (size.h / 2 + entryHeight / 2 + 5);
    const reachX = Math.abs(vx) > .01 ? (limitX - toX) / vx : Infinity;
    const reachY = Math.abs(vy) > .01 ? (limitY - toY) / vy : Infinity;
    const distance = Math.min(reachX, reachY);
    const bend = Math.min(displayWidth * .075, Math.hypot(vx, vy) * distance * .10) * turn;
    const length = Math.hypot(vx, vy);

    item.revealStart = {
      endX: route.endX, endY: route.endY, toX, toY,
      startX: toX + vx * distance, startY: toY + vy * distance,
      bendX: vy / length * bend, bendY: -vx / length * bend,
      entryWidth, logWidthChange: Math.log(item.w * overview.z / entryWidth), appear, land, lead
    };
  }
}

export function revealContraction(progress) {
  return easeReveal(phase(.08, .90, progress));
}

export function placeRevealItem(item, progress, contraction, camera, settled = false) {
  const route = item.revealStart;
  if (settled) {
    item.x = route.endX;
    item.y = route.endY;
    item.width = item.w;
    item.height = item.h;
    item.active = true;
    return;
  }

  const departure = Math.max(route.appear, item.lateEntry);
  item.active = Boolean(item.imageLevel) && departure <= .82 && progress >= departure;
  if (!item.active) return;
  const arrival = Math.max(route.land, departure + .18);
  const time = phase(departure, arrival, progress);
  const travel = smooth(time);
  const drift = 16 * time * time * (1 - time) * (1 - time);
  const screenX = mix(route.startX, route.toX, travel) + route.bendX * drift;
  const screenY = mix(route.startY, route.toY, travel) + route.bendY * drift;
  const sizeTime = mix(contraction, easeReveal(time), .58);
  const screenWidth = route.entryWidth * Math.exp(route.logWidthChange * sizeTime);

  item.width = screenWidth / camera.z;
  item.height = item.width * item.h / item.w;
  item.x = camera.x + screenX / camera.z - item.width / 2;
  item.y = camera.y + screenY / camera.z - item.height / 2;
}
