export async function loadDecodedImage(src, { priority = 0, controller } = {}) {
  const image = new window.Image();
  const signal = controller?.signal;
  const cancelled = () => Object.assign(new Error('Image loading cancelled'), { name: 'AbortError' });
  image.decoding = 'async';
  image.fetchPriority = priority <= 0 ? 'high' : 'low';
  await new Promise((resolve, reject) => {
    const abort = () => { image.removeAttribute('src'); reject(cancelled()); };
    const finish = callback => value => { signal?.removeEventListener('abort', abort); callback(value); };
    image.onload = finish(resolve);
    image.onerror = finish(() => reject(new Error('Image unavailable')));
    if (signal?.aborted) { reject(cancelled()); return; }
    signal?.addEventListener('abort', abort, { once: true });
    image.src = src;
    if (image.complete && image.naturalWidth) image.onload();
  });
  image.onload = image.onerror = null;
  if (image.decode) {
    try { await image.decode(); }
    catch (error) { if (!image.naturalWidth) throw error; }
  }
  if (signal?.aborted) throw cancelled();
  return image;
}

// Fetch/decode a few images at a time, prioritizing the active photograph.
export function createImageQueue({ concurrency = 2, load = loadDecodedImage } = {}) {
  const jobs = new Map();
  let active = 0, paused = false, scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; pump(); });
  }
  function pump() {
    if (paused) return;
    const pending = [...jobs.values()].filter(job => !job.started).sort((a, b) => a.priority - b.priority);
    for (const job of pending) {
      if (active >= concurrency) break;
      if (!job.wanted()) { jobs.delete(job.key); continue; }
      job.started = true; active++;
      Promise.resolve().then(() => load(job.src, job)).then(image => {
        if (jobs.get(job.key) === job && job.wanted()) job.ready(image);
      }).catch(error => {
        if (jobs.get(job.key) === job) job.error(error);
      }).finally(() => {
        if (jobs.get(job.key) === job) jobs.delete(job.key);
        active--; schedule();
      });
    }
  }
  return {
    request(key, src, { priority = 0, wanted = () => true, ready = () => {}, error = () => {} } = {}) {
      const current = jobs.get(key);
      if (current && current.src === src) Object.assign(current, { priority, wanted, ready, error });
      else {
        current?.controller.abort();
        jobs.set(key, { key, src, priority, wanted, ready, error, started: false, controller: new AbortController() });
      }
      schedule();
    },
    cancel(key) { const job=jobs.get(key);jobs.delete(key);job?.controller.abort(); },
    clear() { const old=[...jobs.values()];jobs.clear();for(const job of old)job.controller.abort(); },
    pause() { paused = true; },
    resume() { paused = false; schedule(); },
    stats() { return { active, queued: [...jobs.values()].filter(job => !job.started).length, paused }; }
  };
}

export function replaceDecodedImage(previous, image, { fade = true } = {}) {
  for (const attribute of [...previous.attributes]) {
    if (!['src', 'srcset', 'loading', 'fetchpriority', 'data-image-ready'].includes(attribute.name)) image.setAttribute(attribute.name, attribute.value);
  }
  image.loading = 'eager'; image.decoding = 'async'; image.draggable = false;
  const animate = fade && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  image.dataset.imageReady = animate ? 'false' : 'true';
  previous.replaceWith(image);
  if (animate) requestAnimationFrame(() => requestAnimationFrame(() => { image.dataset.imageReady = 'true'; }));
  return image;
}
