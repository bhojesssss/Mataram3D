import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Wrap } from '@/components/ui/Wrap';
import { Chip } from '@/components/ui/Chip';
import { api } from '../api';
import { useI18n } from '../i18n';
import { ChevronLeftIcon } from '../icons';
import { CATEGORIES, EMPTY_RECORD, LIMITS, toFormValues, toPayload, validateRecord } from '../records';
import { useApiError } from '../session';
import { useToast } from '../toast';
import { ImageField } from '../components/ImageField';
import { RecordPreview } from '../components/RecordPreview';
import { Field, FieldMessage, FOCUS, INPUT, LABEL, Notice, PrimaryButton, SECONDARY, Switch, describedBy } from '../ui';

/** Urutan field di layar, dipakai untuk memfokuskan kesalahan pertama. */
const FOCUS_TARGETS = [
  ['imageUrl', '#record-image'],
  ['title', '#record-title'],
  ['description', '#record-description'],
  ['category', '#record-category button'],
  ['era', '#record-era'],
  ['externalUrl', '#record-externalUrl'],
];

/** Status HTTP upload yang punya penjelasan lebih berguna daripada pesan mentah backend. */
const UPLOAD_ERRORS = {
  413: 'image.error413',
  415: 'image.errorType',
  500: 'image.error500',
};

/** Dipasang ulang per id, supaya pindah dari satu arsip ke arsip lain tidak membawa isi form lama. */
export default function RecordFormRoute() {
  const { id } = useParams();
  return <RecordFormPage key={id ?? 'new'} id={id} />;
}

/*
  Tata letak:
  - Tombol kembali di pojok kiri atas (ikon ‹ + teks, seperti aplikasi pada umumnya),
    lalu judul halaman biasa.
  - Kolom utama: satu kartu berisi bagian-bagian isian. Label bagian di kiri, isian di kanan;
    gambar sampul paling atas, mengikuti susunan kartu di situs.
  - Kolom samping (desktop): panel Publikasi yang menempel saat digulir, berisi saklar
    terbit dan tombol Simpan, lalu pratinjau kartu.
  - Layar < 1000px: panel samping turun ke bawah form, dan tombol Simpan pindah ke bar
    yang menempel di bawah layar (mudah dijangkau jempol).

  Gambar baru hanya diunggah saat Simpan ditekan (lihat onSubmit), jadi storage tidak
  menampung gambar dari form yang dibatalkan.
*/
function RecordFormPage({ id }) {
  const isEdit = id !== undefined;
  const { t } = useI18n();
  usePageMeta(t(isEdit ? 'form.metaEdit' : 'form.metaNew'));
  const navigate = useNavigate();
  const toMessage = useApiError();
  const toast = useToast();

  const [values, setValues] = useState(isEdit ? null : EMPTY_RECORD);
  const [initial, setInitial] = useState(isEdit ? null : EMPTY_RECORD);
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'ready');
  const [loadError, setLoadError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // null | 'uploading' | 'saving'
  const [phase, setPhase] = useState(null);
  // Hasil potongan yang belum diunggah: { blob, previewUrl }.
  const [pendingImage, setPendingImage] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    // Backend tidak punya GET per id. Daftar arsip admin kecil, jadi ambil semua lalu cari.
    api.listRecords().then(
      (list) => {
        if (!active) return;
        const record = list.find((item) => item.id === id);
        if (!record) return setLoadState('missing');
        const formValues = toFormValues(record);
        setValues(formValues);
        setInitial(formValues);
        setLoadState('ready');
      },
      (err) => {
        if (!active) return;
        const message = toMessage(err);
        if (message) {
          setLoadError(message);
          setLoadState('error');
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  // blob: URL pratinjau dilepas saat diganti atau saat meninggalkan halaman.
  useEffect(() => {
    if (!pendingImage) return;
    return () => URL.revokeObjectURL(pendingImage.previewUrl);
  }, [pendingImage]);

  const saving = phase !== null;
  const dirty = values !== null && (pendingImage !== null || JSON.stringify(values) !== JSON.stringify(initial));

  // Menutup tab atau memuat ulang dengan isian yang belum disimpan.
  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const confirmLeave = (event) => {
    if (dirty && !window.confirm(t('form.leaveWarning'))) event.preventDefault();
  };

  const backButton = (
    <Link
      to="/admin"
      onClick={confirmLeave}
      aria-label={t('form.backLabel')}
      className={cx(
        '-ml-2 inline-flex items-center gap-1 rounded-lg py-1.5 pr-3.5 pl-1.5 text-[0.9rem] font-medium text-forest no-underline',
        'transition-colors duration-[350ms] ease-heritage hover:bg-forest/8',
        FOCUS,
      )}
    >
      <ChevronLeftIcon />
      {t('form.back')}
    </Link>
  );

  if (loadState !== 'ready') {
    return (
      <Wrap className="pt-[clamp(18px,3vw,32px)]">
        {backButton}
        <div className="py-16 text-center">
          {loadState === 'loading' && (
            <p role="status" className="text-[0.86rem] text-ink/72">
              {t('form.loading')}
            </p>
          )}
          {loadState === 'missing' && <p className="text-[0.92rem] text-ink/88">{t('form.missing')}</p>}
          {loadState === 'error' && (
            <Notice tone="error" className="mx-auto max-w-lg">
              {loadError}
            </Notice>
          )}
        </div>
      </Wrap>
    );
  }

  // Yang ditampilkan dan divalidasi: gambar yang belum diunggah pun dihitung sebagai "ada gambar".
  const shown = pendingImage ? { ...values, imageUrl: pendingImage.previewUrl } : values;
  // Setelah percobaan simpan pertama, kesalahan diperbarui sambil admin mengetik (dan saat bahasa diganti).
  const errors = submitted ? validateRecord(shown, t) : {};
  const errorCount = Object.keys(errors).length;
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const text = (key) => (event) => set(key)(event.target.value);
  const heading = isEdit ? initial.title || t('form.headingEdit') : t('form.headingNew');
  const saveLabel =
    phase === 'uploading'
      ? t('form.uploadingImage')
      : phase === 'saving'
        ? t('common.saving')
        : t(isEdit ? 'form.saveEdit' : 'form.saveNew');

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setSubmitError(null);

    const found = validateRecord(shown, t);
    const first = FOCUS_TARGETS.find(([key]) => found[key]);
    if (first) {
      document.querySelector(first[1])?.focus();
      return;
    }

    let uploaded = null;
    try {
      let imageUrl = values.imageUrl;
      if (pendingImage) {
        setPhase('uploading');
        const { blob } = pendingImage;
        const file = new File([blob], blob.type === 'image/webp' ? 'cover.webp' : 'cover.jpg', { type: blob.type });
        uploaded = await api.uploadImage(file);
        imageUrl = uploaded.url;
      }

      setPhase('saving');
      const payload = { ...toPayload(values), imageUrl };
      const saved = isEdit ? await api.updateRecord(id, payload) : await api.createRecord(payload);
      toast(
        isEdit
          ? t('form.toastUpdated', { title: saved.title })
          : t('form.toastCreated', { title: saved.title, draft: !saved.isPublished }),
      );
      navigate('/admin');
    } catch (err) {
      // Gambar sudah masuk storage tapi arsipnya gagal disimpan: jangan tinggalkan file tanpa pemilik.
      // Backend menolak menghapusnya kalau ternyata arsipnya tersimpan (mis. respons hilang di jalan).
      if (uploaded) api.deleteUpload(uploaded.path).catch(() => {});

      const uploadFailed = pendingImage !== null && uploaded === null;
      const message =
        uploadFailed && UPLOAD_ERRORS[err.status]
          ? t(UPLOAD_ERRORS[err.status])
          : err.status === 404
            ? t('form.deletedElsewhere')
            : toMessage(err);
      if (message) setSubmitError(message);
      setPhase(null);
    }
  }

  return (
    <Wrap className="pt-[clamp(18px,3vw,32px)] max-[999px]:pb-24">
      {backButton}

      <header className="mt-5 mb-7 max-w-[62ch]">
        <p className="mb-2 text-[0.64rem] font-medium tracking-[0.3em] uppercase text-gold-deep">
          {t(isEdit ? 'form.eyebrowEdit' : 'form.eyebrowNew')}
        </p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.05] break-words text-forest">
          {heading}
        </h1>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/72">{t(isEdit ? 'form.ledeEdit' : 'form.ledeNew')}</p>
      </header>

      {(submitError || errorCount > 0) && (
        <Notice tone="error" className="mb-6">
          {submitError ?? t('form.errorSummary', { n: errorCount })}
        </Notice>
      )}

      <form
        id="record-form"
        noValidate
        onSubmit={onSubmit}
        className="grid items-start gap-6 min-[1000px]:grid-cols-[minmax(0,1fr)_340px] min-[1000px]:gap-8"
      >
        <div className="divide-y divide-forest/10 rounded-lg border border-forest/15 bg-paper">
          <FormSection title={t('form.sections.image.title')} description={t('form.sections.image.description')}>
            <ImageField
              id="record-image"
              previewUrl={shown.imageUrl}
              pending={pendingImage !== null}
              onPick={(blob) => setPendingImage({ blob, previewUrl: URL.createObjectURL(blob) })}
              error={errors.imageUrl}
            />
          </FormSection>

          <FormSection title={t('form.sections.content.title')} description={t('form.sections.content.description')}>
            <Field
              id="record-title"
              label={t('form.fields.title')}
              error={errors.title}
              count={values.title.trim().length}
              max={LIMITS.title}
            >
              <input
                id="record-title"
                value={values.title}
                onChange={text('title')}
                placeholder={t('form.fields.titlePlaceholder')}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={describedBy('record-title', errors.title)}
                className={INPUT}
              />
            </Field>

            <Field
              id="record-description"
              label={t('form.fields.description')}
              hint={t('form.fields.descriptionHint')}
              error={errors.description}
              count={values.description.trim().length}
              max={LIMITS.description}
            >
              <textarea
                id="record-description"
                rows={3}
                value={values.description}
                onChange={text('description')}
                placeholder={t('form.fields.descriptionPlaceholder')}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={describedBy('record-description', errors.description, true)}
                className={cx(INPUT, 'resize-y')}
              />
            </Field>
          </FormSection>

          <FormSection
            title={t('form.sections.classification.title')}
            description={t('form.sections.classification.description')}
          >
            <fieldset id="record-category" aria-describedby={describedBy('record-category', errors.category)}>
              <legend className={cx(LABEL, 'mb-2')}>{t('form.fields.category')}</legend>
              <div className="flex flex-wrap gap-[7px]">
                {CATEGORIES.map((category) => (
                  <Chip key={category} uppercase pressed={values.category === category} onClick={() => set('category')(category)}>
                    {category}
                  </Chip>
                ))}
              </div>
              <FieldMessage id="record-category" error={errors.category} />
            </fieldset>

            <div className="max-w-[320px]">
              <Field
                id="record-era"
                label={t('form.fields.era')}
                hint={t('form.fields.eraHint')}
                error={errors.era}
                count={values.era.trim().length}
                max={LIMITS.era}
              >
                <input
                  id="record-era"
                  value={values.era}
                  onChange={text('era')}
                  placeholder={t('form.fields.eraPlaceholder')}
                  aria-invalid={Boolean(errors.era)}
                  aria-describedby={describedBy('record-era', errors.era, true)}
                  className={INPUT}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t('form.sections.link.title')} description={t('form.sections.link.description')}>
            <Field
              id="record-externalUrl"
              label={t('form.fields.url')}
              hint={t('form.fields.urlHint')}
              error={errors.externalUrl}
            >
              <input
                id="record-externalUrl"
                type="url"
                inputMode="url"
                value={values.externalUrl}
                onChange={text('externalUrl')}
                placeholder="https://"
                aria-invalid={Boolean(errors.externalUrl)}
                aria-describedby={describedBy('record-externalUrl', errors.externalUrl, true)}
                className={INPUT}
              />
            </Field>
          </FormSection>
        </div>

        <aside className="space-y-6 min-[1000px]:sticky min-[1000px]:top-24">
          <section className="rounded-lg border border-forest/15 bg-paper p-5">
            <h2 className="font-display text-[1.3rem] leading-tight text-forest">{t('form.sections.publishing.title')}</h2>

            <div className="mt-4 flex items-start justify-between gap-4 rounded-lg bg-cream/70 p-3.5">
              <div className="min-w-0">
                <p id="publish-label" className={LABEL}>
                  {t('form.fields.publish')}
                </p>
                <p id="publish-hint" className="mt-0.5 text-[0.78rem] leading-relaxed text-ink/72">
                  {t(values.isPublished ? 'form.fields.publishOn' : 'form.fields.publishOff')}
                </p>
              </div>
              <Switch
                id="record-isPublished"
                checked={values.isPublished}
                onChange={set('isPublished')}
                labelledBy="publish-label"
                describedBy="publish-hint"
              />
            </div>

            {/* Tombol simpan desktop. Di layar sempit disembunyikan; bar bawah yang dipakai. */}
            <div className="mt-5 space-y-2.5 max-[999px]:hidden">
              <SaveStatus dirty={dirty} saving={saving} t={t} />
              <PrimaryButton type="submit" disabled={saving} className="w-full">
                {saveLabel}
              </PrimaryButton>
              <Link to="/admin" onClick={confirmLeave} className={cx(SECONDARY, 'w-full')}>
                {t('common.cancel')}
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-forest/15 bg-paper p-5">
            <h2 className="font-display text-[1.3rem] leading-tight text-forest">{t('form.sections.preview.title')}</h2>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-ink/72">{t('form.sections.preview.description')}</p>
            <div className="mt-4 rounded-lg bg-cream p-4">
              <RecordPreview values={shown} />
            </div>
          </section>
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-forest/15 bg-paper min-[1000px]:hidden">
        <Wrap className="py-3">
          <SaveStatus dirty={dirty} saving={saving} t={t} compact />
          <div className="flex gap-3">
            <Link to="/admin" onClick={confirmLeave} className={cx(SECONDARY, 'flex-1')}>
              {t('common.cancel')}
            </Link>
            <PrimaryButton type="submit" form="record-form" disabled={saving} className="flex-[2]">
              {saveLabel}
            </PrimaryButton>
          </div>
        </Wrap>
      </div>
    </Wrap>
  );
}

/** Satu bagian form: label bagian di kiri (desktop), isian di kanan. Bertumpuk di layar sempit. */
function FormSection({ title, description, children }) {
  return (
    <section className="grid gap-5 p-[clamp(18px,2.6vw,28px)] min-[760px]:grid-cols-[170px_minmax(0,1fr)] min-[760px]:gap-8">
      <header>
        <h2 className="font-display text-[1.25rem] leading-tight text-forest">{title}</h2>
        {description && <p className="mt-1 text-[0.78rem] leading-relaxed text-ink/72">{description}</p>}
      </header>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

/** Keterangan di atas tombol simpan, teks saja. Tingginya tetap, jadi tombol tidak melompat. */
function SaveStatus({ dirty, saving, t, compact = false }) {
  const content = dirty && !saving ? t('form.unsaved') : null;
  return (
    <p
      aria-live="polite"
      className={cx('min-h-[18px] text-[0.78rem] text-gold-deep', compact && (content ? 'mb-2' : 'hidden'))}
    >
      {content}
    </p>
  );
}
