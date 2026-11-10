// Matched to the blank oval in the supplied board screenshot, relative to
// the first backpack. These coordinates belong to the board, not the screen.
export const BOARD_HEADER_AREA = Object.freeze({ x: -45, y: -535, w: 640, h: 200 });

export function boardHeaderPose(camera, pivot, dimensions) {
  const width = Math.max(1, dimensions.width);
  const height = Math.max(1, dimensions.height);
  const fit = Math.min(BOARD_HEADER_AREA.w / width, BOARD_HEADER_AREA.h / height);
  const x = BOARD_HEADER_AREA.x + (BOARD_HEADER_AREA.w - width * fit) / 2;
  const y = BOARD_HEADER_AREA.y + (BOARD_HEADER_AREA.h - height * fit) / 2;
  return {
    x: pivot.x + (x - camera.x) * camera.z,
    top: pivot.y + (y - camera.y) * camera.z,
    scale: camera.z * fit
  };
}
