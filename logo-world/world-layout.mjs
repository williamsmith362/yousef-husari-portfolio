export { makeLogoProjects as makeProjects } from "./logo-layout.mjs?v=hoodie-growth-1";
export const intersects = (a, b, gap = 0) => a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
export const ratioFor = piece => piece.kind === 'jacket' ? 1 : piece.kind === 'small-object' ? 1.25 : .8;

export function getExtent(projects) {
  const extent = projects.reduce((e, p) => ({ l: Math.min(e.l, p.x), r: Math.max(e.r, p.x + p.w), t: Math.min(e.t, p.y), b: Math.max(e.b, p.y + p.h) }), { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity });
  return { ...extent, pieceCount: projects.length };
}

export function fitCamera(extent, view) {
  const fill = .70 + .16 * (1 - Math.exp(-Math.max(0, (extent.pieceCount ?? 47) - 47) / 25));
  return { x: (extent.l + extent.r) / 2, y: (extent.t + extent.b) / 2, z: fill * Math.min((view.w - 56) / (extent.r - extent.l), (view.h - (view.fitTop ?? view.top) - 56) / (extent.b - extent.t)) };
}

export function clampCamera(camera, extent, view, minimum, maximum = 3) {
  const z = Math.max(minimum, Math.min(maximum, camera.z));
  const halfW = Math.max(1, view.w / 2 - 48) / z;
  const halfH = Math.max(1, (view.h - view.top) / 2 - 48) / z;
  const x = extent.r - extent.l <= halfW * 2 ? (extent.l + extent.r) / 2 : Math.max(extent.l + halfW, Math.min(extent.r - halfW, camera.x));
  const y = extent.b - extent.t <= halfH * 2 ? (extent.t + extent.b) / 2 : Math.max(extent.t + halfH, Math.min(extent.b - halfH, camera.y));
  return { x, y, z };
}

// Keep the world point under the cursor or fingers still while zooming.
export function zoomAt(camera, factor, point, pivot, minimum, maximum = 3) {
  const z = Math.max(minimum, Math.min(maximum, camera.z * factor));
  return { x: camera.x + (point.x - pivot.x) * (1 / camera.z - 1 / z), y: camera.y + (point.y - pivot.y) * (1 / camera.z - 1 / z), z };
}



