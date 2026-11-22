const clamp = value => Math.max(0, Math.min(1, value));
const mix = (from, to, weight) => from + (to - from) * weight;
const phase = (start, end, progress) => clamp((progress - start) / (end - start));

export function easeReveal(progress) {
  const t = clamp(progress);
  return t * t * t * (t * (6 * t - 15) + 10);
}

export function revealCamera(progress, pivot, overview) {
  const travel = easeReveal(phase(.04, .94, progress));
  return {
    x: overview.x * travel,
    y: mix(pivot.y, overview.y, travel),
    z: Math.exp(Math.log(overview.z) * travel)
  };
}

export function planReveal(item, box, pivot, size, overview) {
  const cover = item.photoIndex === 0;
  const openingCover = cover && box.y < size.h + 28;
  const endX = item.project.x + item.xLocal;
  const endY = item.project.y + item.yLocal;
  const toX = (endX + item.w / 2 - overview.x) * overview.z;
  const toY = (endY + item.h / 2 - overview.y) * overview.z;
  const sweep = .66 * clamp(.5 + toX / size.w) + .34 * clamp(.5 + toY / size.h);

  // The first covers hold their real grid positions. Supporting views unfold
  // from their own cover, including projects that start below the fold.
  const side = item.photoIndex % 2 ? 1 : -1;
  const layer = Math.floor(item.photoIndex / 2);
  const originX = box.x + box.w / 2 + (cover ? 0 : side * box.w * (.26 + layer * .035));
  const originY = box.y + box.h / 2 + (cover ? 0 : box.h * (layer * .07 - .06));
  const offscreen = openingCover ? 0 : clamp((originY - size.h * .62) / size.h);
  const fold = size.h * .76;
  const foldedY = openingCover ? originY : Math.min(originY, fold) +
    Math.log1p(Math.max(0, originY - fold) / size.h) * size.h * .10;
  const fromX = mix(originX, toX + side * size.w * .17, offscreen * .68);
  const fromY = mix(foldedY - pivot.y, toY + side * size.h * .13, offscreen * .86);
  const fromWidth = box.w * (cover ? 1 : .46);
  const widthRatio = Math.log(item.w * overview.z / fromWidth);
  const firstExposure = (cover ? .13 : .20) + sweep * .30 + Math.min(.07, layer * .012);
  const land = Math.min(.985, item.inkTime + .058);
  const appear = openingCover ? 0 : Math.min(land - .23, Math.max(firstExposure, item.inkTime - .38));
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.min(38, distance * .13) * side;

  return {
    openingCover, fromX, fromY, fromWidth, widthRatio, toX, toY, endX, endY,
    appear, land, bendX: -dy / distance * bend, bendY: dx / distance * bend
  };
}

export function placeRevealItem(item, progress, camera, pivot, settled = false) {
  const route = item.revealStart;
  if (settled) {
    item.x = route.endX;
    item.y = route.endY;
    item.width = item.w;
    item.height = item.h;
    item.alpha = 1;
    return;
  }

  const departure = route.openingCover ? .04 : Math.max(.05, route.appear - .07);
  const travel = easeReveal(phase(departure, route.land, progress));
  const contraction = easeReveal(phase(.04, .86, progress));
  const arc = 4 * travel * (1 - travel);
  const nearScale = 1 - .24 * contraction;
  const screenX = mix(route.fromX * nearScale, route.toX, travel) + route.bendX * arc;
  const screenY = mix(route.fromY * nearScale, route.toY, travel) + route.bendY * arc;
  const sizeTime = route.openingCover ? mix(contraction, travel, .28) : mix(contraction, travel, .63);
  const screenWidth = route.fromWidth * Math.exp(route.widthRatio * sizeTime);

  item.width = screenWidth / camera.z;
  item.height = item.width * item.h / item.w;
  item.x = camera.x + screenX / camera.z - item.width / 2;
  item.y = camera.y + screenY / camera.z - item.height / 2;
  item.alpha = route.openingCover ? 1 : easeReveal(phase(route.appear, route.appear + .19, progress));
}
