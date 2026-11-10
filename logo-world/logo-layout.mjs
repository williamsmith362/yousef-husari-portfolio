import { LOGO_PATHS } from './logo-paths.mjs';
import { BOARD_HEADER_AREA } from './board-header.mjs?v=locked-board-1';

const noise = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const ratioFor = piece => piece.kind === 'jacket' ? 1 : piece.kind === 'small-object' ? 1.25 : .8;
const curves = LOGO_PATHS.map(points => {
  const distances = [0];
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return { points, distances, length: distances.at(-1) };
});

function sample(curve, distance) {
  const d = Math.max(0, Math.min(curve.length, distance));
  let index = 1;
  while (index < curve.distances.length - 1 && curve.distances[index] < d) index++;
  const a = curve.points[index - 1], b = curve.points[index];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const t = (d - curve.distances[index - 1]) / Math.max(.0001, length);
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / length, ty: (b[1] - a[1]) / length };
}

function collides(a, b) {
  return a.x < b.x + b.w + 9 && a.x + a.w + 9 > b.x && a.y < b.y + b.h + 9 && a.y + a.h + 9 > b.y;
}

// Contiguous parts of the pen strokes belong to individual projects. Varying
// size, spacing, aspect ratio and side offsets makes loose clusters, not rows.
export function makeLogoProjects(pieces) {
  const specifications = pieces.map((piece, index) => {
    const mainWidth = 155 + noise(index * 7 + 3) * 42;
    const items = piece.images.map((image, photoIndex) => {
      let w = photoIndex === 0 ? mainWidth : mainWidth * (.63 + noise(index * 31 + photoIndex * 3) * .26);
      const ratio = photoIndex === 0 ? ratioFor(piece) : Math.max(.62, Math.min(1.65, image.bounds.width / image.bounds.height));
      let h = w / ratio;
      if (photoIndex > 0) {
        const mainHeight = mainWidth / ratioFor(piece);
        const factor = Math.min(1, Math.sqrt(mainWidth * mainHeight * .82 / (w * h)), Math.max(mainWidth, mainHeight) * 1.05 / Math.max(w, h));
        w *= factor; h *= factor;
      }
      const weight = Math.hypot(w, h) * .65 + 8;
      return { image, photoIndex, w, h, ratio, weight };
    });
    return { piece, index, items, weight: items.reduce((sum, item) => sum + item.weight, 0) + 180 };
  });
  const totalWeight = specifications.reduce((sum, p) => sum + p.weight, 0);
  const totalLength = curves.reduce((sum, c) => sum + c.length, 0);
  let scale = totalWeight / totalLength * .90;
  let finalProjects;

  for (let attempt = 0; attempt < 22; attempt++) {
    const allocations = curves.map(() => []);
    const loads = curves.map(() => 0);
    const remaining = specifications.slice(1);
    allocations[0].push(specifications[0]); loads[0] += specifications[0].weight;
    // Give every flourish a project; the shortest one receives a small group.
    for (const pathIndex of [3, 2, 1]) {
      const capacity = curves[pathIndex].length * scale * .88;
      const candidates = remaining.filter(p => p.weight <= capacity).sort((a, b) => b.weight - a.weight);
      const chosen = candidates[0] || remaining.reduce((a, b) => a.weight < b.weight ? a : b);
      allocations[pathIndex].push(chosen); loads[pathIndex] += chosen.weight;
      remaining.splice(remaining.indexOf(chosen), 1);
    }
    remaining.sort((a, b) => b.weight - a.weight).forEach(project => {
      let chosen = 0, best = Infinity;
      curves.forEach((curve, index) => {
        const fill = (loads[index] + project.weight) / curve.length;
        if (fill < best) { best = fill; chosen = index; }
      });
      allocations[chosen].push(project); loads[chosen] += project.weight;
    });

    const occupied = [], projects = [];
    let failed = false;
    for (let pathIndex = 0; pathIndex < curves.length && !failed; pathIndex++) {
      const curve = curves[pathIndex];
      const ordered = allocations[pathIndex].slice().sort((a, b) => a.index - b.index);
      const unit = curve.length / loads[pathIndex];
      let projectCursor = 0;
      for (const specification of ordered) {
        let photoCursor = projectCursor + 90;
        const positioned = [];
        for (const item of specification.items) {
          const nominal = (photoCursor + item.weight / 2) * unit;
          const lower = (projectCursor + 15) * unit;
          const upper = (projectCursor + specification.weight - 15) * unit;
          let placed = null;
          for (let trial = 0; trial < 105; trial++) {
            const offset = trial === 0 ? 0 : Math.ceil(trial / 2) * 18 * (trial % 2 ? 1 : -1) / scale;
            const distance = Math.max(lower, Math.min(upper, nominal + offset));
            const p = sample(curve, distance);
            // Keep the cream utility group on the left-hand curve instead of
            // letting its supporting views drift away from the trouser cover.
            const sideSpread = specification.piece.id === '03' ? .7 : 1;
            const side = ((noise(specification.index * 101 + item.photoIndex * 17 + 7) - .5) * item.w * 1.5 + (trial ? Math.sin(trial * 2.4) * item.w * .7 : 0)) * sideSpread;
            const x = p.x * scale - p.ty * side - item.w / 2;
            const y = p.y * scale + p.tx * side - item.h / 2;
            const box = { x, y, w: item.w, h: item.h };
            if (!occupied.some(other => collides(box, other))) { placed = { ...item, x, y }; break; }
          }
          if (!placed) { failed = true; break; }
          positioned.push(placed); occupied.push(placed);
          if (specification.index === 0 && item.photoIndex === 0) {
            const originX = placed.x + placed.w / 2;
            const originY = placed.y + placed.h / 2 - 340;
            occupied.push({ x: originX + BOARD_HEADER_AREA.x, y: originY + BOARD_HEADER_AREA.y, w: BOARD_HEADER_AREA.w, h: BOARD_HEADER_AREA.h });
          }
          photoCursor += item.weight;
        }
        if (failed) break;
        projects.push({ ...specification, items: positioned });
        projectCursor += specification.weight;
      }
    }
    if (!failed) { finalProjects = projects.sort((a, b) => a.index - b.index); break; }
    scale *= 1.085;
  }
  if (!finalProjects) throw new Error('The logo layout could not be placed safely.');

  const cover = finalProjects[0].items[0];
  const offsetX = cover.x + cover.w / 2, offsetY = cover.y + cover.h / 2 - 340;
  return finalProjects.map(project => {
    const positions = project.items.map(item => ({ ...item, x: item.x - offsetX, y: item.y - offsetY }));
    const x = Math.min(...positions.map(item => item.x)), y = Math.min(...positions.map(item => item.y));
    const w = Math.max(...positions.map(item => item.x + item.w)) - x;
    const h = Math.max(...positions.map(item => item.y + item.h)) - y;
    return { piece: project.piece, index: project.index, x, y, w, h, items: positions.map(item => ({ ...item, x: item.x - x, y: item.y - y })) };
  });
}

