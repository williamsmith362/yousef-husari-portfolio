const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Equal scroll distances produce equal proportional changes of scale.
export function revealCamera(progress, pivot, destination) {
  const p = clamp(progress), travel = smooth(p);
  return { x: destination.x * travel, y: pivot.y + (destination.y - pivot.y) * travel, z: Math.exp(Math.log(destination.z) * p) };
}

export function homePresence(camera, minimumZoom, cover, pivot, view, headerHeight) {
  const zoom = smooth((Math.log(camera.z / minimumZoom) - Math.log(1.8)) / Math.log(4));
  return { x: view.w / 2, top: (view.h - headerHeight) / 2, opacity: zoom };
}
