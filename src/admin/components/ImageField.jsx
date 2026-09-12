import { useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { Frame } from '@/components/ui/Frame';
import { useI18n } from '../i18n';
import { UploadIcon } from '../icons';
import { ERROR_TEXT, FOCUS, SECONDARY, describedBy } from '../ui';
import { CARD_RATIO, CropDialog, MIN_OUTPUT_WIDTH } from './CropDialog';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
/** Batas foto yang dipilih. Yang diunggah adalah hasil potongan, jauh lebih kecil (batas server 2 MB). */
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Lebar maksimum bidang gambar: cukup untuk menilai foto, tanpa mendominasi form. */
const MEDIA = 'w-full max-w-[400px]';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    image.src = url;
  });
}

/**
 * Pemilih gambar sampul: pilih foto → atur bagian yang tampil (CropDialog) → hasil
 * potongan diserahkan ke form lewat `onPick(blob)`.
 *
 * Komponen ini sengaja tidak mengunggah apa pun. Form yang mengunggah saat admin menekan
 * Simpan, supaya storage hanya berisi gambar yang benar-benar dipakai arsip: memilih
 * gambar lalu membatalkan, atau mengganti gambar sebelum menyimpan, tidak meninggalkan file.
 *
 * @param previewUrl  URL gambar tersimpan, atau blob: URL hasil potongan yang belum diunggah
 * @param pending     true kalau previewUrl belum diunggah
 */
export function ImageField({ id, previewUrl, pending, onPick, error }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [crop, setCrop] = useState(null);
  // Kunci terjemahan, supaya pesan ikut berganti bahasa.
  const [pickError, setPickError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const shownError = (pickError && t(pickError)) || error;
  const hint = t('image.hint');
  const pick = () => inputRef.current?.click();

  async function choose(file) {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setPickError(null);

    if (!ACCEPTED.includes(file.type)) return setPickError('image.errorType');
    if (file.size > MAX_SOURCE_BYTES) return setPickError('image.errorSourceSize');

    let loaded;
    try {
      loaded = await loadImage(file);
    } catch {
      return setPickError('image.errorRead');
    }
    // Sisi foto yang masuk bingkai 16:10 harus ≥ 800px, supaya kartu tidak buram.
    const { naturalWidth: w, naturalHeight: h } = loaded.image;
    if (Math.min(w, h * CARD_RATIO) < MIN_OUTPUT_WIDTH) {
      URL.revokeObjectURL(loaded.url);
      return setPickError('image.errorTooSmall');
    }
    setCrop(loaded);
  }

  function closeCrop() {
    if (crop) URL.revokeObjectURL(crop.url);
    setCrop(null);
  }

  function useCropped(blob) {
    closeCrop();
    if (!blob) return setPickError('image.errorRead');
    if (blob.size > MAX_UPLOAD_BYTES) return setPickError('image.errorSize');
    onPick(blob);
  }

  const dropHandlers = {
    onDragOver: (event) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event) => {
      event.preventDefault();
      setDragging(false);
      choose(event.dataTransfer.files?.[0]);
    },
  };

  return (
    <div {...dropHandlers}>
      {previewUrl ? (
        <div className="space-y-3">
          <Frame
            key={previewUrl}
            src={previewUrl}
            label="Archive image"
            className={cx(MEDIA, 'aspect-[16/10] transition-opacity', dragging && 'opacity-60')}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              id={id}
              type="button"
              onClick={pick}
              aria-describedby={describedBy(id, shownError, hint)}
              className={SECONDARY}
            >
              {t('image.replace')}
            </button>
            <span className="text-[0.76rem] text-ink/72">{dragging ? t('image.dropToReplace') : t('image.orDropReplace')}</span>
          </div>
          {pending && <p className="text-[0.78rem] text-gold-deep">{t('image.pendingNote')}</p>}
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={pick}
          aria-describedby={describedBy(id, shownError, hint)}
          className={cx(
            MEDIA,
            'flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center',
            'transition-[background-color,border-color] duration-[350ms] ease-heritage',
            dragging
              ? 'border-gold bg-gold/12'
              : shownError
                ? 'border-[#9b3b2f]/60 bg-[#9b3b2f]/4'
                : 'hatch border-forest/30 bg-forest/4 hover:border-gold hover:bg-gold/8',
            FOCUS,
          )}
        >
          <span className="text-gold-deep">
            <UploadIcon />
          </span>
          <span className="text-[0.9rem] font-medium text-forest">{dragging ? t('image.dropToUpload') : t('image.choose')}</span>
          {!dragging && <span className="text-[0.76rem] text-ink/72">{t('image.orDrop')}</span>}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0])}
      />

      {shownError ? (
        <p id={`${id}-error`} role={pickError ? 'alert' : undefined} className={cx('mt-2 text-[0.78rem]', ERROR_TEXT)}>
          {shownError}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-2 max-w-[52ch] text-[0.76rem] leading-relaxed text-ink/72">
          {hint}
        </p>
      )}

      {crop && <CropDialog image={crop.image} onCancel={closeCrop} onConfirm={useCropped} />}
    </div>
  );
}
