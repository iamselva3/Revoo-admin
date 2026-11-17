import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Minimize, Minus, Move, Plus, X } from 'lucide-react';
import { apiClient } from '../../api/client';

/** How a photo sits in the banner: zoom 1 = the photo just fills the banner; x / y = where the
 * photo's centre is, as a share of the banner's width / height from its centre; background fills
 * any empty space ('blur' = the photo itself, blurred, or a #colour). */
export interface ImageAdjust {
  zoom: number;
  x: number;
  y: number;
  background: string;
}

/** Banners are 7 : 3 in the app and on the website; the saved picture is 1400 × 600. */
export const BANNER_RATIO = 7 / 3;
const OUT_W = 1400;
const OUT_H = 600;
const MAX_ZOOM = 4;

export const DEFAULT_ADJUST: ImageAdjust = { zoom: 1, x: 0, y: 0, background: 'blur' };

/** Size of the photo as a share of the banner, for a photo of aspect `ratio` (width / height). */
const photoSize = (ratio: number, zoom: number) => {
  const r = ratio / BANNER_RATIO;
  return { w: zoom * Math.max(1, r), h: zoom * Math.max(1, 1 / r) };
};

/** Keeps the photo covering the banner when it is bigger, and inside it when it is smaller. */
const clampAdjust = (a: ImageAdjust, ratio: number, minZoom: number): ImageAdjust => {
  const zoom = Math.min(MAX_ZOOM, Math.max(minZoom, a.zoom));
  const { w, h } = photoSize(ratio, zoom);
  const mx = Math.abs(w - 1) / 2;
  const my = Math.abs(h - 1) / 2;
  return { ...a, zoom, x: Math.min(mx, Math.max(-mx, a.x)), y: Math.min(my, Math.max(-my, a.y)) };
};

/** Draws the framed banner (1400 × 600) exactly as the editor shows it. */
const renderBanner = async (img: HTMLImageElement, a: ImageAdjust): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot edit photos.');
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  if (a.background === 'blur') {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    const s = Math.max(OUT_W / iw, OUT_H / ih) * 1.2;
    const canBlur = typeof (ctx as { filter?: unknown }).filter === 'string';
    if (canBlur) ctx.filter = `blur(${Math.round(OUT_W * 0.02)}px)`;
    ctx.drawImage(img, (OUT_W - iw * s) / 2, (OUT_H - ih * s) / 2, iw * s, ih * s);
    if (canBlur) ctx.filter = 'none';
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, OUT_W, OUT_H);
    }
  } else {
    ctx.fillStyle = a.background;
    ctx.fillRect(0, 0, OUT_W, OUT_H);
  }

  const { w, h } = photoSize(iw / ih, a.zoom);
  const dw = w * OUT_W;
  const dh = h * OUT_H;
  ctx.drawImage(img, (0.5 + a.x) * OUT_W - dw / 2, (0.5 + a.y) * OUT_H - dh / 2, dw, dh);

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  const blob = (await toBlob('image/webp')) || (await toBlob('image/jpeg'));
  if (!blob) throw new Error('The adjusted photo could not be created. Please try again.');
  return blob;
};

interface Props {
  open: boolean;
  /** The original photo: a blob: URL from this session, or a stored photo address */
  source: string | null;
  initial?: ImageAdjust | null;
  /** Extra background colours to offer (the banner's own colours) */
  colors?: string[];
  onCancel: () => void;
  /** Saves the framed picture; throw to show an error and keep the window open */
  onApply: (result: { blob: Blob; adjust: ImageAdjust }) => Promise<void>;
}

export const BannerPhotoAdjuster: React.FC<Props> = ({ open, source, initial, colors = [], onCancel, onApply }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<ImageAdjust>(DEFAULT_ADJUST);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [frameW, setFrameW] = useState(600);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; sx: number; sy: number; ax: number; ay: number } | null>(null);

  const ratio = img ? img.naturalWidth / img.naturalHeight : BANNER_RATIO;
  const wholeZoom = Math.min(1, Math.min(ratio / BANNER_RATIO, BANNER_RATIO / ratio));
  const minZoom = wholeZoom * 0.6;
  const fix = useCallback((a: ImageAdjust) => clampAdjust(a, ratio, minZoom), [ratio, minZoom]);

  // Open the photo. A stored photo comes through our server (the image domain blocks direct editing)
  useEffect(() => {
    if (!open || !source) return;
    let live = true;
    let objectUrl: string | null = null;
    setImg(null);
    setImgUrl(null);
    setLoadError(null);
    setApplyError(null);
    setBusy(false);
    (async () => {
      try {
        let url = source;
        if (!/^(blob|data):/.test(source)) {
          const res = await apiClient.get('/catalogue/admin/media/source', { params: { url: source }, responseType: 'blob' });
          objectUrl = URL.createObjectURL(res.data as Blob);
          url = objectUrl;
        }
        const el = new Image();
        await new Promise<void>((resolve, reject) => {
          el.onload = () => resolve();
          el.onerror = () => reject(new Error('unreadable'));
          el.src = url;
        });
        if (!live) return;
        const r = el.naturalWidth / el.naturalHeight;
        const whole = Math.min(1, Math.min(r / BANNER_RATIO, BANNER_RATIO / r));
        setImg(el);
        setImgUrl(url);
        setAdjust(clampAdjust({ ...DEFAULT_ADJUST, ...(initial || {}) }, r, whole * 0.6));
      } catch {
        if (live) setLoadError("This photo can't be opened for adjusting right now. Upload the photo again, then adjust it.");
      }
    })();
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, source]); // eslint-disable-line react-hooks/exhaustive-deps

  // Frame width, for the blur size and for turning drag pixels into shares of the banner
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setFrameW(el.clientWidth || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  // Zoom keeping the banner's centre point still
  const zoomTo = useCallback(
    (next: number) =>
      setAdjust((a) => {
        const z = Math.min(MAX_ZOOM, Math.max(minZoom, next));
        return fix({ ...a, zoom: z, x: a.x * (z / a.zoom), y: a.y * (z / a.zoom) });
      }),
    [fix, minZoom]
  );

  // Mouse wheel / trackpad zoom (a passive listener could not stop the page from scrolling)
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setAdjust((a) => {
        const z = Math.min(MAX_ZOOM, Math.max(minZoom, a.zoom * Math.exp(-e.deltaY * 0.0015)));
        return fix({ ...a, zoom: z, x: a.x * (z / a.zoom), y: a.y * (z / a.zoom) });
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [img, fix, minZoom]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const frameH = frameW / BANNER_RATIO;
  const size = photoSize(ratio, adjust.zoom);
  const leavesSpace = size.w < 0.999 || size.h < 0.999;
  const swatches = Array.from(new Set(['#ffffff', '#000000', ...colors.filter((c) => /^#[0-9a-f]{3,8}$/i.test(c))].map((c) => c.toLowerCase())));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ax: adjust.x, ay: adjust.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setAdjust((a) => fix({ ...a, x: d.ax + (e.clientX - d.sx) / frameW, y: d.ay + (e.clientY - d.sy) / frameH }));
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onFrameKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      setAdjust((a) => fix({ ...a, x: a.x + moves[e.key][0], y: a.y + moves[e.key][1] }));
    } else if (e.key === '+' || e.key === '=') zoomTo(adjust.zoom * 1.1);
    else if (e.key === '-') zoomTo(adjust.zoom / 1.1);
  };

  const apply = async () => {
    if (!img) return;
    setBusy(true);
    setApplyError(null);
    try {
      const blob = await renderBanner(img, adjust);
      await onApply({ blob, adjust });
    } catch (err: any) {
      setApplyError(err?.message || 'The adjusted photo could not be saved. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="adjust-title" className="my-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="adjust-title" className="text-base font-bold text-slate-900">Adjust banner photo</h2>
            <p className="text-xs text-slate-500">The frame is exactly what the app and the website show.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* The banner frame */}
          <div
            ref={frameRef}
            tabIndex={0}
            role="application"
            aria-label="Banner frame. Drag or use the arrow keys to move the photo; + and - to zoom."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onFrameKey}
            className={`relative aspect-[7/3] w-full touch-none select-none overflow-hidden rounded-xl bg-slate-900 outline-none ring-emerald-400 focus-visible:ring-4 ${
              img ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {!img && !loadError && (
              <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Opening photo…
              </span>
            )}
            {loadError && <span className="absolute inset-0 flex items-center justify-center p-6 text-center text-xs font-semibold text-red-200">{loadError}</span>}
            {img && imgUrl && (
              <>
                {adjust.background === 'blur' ? (
                  <img src={imgUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-[1.2] object-cover" style={{ filter: `blur(${Math.round(frameW * 0.02)}px)` }} draggable={false} />
                ) : (
                  <span className="absolute inset-0" style={{ background: adjust.background }} />
                )}
                <img
                  src={imgUrl}
                  alt="Banner photo"
                  draggable={false}
                  className="absolute max-w-none"
                  style={{
                    width: `${size.w * 100}%`,
                    height: `${size.h * 100}%`,
                    left: `${(0.5 + adjust.x - size.w / 2) * 100}%`,
                    top: `${(0.5 + adjust.y - size.h / 2) * 100}%`,
                  }}
                />
                <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Move className="h-3 w-3" /> Drag to move
                </span>
              </>
            )}
          </div>

          {/* Zoom */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[240px] flex-1 items-center gap-2">
              <button type="button" onClick={() => zoomTo(adjust.zoom / 1.1)} disabled={!img} aria-label="Zoom out" className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="range"
                aria-label="Zoom"
                min={minZoom}
                max={MAX_ZOOM}
                step="any"
                value={adjust.zoom}
                disabled={!img}
                onChange={(e) => zoomTo(Number(e.target.value))}
                className="flex-1 accent-emerald-600"
              />
              <button type="button" onClick={() => zoomTo(adjust.zoom * 1.1)} disabled={!img} aria-label="Zoom in" className="rounded-lg border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
              <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-600">{Math.round(adjust.zoom * 100)}%</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAdjust((a) => fix({ ...a, zoom: 1, x: 0, y: 0 }))} disabled={!img} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                <Maximize className="h-3.5 w-3.5" /> Fill banner
              </button>
              <button type="button" onClick={() => setAdjust((a) => fix({ ...a, zoom: wholeZoom, x: 0, y: 0 }))} disabled={!img} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                <Minimize className="h-3.5 w-3.5" /> Show whole photo
              </button>
            </div>
          </div>

          {/* Background for empty space (only matters when zoomed out) */}
          <div className={`flex flex-wrap items-center gap-2 ${leavesSpace ? '' : 'opacity-60'}`}>
            <span className="text-xs font-semibold text-slate-700">Empty space:</span>
            <button
              type="button"
              aria-pressed={adjust.background === 'blur'}
              onClick={() => setAdjust((a) => ({ ...a, background: 'blur' }))}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${adjust.background === 'blur' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
            >
              Blurred photo
            </button>
            {swatches.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Colour ${c}`}
                aria-pressed={adjust.background.toLowerCase() === c}
                onClick={() => setAdjust((a) => ({ ...a, background: c }))}
                className={`h-7 w-7 rounded-full border-2 ${adjust.background.toLowerCase() === c ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-300'}`}
                style={{ background: c }}
              />
            ))}
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
              Other
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(adjust.background) ? adjust.background : '#ffffff'}
                onChange={(e) => setAdjust((a) => ({ ...a, background: e.target.value }))}
                className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
            {!leavesSpace && <span className="text-[11px] text-slate-400">Zoom out to see it</span>}
          </div>

          <p className="text-[11px] text-slate-500">
            Drag the photo to move it. Zoom with the slider, the + / − buttons or your mouse wheel. Keep important text away from the
            edges.
          </p>

          {applyError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{applyError}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!img || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {busy ? 'Saving photo…' : 'Use this framing'}
          </button>
        </div>
      </div>
    </div>
  );
};
