import { useMemo, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useArchiveRecords } from '@/hooks/useArchiveRecords';
import { categories, categoryLabels } from '@/data/archive';
import { useLanguage } from '@/i18n/LanguageContext';
import { Wrap } from '@/components/ui/Wrap';
import { Chip } from '@/components/ui/Chip';
import { Frame } from '@/components/ui/Frame';
import { ButtonOutline, Eyebrow } from '@/components/ui/Type';
import { HEAD_PADDING, PageTitle } from '@/components/ui/Page';

export default function Archive() {
  const { t, lang } = useLanguage();

  usePageMeta(
    t({ id: 'Arsip Kerajaan — Mataram', en: 'Royal Archive — Mataram' }),
    t({
      id: 'Orang, tempat, peristiwa, artefak, dan dokumen — ingatan Wangsa Mataram, tersimpan dan bisa dicari.',
      en: 'People, places, events, artifacts and documents — the memory of the House of Mataram, kept and searchable.',
    }),
  );

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const inputRef = useRef(null);
  const { status, records } = useArchiveRecords();

  /*
    Haystack pencarian menggabungkan kedua bahasa (id + en) dari tiap field,
    bukan cuma bahasa yang aktif — jadi pencarian tetap kena walau ejaannya
    beda antar bahasa (mis. "keris" vs "kris") dan tidak berubah-ubah saat
    switch bahasa dipencet sementara hasil pencarian masih terbuka.
  */
  const haystacks = useMemo(
    () =>
      new Map(
        records.map((record) => [
          record,
          [record.cat, record.era, record.title, record.sub]
            .flatMap((field) => (field && typeof field === 'object' ? [field.id, field.en] : [field]))
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
        ]),
      ),
    [records],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((record) => {
      const okCat = category === 'All' || record.cat === category;
      const okQuery = !q || haystacks.get(record).includes(q);
      return okCat && okQuery;
    });
  }, [records, haystacks, query, category]);

  const reset = () => {
    setQuery('');
    setCategory('All');
    inputRef.current?.focus();
  };

  return (
    <>
      <div className={cx(HEAD_PADDING, 'bg-paper pb-[clamp(28px,3vw,44px)] text-center')}>
        <Wrap>
          <Eyebrow>{t({ id: 'Arsip Kerajaan', en: 'Royal Archive' })}</Eyebrow>
          <PageTitle className="mb-5">
            {t({
              id: (
                <>
                  Sang <em>Koleksi</em>
                </>
              ),
              en: (
                <>
                  The <em>Collection</em>
                </>
              ),
            })}
          </PageTitle>
          <p className="mx-auto mb-[clamp(28px,3.2vw,48px)] max-w-[52ch] text-[clamp(0.86rem,1.1vw,1rem)] leading-[1.9] text-ink/72 text-pretty">
            {t({
              id: 'Orang, tempat, peristiwa, artefak, dan dokumen — ingatan sang wangsa, tersimpan dan bisa dicari.',
              en: 'People, places, events, artifacts and documents — the memory of the house, kept and searchable.',
            })}
          </p>

          {/*
            Kotak isian dan tombol Reset memakai sudut yang sama dengan seluruh
            situs. Yang membedakannya sebagai "ketik di sini" adalah latarnya
            yang cekung, bukan bentuknya.
          */}
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto flex max-w-[620px] flex-wrap items-center gap-2.5"
          >
            <div className="flex min-w-0 flex-[1_0_100%] items-center gap-3.5 rounded-lg border border-forest/32 bg-forest/5 px-[22px] py-1.5 focus-within:border-gold min-[761px]:flex-1">
              <span aria-hidden="true" className="text-base leading-none text-gold-deep">
                &#8981;
              </span>
              <label className="sr-only" htmlFor="arch-search">
                {t({ id: 'Cari di arsip', en: 'Search the archive' })}
              </label>
              <input
                ref={inputRef}
                id="arch-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t({ id: 'Cari arsip…', en: 'Search the archive…' })}
                autoComplete="off"
                // Silang biru bawaan Chrome di luar palet, dan Reset sudah melakukan tugasnya.
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.9rem] font-light text-ink outline-none placeholder:text-ink/72 [&::-webkit-search-cancel-button]:appearance-none"
              />
            </div>
            <button
              type="button"
              onClick={reset}
              className="flex-[1_0_100%] cursor-pointer rounded-lg border border-forest/32 bg-forest/12 px-5 py-3 text-center text-[0.62rem] tracking-[0.22em] whitespace-nowrap uppercase text-forest transition-colors duration-[350ms] ease-heritage hover:bg-forest/20 min-[761px]:flex-none"
            >
              {t({ id: 'Reset', en: 'Reset' })}
            </button>
          </form>
        </Wrap>
      </div>

      <div className="min-h-[60vh] bg-cream pb-[clamp(60px,7vw,110px)]">
        <Wrap>
          {/* Padding atasnya memberi jarak dari pita kertas di atasnya — tanpa itu
              deretan chip menempel persis di batas antara header dan badan halaman.
              Dipasang di baris, bukan di <ul>-nya, supaya jumlah record di kanan
              tetap sebaris dengan chip alih-alih ikut tergeser setengahnya. */}
          <div className="mb-[clamp(22px,2.6vw,38px)] flex flex-wrap items-start justify-between gap-3.5 border-b border-forest/18 pt-[clamp(22px,2.6vw,38px)] pb-5 min-[761px]:items-center">
            <ul aria-label={t({ id: 'Saring menurut kategori', en: 'Filter by category' })} className="flex list-none flex-wrap gap-[7px]">
              {categories.map((cat) => (
                <li key={cat}>
                  <Chip uppercase pressed={cat === category} onClick={() => setCategory(cat)}>
                    {t(categoryLabels[cat])}
                  </Chip>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="text-[0.66rem] tracking-[0.22em] uppercase text-ink/72">
              {status === 'loading'
                ? t({ id: 'Memuat…', en: 'Loading…' })
                : lang === 'id'
                  ? `${shown.length} catatan`
                  : `${shown.length} ${shown.length === 1 ? 'record' : 'records'}`}
            </p>
          </div>

          {status === 'loading' ? (
            <p role="status" className="py-[clamp(50px,7vw,110px)] text-center text-[0.86rem] text-ink/72">
              {t({ id: 'Membuka koleksi…', en: 'Opening the collection…' })}
            </p>
          ) : shown.length > 0 ? (
            /*
              auto-fill, bukan auto-fit: menyaring sampai tersisa satu hasil harus
              meninggalkan kartu itu selebar kolom, bukan melebar sepenuh grid.
            */
            <div className="grid grid-cols-2 gap-[clamp(12px,1.6vw,22px)] min-[521px]:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
              {shown.map((record) => (
                <RecordCard key={record.id ?? record.title?.en ?? record.title} record={record} />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-forest/25 px-5 py-[clamp(50px,7vw,110px)] text-center">
              <p className="mb-3 font-display text-[clamp(1.35rem,2.4vw,2.1rem)] italic text-forest">
                {t({ id: 'Koleksi ini sedang dikatalogkan.', en: 'The collection is being catalogued.' })}
              </p>
              <p className="text-[0.86rem] text-ink/72">
                {t({ id: 'Catatan baru akan tampil di sini segera.', en: 'New records will appear here soon.' })}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-forest/25 px-5 py-[clamp(50px,7vw,110px)] text-center">
              <p className="mb-3 font-display text-[clamp(1.35rem,2.4vw,2.1rem)] italic text-forest">
                {t({ id: 'Tidak ada yang cocok di koleksi.', en: 'Nothing in the collection matches.' })}
              </p>
              <p className="mb-6 text-[0.86rem] text-ink/72">
                {t({ id: 'Coba kata lain, atau hapus filternya.', en: 'Try another term, or clear the filters.' })}
              </p>
              <ButtonOutline onClick={reset}>{t({ id: 'Reset pencarian', en: 'Reset search' })}</ButtonOutline>
            </div>
          )}
        </Wrap>
      </div>
    </>
  );
}

function RecordCard({ record }) {
  const { t } = useLanguage();
  const catLabel = categoryLabels[record.cat] ?? record.cat;

  const card = (
    <article className="overflow-hidden rounded-lg border border-forest/18 bg-paper transition-[border-color,transform] duration-500 ease-heritage hover:-translate-y-[3px] hover:border-gold/70">
      <Frame
        src={record.image}
        label={t({ id: 'Gambar arsip', en: 'Archive image' })}
        rounded={false}
        className="h-[118px] border-0 min-[521px]:h-[clamp(140px,14vw,180px)]"
      />
      <div className="px-[18px] pt-4 pb-5">
        <p className="mb-2.5 flex justify-between gap-2.5 text-[0.56rem]">
          <span className="tracking-[0.26em] uppercase text-gold-deep">{t(catLabel)}</span>
          <span className="tracking-[0.14em] text-ink/72">{t(record.era)}</span>
        </p>
        <h2 className="mb-[7px] font-display text-base leading-[1.25] text-forest min-[521px]:text-[1.18rem]">
          {t(record.title)}
        </h2>
        <p className="text-[0.72rem] leading-[1.6] text-ink/72">{t(record.sub)}</p>
      </div>
    </article>
  );

  if (!record.href) return card;

  return (
    <a
      href={record.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg no-underline outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold"
    >
      {card}
      <span className="sr-only"> {t({ id: '(terbuka di tab baru)', en: '(opens in a new tab)' })}</span>
    </a>
  );
}
