"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import SiteHeader from "../components/site-header";
import ProductPhoto from "../components/product-photo";
import { pieces, type Piece } from "../lib/pieces";

const photos = pieces.flatMap((piece) => piece.images.map((image) => ({ piece, image })));
const firstPiece = pieces[0];
const gridPieces = pieces.slice(1);

function tileRatio(piece: Piece) {
  if (piece.kind === "jacket") return 1;
  if (piece.kind === "small-object") return 5 / 4;
  return 4 / 5;
}

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const initialIndex = useRef(0);
  const activeIndexRef = useRef(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const scrollFrame = useRef(0);
  const drag = useRef<{ pointerId: number; x: number; scroll: number } | null>(null);

  const nearestIndex = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 0;
    const first = rail.children[0] as HTMLElement;
    const second = rail.children[1] as HTMLElement;
    const step = second.offsetLeft - first.offsetLeft;
    return Math.max(0, Math.min(photos.length - 1, Math.round(rail.scrollLeft / step)));
  }, []);

  const goToImage = useCallback((index: number, instant = false) => {
    const rail = railRef.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(photos.length - 1, index));
    const slide = rail.children[next] as HTMLElement;
    const target = slide.offsetLeft + slide.offsetWidth / 2 - rail.clientWidth / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: target, behavior: instant || reduceMotion ? "instant" : "smooth" });
  }, []);

  const closeGallery = useCallback(() => {
    dialogRef.current?.close();
    setOpened(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    lastFocus.current?.focus({ preventScroll: true });
  }, []);

  function openPiece(piece: Piece) {
    lastFocus.current = document.activeElement as HTMLElement;
    const index = photos.findIndex((photo) => photo.piece.id === piece.id);
    initialIndex.current = index;
    activeIndexRef.current = index;
    setActiveIndex(index);
    setOpened(true);
    window.history.replaceState(null, "", `#piece-${piece.id}`);
  }

  useEffect(() => {
    const id = window.location.hash.replace("#piece-", "");
    const index = photos.findIndex((photo) => photo.piece.id === id);
    if (index >= 0) { initialIndex.current = index; activeIndexRef.current = index; setActiveIndex(index); setOpened(true); }
  }, []);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let frame = 0;
    function arrange() {
      if (!grid) return;
      for (const tile of grid.children) {
        const button = tile as HTMLElement;
        button.style.gridRowEnd = `span ${Math.ceil(button.getBoundingClientRect().height)}`;
      }
      grid.dataset.masonry = "true";
    }
    arrange();
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(arrange); });
    grid.querySelectorAll(".product-photo").forEach((photo) => observer.observe(photo));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  useLayoutEffect(() => {
    if (!opened) return;
    dialogRef.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    goToImage(initialIndex.current, true);
    const frame = requestAnimationFrame(() => goToImage(initialIndex.current, true));
    const rail = railRef.current;
    if (!rail) return;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    function onWheel(event: WheelEvent) {
      if (!rail || event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      rail.style.scrollSnapType = "none";
      const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1;
      rail.scrollBy({ left: event.deltaY * factor, behavior: "instant" });
      wheelTimer = setTimeout(() => { rail.style.scrollSnapType = ""; goToImage(nearestIndex()); }, 160);
    }
    rail.addEventListener("wheel", onWheel, { passive: false });
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => goToImage(activeIndexRef.current, true));
    });
    resize.observe(rail);
    return () => {
      document.body.style.overflow = previousOverflow;
      rail.removeEventListener("wheel", onWheel);
      clearTimeout(wheelTimer);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = 0;
      drag.current = null;
      resize.disconnect();
    };
  }, [opened, goToImage, nearestIndex]);

  useEffect(() => {
    if (!opened) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") { event.preventDefault(); goToImage(activeIndex + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); goToImage(activeIndex - 1); }
      if (event.key === "Home") { event.preventDefault(); goToImage(0); }
      if (event.key === "End") { event.preventDefault(); goToImage(photos.length - 1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, activeIndex, goToImage]);

  function onScroll() {
    if (scrollFrame.current) return;
    scrollFrame.current = requestAnimationFrame(() => {
      const index = nearestIndex();
      activeIndexRef.current = index;
      setActiveIndex(index);
      const hash = `#piece-${photos[index].piece.id}`;
      if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
      scrollFrame.current = 0;
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const rail = event.currentTarget;
    drag.current = { pointerId: event.pointerId, x: event.clientX, scroll: rail.scrollLeft };
    rail.setPointerCapture(event.pointerId);
    rail.style.scrollSnapType = "none";
    rail.style.scrollBehavior = "auto";
    rail.dataset.dragging = "true";
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    event.currentTarget.scrollLeft = drag.current.scroll - (event.clientX - drag.current.x);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    const rail = event.currentTarget;
    drag.current = null;
    rail.dataset.dragging = "false";
    rail.style.scrollSnapType = "";
    rail.style.scrollBehavior = "";
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    goToImage(nearestIndex());
  }

  const photo = photos[activeIndex];

  return <>
    <a className="skip-link" href="#work">Skip to work</a>
    <SiteHeader />
    <main id="work" className="portfolio-main photo-portfolio" aria-label="Clothing and objects by Yousef Husari">
      <button className="piece featured-piece" onClick={() => openPiece(firstPiece)} aria-label={`View ${firstPiece.name}`}>
        <ProductPhoto image={firstPiece.images[0]} eager />
      </button>
      <div className="masonry-grid" ref={gridRef} aria-label="Selected pieces">
        {gridPieces.map((piece, index) => <button className="piece masonry-tile" key={piece.id} onClick={() => openPiece(piece)} aria-label={`View ${piece.name}`}>
          <ProductPhoto image={piece.images[0]} ratio={tileRatio(piece)} eager={index < 3} />
        </button>)}
      </div>
    </main>
    <dialog ref={dialogRef} className="piece-dialog scrolling-gallery" aria-label="Clothing and objects gallery" onCancel={(event) => { event.preventDefault(); closeGallery(); }}>
      {opened && <div className="gallery-shell">
        <div className="lightbox-header"><a className="wordmark" href="/">Yousef Husari</a><button className="close-button" onClick={closeGallery} aria-label="Close gallery" autoFocus>×</button></div>
        <div className="gallery-rail" ref={railRef} role="region" aria-roledescription="carousel" aria-label="All piece photographs" tabIndex={0} onScroll={onScroll} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp}>
          {photos.map((entry, index) => <figure className="gallery-slide" key={entry.image.file} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${photos.length}`} aria-hidden={index !== activeIndex}>
            {Math.abs(index - activeIndex) <= 3
              ? <ProductPhoto image={entry.image} eager={Math.abs(index - activeIndex) <= 1} detail />
              : <span className="product-photo" aria-hidden="true" />}
          </figure>)}
        </div>
        <div className="gallery-footer">
          <button aria-label="Previous image" disabled={activeIndex === 0} onClick={() => goToImage(activeIndex - 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
          <span className="gallery-count" aria-live="polite" aria-atomic="true">{String(activeIndex + 1).padStart(2, "0")} / {photos.length}</span>
          <button aria-label="Next image" disabled={activeIndex === photos.length - 1} onClick={() => goToImage(activeIndex + 1)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button>
        </div>
        {photo.piece.description && <p className="gallery-description">{photo.piece.description}</p>}
      </div>}
    </dialog>
  </>;
}
