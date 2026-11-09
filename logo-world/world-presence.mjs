const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Equal scroll distances produce equal proportional changes of scale.
export function revealCamera(progress, pivot, destination) {
  const p = clamp(progress), travel = smooth(p);
  return { x: destination.x * travel, y: pivot.y + (destination.y - pivot.y) * travel, z: Math.exp(Math.log(destination.z) * p) };
}

export function homePresence(camera, minimumZoom, cover, pivot, view, headerHeight) {
  const x = pivot.x + (cover.x - camera.x) * camera.z;
  const photoTop = pivot.y + (cover.y - cover.h / 2 - camera.y) * camera.z;
  const top = photoTop - headerHeight - 32;
  const zoom = smooth((Math.log(camera.z / minimumZoom) - Math.log(1.8)) / Math.log(4));
  const horizontal = smooth(Math.min(x - 100, view.w - 100 - x) / 90);
  const vertical = smooth(Math.min(top - 8, view.h - 80 - top - headerHeight) / 55);
  return { x, top, opacity: zoom * horizontal * vertical };
}
