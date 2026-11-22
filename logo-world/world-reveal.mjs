const clamp = value => Math.max(0, Math.min(1, value));
const mix = (from, to, weight) => from + (to - from) * weight;
const phase = (start, end, progress) => clamp((progress - start) / (end - start));
const smooth = t => t * t * (3 - 2 * t);

export function easeReveal(progress) {
  const t = clamp(progress);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function revealCamera(progress, pivot, overview) {
  const travel = easeReveal(phase(.06, .93, progress));
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
    const cross = horizontal ? y : x;
    const direction = primary < 0 ? -1 : 1;
    const edge = horizontal ? (direction < 0 ? 0 : 1) : (direction < 0 ? 2 : 3);
    return { item, endX, endY, toX: centerX * overview.z, toY: centerY * overview.z,
      horizontal, direction, edge, reach: clamp(Math.abs(primary)), cross: clamp(Math.abs(cross)) };
  });

  // Start with a cover at each edge. The outer groups lead and the inner
  // groups and their supporting views follow into the same composition.
  const covers = new Map();
  for (const route of routes) {
    if (!route.item.photoIndex && !covers.has(route.edge)) covers.set(route.edge, route);
  }
  for (const route of routes) {
    const { item, horizontal, direction, edge, reach, cross, toX, toY } = route;
    const lead = covers.get(edge) === route;
    const cover = item.photoIndex === 0;
    const outer = 1 - reach;
    const step = edge * .013;
    const follow = cover ? 0 : .13 + Math.min(.12, (item.photoIndex - 1) * .014);
    const appear = lead ? .012 + step : .085 + step + .13 * outer + .045 * cross + follow;
    const land = lead ? .77 + step : .79 + .10 * outer + .027 * cross + .042 * Number(!cover);
    const displayWidth = Math.min(size.w, size.h);
    const entryWidth = lead ? Math.min(154, displayWidth * .265) :
      Math.min(126, displayWidth * (cover ? .192 : .129)) * (.88 + .12 * reach);
    const entryHeight = entryWidth * item.h / item.w;
    const startX = horizontal ? direction * (size.w / 2 + entryWidth / 2 + 5) : toX * 1.28;
    const startY = horizontal ? toY * 1.28 : direction * (size.h / 2 + entryHeight / 2 + 5);

    item.revealStart = {
      endX: route.endX, endY: route.endY, toX, toY, startX, startY, horizontal,
      entryWidth, logWidthChange: Math.log(item.w * overview.z / entryWidth), appear, land, lead
    };
  }
}

export function revealContraction(progress) {
  return easeReveal(phase(.10, .89, progress));
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
  item.active = Boolean(item.imageLevel) && progress >= departure;
  if (!item.active) return;
  const arrival = Math.max(route.land, departure + .18);
  const time = phase(departure, arrival, progress);
  const travel = smooth(time);
  const crossTravel = easeReveal(time);
  const screenX = mix(route.startX, route.toX, route.horizontal ? travel : crossTravel);
  const screenY = mix(route.startY, route.toY, route.horizontal ? crossTravel : travel);
  const sizeTime = mix(contraction, crossTravel, route.lead ? .42 : .28);
  const screenWidth = route.entryWidth * Math.exp(route.logWidthChange * sizeTime);

  item.width = screenWidth / camera.z;
  item.height = item.width * item.h / item.w;
  item.x = camera.x + screenX / camera.z - item.width / 2;
  item.y = camera.y + screenY / camera.z - item.height / 2;
}
