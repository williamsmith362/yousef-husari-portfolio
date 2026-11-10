const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function damp(value, target, elapsedMs, responseMs = 80) {
  return target + (value - target) * Math.exp(-Math.max(0, elapsedMs) / responseMs);
}

// Exact integration keeps the glide distance consistent at 60Hz and 120Hz.
export function decayVelocity(velocity, elapsedMs, decayMs = 85) {
  const decay = Math.exp(-Math.max(0, elapsedMs) / decayMs);
  return { distance: velocity * decayMs / 1000 * (1 - decay), velocity: velocity * decay };
}

export function dampCamera(camera, target, elapsedMs, responseMs = 80) {
  const amount = 1 - Math.exp(-Math.max(0, elapsedMs) / responseMs);
  const z = Math.exp(Math.log(camera.z) + Math.log(target.z / camera.z) * amount);
  const span = 1 / camera.z - 1 / target.z;
  const travel = Math.abs(span) > 1e-8 ? clamp((1 / camera.z - 1 / z) / span, 0, 1) : amount;
  return { x: camera.x + (target.x - camera.x) * travel, y: camera.y + (target.y - camera.y) * travel, z };
}

export function createVelocityTracker({ windowMs = 80, staleMs = 70, maxSpeed = 2800 } = {}) {
  let samples = [];
  return {
    reset(point, time) { samples = point ? [{ ...point, time }] : []; },
    sample(point, time) {
      if (samples.length && time <= samples.at(-1).time) return;
      samples.push({ ...point, time });
      while (samples.length > 2 && samples[1].time < time - windowMs) samples.shift();
    },
    velocity(time) {
      if (samples.length < 2 || time - samples.at(-1).time > staleMs) return { x: 0, y: 0 };
      const first = samples[0], last = samples.at(-1), elapsed = last.time - first.time;
      if (elapsed < 10) return { x: 0, y: 0 };
      let x = (last.x - first.x) * 1000 / elapsed, y = (last.y - first.y) * 1000 / elapsed;
      const speed = Math.hypot(x, y), limit = Math.min(1, maxSpeed / Math.max(1, speed));
      x *= limit; y *= limit;
      return { x, y };
    }
  };
}

export function createWheelSmoothing() {
  let last = -Infinity, fineUntil = -Infinity;
  return (event, time) => {
    if (event.ctrlKey || event.metaKey) return 28;
    const fine = event.deltaMode === 0 && (Math.abs(event.deltaX) > 0 || !Number.isInteger(event.deltaY) || Math.abs(event.deltaY) < 40 || time - last < 24);
    if (fine) fineUntil = time + 240;
    last = time;
    return time < fineUntil ? 28 : 80;
  };
}
