const clamp = value => Math.max(0, Math.min(1, value));
const strokeStarts = [.47, .62, .67, .76];

function distancesFor(points) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return distances;
}

function resample(points, distances, spacing) {
  const length = distances.at(-1);
  const steps = Math.max(2, Math.ceil(length / spacing));
  const sampled = [points[0]];
  let index = 1;
  for (let i = 1; i < steps; i++) {
    const at = length * i / steps;
    while (distances[index] < at) index++;
    const [x, y] = points[index - 1];
    const [nextX, nextY] = points[index];
    const amount = (at - distances[index - 1]) / (distances[index] - distances[index - 1]);
    sampled.push([x + (nextX - x) * amount, y + (nextY - y) * amount]);
  }
  sampled.push(points.at(-1));
  return sampled;
}

function smoothPoints(points) {
  // Sampling at a regular distance first keeps the original raster's steps
  // from tugging the curve toward closely spaced knots.
  return points.map((point, i) => {
    if (i === 0 || i === points.length - 1) return point;
    const previous = points[i - 1];
    const next = points[i + 1];
    return point.map((value, axis) => (previous[axis] + 2 * value + next[axis]) / 4);
  });
}

function bezierPath(points) {
  const pair = (x, y) => x.toFixed(1) + ' ' + y.toFixed(1);
  let path = 'M' + pair(...points[0]);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const [px, py] = points[Math.max(0, i - 1)];
    const [nx, ny] = points[Math.min(points.length - 1, i + 2)];
    path += ' C' + pair(ax + (bx - px) / 6, ay + (by - py) / 6) + ' ' +
      pair(bx - (nx - ax) / 6, by - (ny - ay) / 6) + ' ' + pair(bx, by);
  }
  return path;
}

export function makeSignatureStrokes(trace, width) {
  const spacing = width / 158;
  const strokes = trace.map(points => {
    const regular = smoothPoints(resample(points, distancesFor(points), spacing));
    const distances = distancesFor(regular);
    return { points: regular, distances, length: distances.at(-1), d: bezierPath(regular) };
  });
  const longest = Math.max(...strokes.map(stroke => stroke.length));
  return strokes.map((stroke, index) => {
    const start = strokeStarts[index] ?? .76;
    const end = Math.min(.96, start + .11 + .37 * stroke.length / longest);
    return { ...stroke, start, end };
  });
}

export function penProgress(stroke, time) {
  const t = clamp((time - stroke.start) / (stroke.end - stroke.start));
  // Ease the tip in and out while keeping the middle of the stroke moving
  // at a steady speed, even on the longest loop.
  const edge = .18;
  const ramp = amount => {
    const u = amount / edge;
    return edge * u * u * u * (1 - u / 2) / (1 - edge);
  };
  if (t < edge) return ramp(t);
  if (t > 1 - edge) return 1 - ramp(1 - t);
  return (t - edge / 2) / (1 - edge);
}

export function photoInkTime(strokes, x, y) {
  let nearestStroke = strokes[0], nearestFraction = 0, best = Infinity;
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      const [ax, ay] = stroke.points[i - 1];
      const [bx, by] = stroke.points[i];
      const dx = bx - ax, dy = by - ay;
      const fraction = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1));
      const distance = (x - ax - dx * fraction) ** 2 + (y - ay - dy * fraction) ** 2;
      if (distance >= best) continue;
      best = distance;
      nearestStroke = stroke;
      nearestFraction = (stroke.distances[i - 1] + Math.hypot(dx, dy) * fraction) / stroke.length;
    }
  }
  // Find when the tip passes the point the photo will land beside.
  let low = nearestStroke.start, high = nearestStroke.end;
  for (let i = 0; i < 12; i++) {
    const middle = (low + high) / 2;
    if (penProgress(nearestStroke, middle) < nearestFraction) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
