const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export function homeAnchor(view) {
  const inset=view.w<620?32:48;
  return {x:inset-view.w/2,y:inset};
}

export function screenBox(item,camera,pivot) {
  return {x:pivot.x+(item.x-camera.x)*camera.z,y:pivot.y+(item.y-camera.y)*camera.z,w:item.width*camera.z,h:item.height*camera.z};
}

export function inViewport(box,view,margin=0) {
  return box.x<view.w+margin && box.x+box.w>-margin && box.y<view.h+margin && box.y+box.h>-margin;
}

// Equal scroll distances produce equal proportional changes of scale.
export function revealCamera(progress, pivot, destination) {
  const p = clamp(progress), travel = smooth(p);
  return { x: destination.x * travel, y: pivot.y + (destination.y - pivot.y) * travel, z: Math.exp(Math.log(destination.z) * p) };
}

export function homePresence(camera, minimumZoom, anchor, pivot) {
  const zoom = smooth((Math.log(camera.z / minimumZoom) - Math.log(1.8)) / Math.log(4));
  return { x: pivot.x + (anchor.x - camera.x) * camera.z, top: pivot.y + (anchor.y - camera.y) * camera.z, scale: camera.z, opacity: zoom };
}
