import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { useI18n } from '../i18n';
import { FOCUS, PrimaryButton, SECONDARY, SMALL_GHOST } from '../ui';

/** Rasio bidang gambar kartu. Pratinjau, kartu dasbor, dan hasil potongan memakai rasio yang sama. */
export const CARD_RATIO = 16 / 10;
/** Lebar hasil. Tetap tajam di kartu terlebar pada layar 2×, dan jauh di bawah batas 2 MB server. */
const OUTPUT_WIDTH = 1600;
/** Hasil tidak boleh lebih sempit dari ini supaya tidak buram. Sekaligus menentukan zoom maksimum. */
export const MIN_OUTPUT_WIDTH = 800;
const MAX_ZOOM = 3;
const QUALITY = 0.85;
const KEY_STEP = 12;

const toBlob = (canvas, type) => new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

/**
 * Jendela untuk memilih bagian foto yang tampil di kartu, sebelum diunggah.
 *
 * Foto dengan rasio apa pun ditaruh di bingkai 16:10 dan bisa digeser/diperbesar.
 * Hasilnya digambar ulang ke canvas (maks. 1600×1000) lalu dikodekan ke WebP, jadi
 * yang tersimpan di storage selalu pas dengan kartu dan kecil ukurannya, apa pun
 * ukuran foto aslinya. Situs tidak perlu memotong lagi secara acak.
 */
export function CropDialog({ image, onCancel, onConfirm }) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const frameHeight = frameWidth / CARD_RATIO;
  // Skala "cover": gambar menutup bingkai penuh tanpa sisi kosong.
  const base = frameWidth ? Math.max(frameWidth / iw, frameHeight / ih) : 0;
  const scale = base * zoom;
  // Zoom dibatasi supaya potongan tidak lebih sempit dari MIN_OUTPUT_WIDTH piksel foto asli.
  const maxZoom = Math.max(1, Math.min(MAX_ZOOM, Math.min(iw, ih * CARD_RATIO) / MIN_OUTPUT_WIDTH));

  const clamp = (x, y, s) => ({
    x: Math.min(0, Math.max(frameWidth - iw * s, x)),
    y: Math.min(0, Math.max(frameHeight - ih * s, y)),
  });
  const centered = (s) => ({ x: (frameWidth - iw * s) / 2, y: (frameHeight - ih * s) / 2 });

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setFrameWidth(frame.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Bingkai baru terukur (saat dibuka, atau layar diputar): mulai lagi dari tengah.
  useEffect(() => {
    if (!frameWidth) return;
    setZoom(1);
    setOffset(centered(base));
  }, [frameWidth]);

  function applyZoom(next) {
    const nextZoom = Math.min(maxZoom, Math.max(1, next));
    const nextScale = base * nextZoom;
    // Titik di tengah bingkai tetap di tengah saat diperbesar atau diperkecil.
    const cx = (frameWidth / 2 - offset.x) / scale;
    const cy = (frameHeight / 2 - offset.y) / scale;
    setZoom(nextZoom);
    setOffset(clamp(frameWidth / 2 - cx * nextScale, frameHeight / 2 - cy * nextScale, nextScale));
  }

  function reset() {
    setZoom(1);
    setOffset(centered(base));
  }

  function onKeyDown(event) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      applyZoom(zoom + 0.1);
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      applyZoom(zoom - 0.1);
      return;
    }
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setOffset((current) => clamp(current.x + move[0], current.y + move[1], scale));
  }

  const pointer = {
    onPointerDown: (event) => {
      // Capture supaya geseran tetap terbaca walau kursor keluar bingkai. Bisa gagal kalau
      // pointer sudah tidak aktif; itu bukan alasan membatalkan geseran.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
      dragRef.current = { x: event.clientX, y: event.clientY, origin: offset };
    },
    onPointerMove: (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      setOffset(clamp(drag.origin.x + event.clientX - drag.x, drag.origin.y + event.clientY - drag.y, scale));
    },
    onPointerUp: () => {
      dragRef.current = null;
    },
    onPointerCancel: () => {
      dragRef.current = null;
    },
  };

  async function confirm() {
    setBusy(true);
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = frameWidth / scale;
    const sh = frameHeight / scale;
    const width = Math.min(OUTPUT_WIDTH, Math.round(sw));
    const height = Math.round(width / CARD_RATIO);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    // Latar kertas untuk PNG transparan, supaya tidak berubah hitam kalau dikodekan ke JPEG.
    context.fillStyle = '#f7f4ec';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

    let blob = await toBlob(canvas, 'image/webp');
    // Browser yang belum bisa menulis WebP diam-diam menghasilkan PNG besar; pakai JPEG saja.
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg');
    onConfirm(blob);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="crop-title"
      aria-describedby="crop-help"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[min(640px,calc(100vw-24px))] max-w-none rounded-lg border border-forest/15 bg-paper p-0 text-ink"
    >
      <div className="p-[clamp(18px,3vw,26px)]">
        <h2 id="crop-title" className="font-display text-[1.6rem] leading-tight text-forest">
          {t('crop.title')}
        </h2>
        <p id="crop-help" className="mt-1.5 text-[0.84rem] leading-relaxed text-ink/72">
          {t('crop.help')}
        </p>

        <div
          ref={frameRef}
          tabIndex={0}
          role="group"
          aria-label={t('crop.frameLabel')}
          onKeyDown={onKeyDown}
          onWheel={(event) => applyZoom(zoom - Math.sign(event.deltaY) * 0.1)}
          {...pointer}
          className={cx(
            'relative mt-5 aspect-[16/10] w-full cursor-grab touch-none overflow-hidden rounded-lg bg-forest/10 select-none active:cursor-grabbing',
            FOCUS,
          )}
        >
          {frameWidth > 0 && (
            <img
              src={image.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-0 left-0 max-w-none"
              style={{ width: iw * scale, height: ih * scale, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            />
          )}
        </div>
        <p className="mt-2 text-[0.74rem] text-ink/60">{t('crop.source', { w: iw, h: ih })}</p>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="crop-zoom" className="text-[0.84rem] font-medium text-forest">
            {t('crop.zoom')}
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={maxZoom}
            step={0.01}
            value={zoom}
            disabled={maxZoom === 1}
            onChange={(event) => applyZoom(Number(event.target.value))}
            className="min-w-0 flex-1 cursor-pointer accent-forest disabled:cursor-not-allowed"
          />
          <button type="button" onClick={reset} className={SMALL_GHOST}>
            {t('crop.reset')}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className={SECONDARY}>
            {t('common.cancel')}
          </button>
          <PrimaryButton onClick={confirm} disabled={busy || !frameWidth}>
            {busy ? t('crop.processing') : t('crop.confirm')}
          </PrimaryButton>
        </div>
      </div>
    </dialog>
  );
}
