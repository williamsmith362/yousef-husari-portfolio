const clamp01 = value => Math.max(0, Math.min(1, value));

// The browser owns touch momentum. Scroll events only drive the existing reveal.
export function createNativeIntroScroll({ view, onChange, onIdle }) {
  const space = document.createElement('div');
  space.className = 'world-scroll-space';
  space.setAttribute('aria-hidden', 'true');
  view.append(space);
  view.dataset.nativeScroll = 'true';

  let range = 0, enabled = true, paused = false;
  let frame = 0, idleTimer = 0, scrolling = false, writtenTop = 0;

  function settle() {
    clearTimeout(idleTimer);
    idleTimer = 0;
    scrolling = false;
    onIdle?.();
  }

  function read() {
    frame = 0;
    if (!enabled || paused) return;
    const top = Math.max(0, Math.min(range, view.scrollTop));
    // Ignore our own keyboard/mouse synchronisation, never a native scroll delta.
    if (Math.abs(top - writtenTop) < .01) return;
    writtenTop = top;
    scrolling = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, 160);
    onChange(clamp01(top / range));
  }

  view.addEventListener('scroll', () => {
    if (enabled && !paused && !frame) frame = requestAnimationFrame(read);
  }, { passive: true });
  view.addEventListener('scrollend', settle, { passive: true });

  return {
    get scrolling() { return scrolling; },
    resize(nextRange, progress) {
      if (!enabled) return;
      const changed = range !== Math.max(1, nextRange);
      range = Math.max(1, nextRange);
      view.style.setProperty('--intro-scroll-range', range + 'px');
      if (changed) this.sync(progress);
    },
    sync(progress) {
      if (!enabled) return;
      const top = clamp01(progress) * range;
      if (Math.abs(view.scrollTop - top) < .01) return;
      view.scrollTop = top;
      // Browsers may round programmatic positions to a device pixel.
      writtenTop = view.scrollTop;
    },
    pause() {
      if (!enabled) return;
      paused = true;
      view.dataset.scrollPaused = 'true';
      cancelAnimationFrame(frame); frame = 0;
      settle();
    },
    resume(progress) {
      if (!enabled) return;
      this.sync(progress);
      paused = false;
      delete view.dataset.scrollPaused;
    },
    disable() {
      enabled = false;
      cancelAnimationFrame(frame); frame = 0;
      settle();
      delete view.dataset.nativeScroll;
      delete view.dataset.scrollPaused;
      space.remove();
      view.scrollTop = 0;
    }
  };
}
