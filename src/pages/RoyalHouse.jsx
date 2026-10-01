import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { generations } from '@/data/genealogy';
import { Wrap } from '@/components/ui/Wrap';
import { Frame } from '@/components/ui/Frame';
import { Reveal } from '@/components/ui/Reveal';
import { Dlink, Eyebrow } from '@/components/ui/Type';
import { HEAD_PADDING, PageLede, PageTitle, PSection } from '@/components/ui/Page';

/** Browser lawas tanpa <dialog>. Di sana pohonnya turun jadi kartu statis. */
const HAS_DIALOG =
  typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function';

export default function RoyalHouse() {
  const { t } = useLanguage();

  usePageMeta(
    t({ id: 'Wangsa Mataram — Mataram', en: 'Royal House — Mataram' }),
    t({
      id: 'Sembilan generasi dari hutan Mentaok hingga istana Surakarta dan Yogyakarta — silsilah Wangsa Mataram.',
      en: 'Nine generations from the forest of Mentaok to the courts of Surakarta and Yogyakarta — the genealogy of the House of Mataram.',
    }),
  );

  const [member, setMember] = useState(null);

  return (
    <>
      <Header />

      <PSection aria-label={t({ id: 'Silsilah kerajaan', en: 'Royal genealogy' })}>
        <Wrap>
          <div className="mx-auto max-w-[940px]">
            <p className="mb-[clamp(28px,3.4vw,48px)] flex items-center gap-4 after:h-px after:flex-1 after:bg-forest/20 after:content-['']">
              <span className="text-[0.64rem] tracking-[0.3em] whitespace-nowrap uppercase text-gold-deep">
                {t({ id: 'Silsilah Kerajaan', en: 'Royal Genealogy' })}
              </span>
            </p>

            {generations.map((nodes, i) => (
              <Generation
                key={nodes[0].name}
                first={i === 0}
                nodes={nodes}
                parent={parentColumn(generations[i - 1], nodes)}
                onOpen={setMember}
              />
            ))}
          </div>
        </Wrap>
      </PSection>

      <PSection tone="forest" aria-label={t({ id: 'Pesan raja', en: "The king's message" })}>
        <Wrap>
          <Reveal as="blockquote" className="mx-auto max-w-[820px] text-center">
            <Eyebrow tone="dark">{t({ id: 'Pesan Kerajaan', en: 'Royal Message' })}</Eyebrow>
            <p className="mb-7 font-display text-[clamp(1.4rem,3vw,2.75rem)] font-light italic leading-[1.45] text-paper text-pretty">
              {t({
                id: '“Mahkota bukan dikenakan untuk yang memakainya. Ia dititipkan bagi mereka yang akan mengingat bagaimana ia dijunjung.”',
                en: '“A crown is not worn for the one who wears it. It is held in trust for those who will remember how it was carried.”',
              })}
            </p>
            <footer className="flex items-center justify-center gap-3.5 text-[0.66rem] tracking-[0.26em] uppercase text-cream before:h-px before:w-9 before:bg-gold/50 before:content-[''] after:h-px after:w-9 after:bg-gold/50 after:content-['']">
              {t({ id: 'Wangsa Kerajaan Mataram', en: 'The Royal House of Mataram' })}
            </footer>
          </Reveal>
        </Wrap>
      </PSection>

      <MemberSheet member={member} onClose={() => setMember(null)} />
    </>
  );
}

/* ── kepala halaman ──────────────────────────────────────────────────────── */

function Header() {
  const { t } = useLanguage();
  const [artFailed, setArtFailed] = useState(false);

  return (
    <div className={cx(HEAD_PADDING, 'relative overflow-hidden bg-paper pb-[clamp(48px,5vw,80px)]')}>
      {/* Murni dekorasi di balik gradien — kalau filenya tidak ada, buang saja dan
          biarkan kepala halaman terbaca sebagai panel polos. */}
      {!artFailed && (
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.24]">
          <img
            src="/img/royal-couple.png"
            alt=""
            onError={() => setArtFailed(true)}
            className="h-full w-full object-cover object-[center_20%]"
          />
          <span className="absolute inset-0 bg-linear-[90deg,var(--color-paper)_22%,rgb(247_244_236/0.55)_100%]" />
        </div>
      )}

      <Wrap className="relative">
        <Eyebrow>{t({ id: 'Wangsa Kerajaan', en: 'The Royal House' })}</Eyebrow>
        <PageTitle className="mb-[22px]">
          {t({
            id: (
              <>
                Sang <em>Penguasa</em>
                <br />
                dan Trahnya
              </>
            ),
            en: (
              <>
                The <em>Sovereign</em>
                <br />
                and the Line
              </>
            ),
          })}
        </PageTitle>
        <PageLede>
          {t({
            id: 'Sembilan generasi dari hutan Mentaok hingga istana masa kini. Pilih nama mana pun untuk membaca profilnya.',
            en: 'Nine generations from the forest of Mentaok to the courts of today. Select any name to read the profile.',
          })}
        </PageLede>
      </Wrap>
    </div>
  );
}

/* ── pohon silsilah ──────────────────────────────────────────────────────── */

/**
 * Kolom generasi sebelumnya tempat garis sebuah cabang berasal.
 *
 * Cabang yang semua anggotanya dari satu keraton meneruskan garis anggota
 * generasi sebelumnya yang keratonnya sama — Pakubuwono XIII dan GKR
 * Wandansari turun dari Pakubuwono III, bukan dari celah antara Surakarta dan
 * Yogyakarta. Tanpa kecocokan seperti itu (mis. pecahan Giyanti sendiri, yang
 * induknya satu raja di tengah), hasilnya null dan garis turun dari tengah.
 */
function parentColumn(prev, nodes) {
  if (!prev || prev.length < 2 || nodes.length < 2) return null;
  const court = nodes[0].court;
  if (!court || nodes.some((node) => node.court !== court)) return null;
  const column = prev.findIndex((node) => node.court === court);
  return column === -1 ? null : column;
}

const LINE = 'absolute bg-forest/28';

/**
 * Satu generasi.
 *
 * Generasi dengan lebih dari satu node adalah cabang, dan selalu berdampingan
 * — juga di ponsel. Dulu di ponsel kartunya ditumpuk sementara palangnya tetap
 * horizontal, jadi ujung palang menggantung tanpa menyentuh apa pun dan garis
 * yang turun dari kartu bawah terbaca seolah generasi berikutnya keturunan
 * kartu itu.
 *
 * Garis cabang digambar di dalam tiap kolom, setinggi 26px di atas kartunya:
 * setengah palang ke arah saudaranya (ditarik setengah gap supaya bertemu di
 * tengah celah) dan tetesan ke kartu. Kolom yang meneruskan garis induk
 * (`parent`) tetesannya ditarik sampai ke atas, menyambung lurus ke kartu
 * induk tepat di atasnya; kalau `parent` null, tangkainya turun dari tengah.
 */
function Generation({ first, nodes, parent, onOpen }) {
  const { t } = useLanguage();
  const split = nodes.length > 1;

  return (
    <div className="flex flex-col items-center">
      {/* Penyambung vertikal turun dari generasi sebelumnya. */}
      {!first && !split && <span aria-hidden="true" className="h-[26px] w-px bg-forest/28" />}

      <div
        className={cx(
          'relative grid w-full max-w-[640px]',
          split && 'gap-x-(--gap) [--gap:clamp(12px,1.6vw,26px)]',
        )}
        style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}
      >
        {split && parent == null && <span aria-hidden="true" className={cx(LINE, 'top-0 left-1/2 h-[13px] w-px')} />}

        {nodes.map((node, i) => (
          <div key={node.name} className={cx('relative flex flex-col', split && 'pt-[26px]')}>
            {split && (
              <>
                {i > 0 && <span aria-hidden="true" className={cx(LINE, 'top-[13px] right-1/2 left-[calc(var(--gap)/-2)] h-px')} />}
                {i < nodes.length - 1 && (
                  <span aria-hidden="true" className={cx(LINE, 'top-[13px] right-[calc(var(--gap)/-2)] left-1/2 h-px')} />
                )}
                <span
                  aria-hidden="true"
                  className={cx(LINE, 'left-1/2 w-px', i === parent ? 'top-0 h-[26px]' : 'top-[13px] h-[13px]')}
                />
              </>
            )}

            <button
              type="button"
              disabled={!HAS_DIALOG}
              onClick={() => onOpen(node)}
              className={cx(
                // flex-col: isi rata atas, bukan ditengahkan seperti bawaan <button> — kalau
                // nama keraton di satu kartu cabang patah dua baris, nama raja di kedua
                // kartu tetap sebaris.
                'flex flex-1 cursor-pointer flex-col rounded-lg border border-forest/18 bg-paper px-5 py-[18px] text-center transition-[border-color,background-color] duration-[400ms] ease-heritage hover:border-gold disabled:cursor-default',
                // Dua kartu berdampingan di 425px cuma punya ±185px; padding penuh memotong judulnya.
                split && 'max-[760px]:px-2.5 max-[760px]:py-4',
              )}
            >
              <span className="mb-[7px] block font-display text-[clamp(1.1rem,1.8vw,1.55rem)] leading-[1.2] text-forest">
                {node.name}
              </span>
              <span className="block text-[0.62rem] tracking-[0.2em] uppercase text-gold-deep">{t(node.reign)}</span>
              {node.court && (
                <span className="mt-[11px] block text-[0.56rem] tracking-[0.2em] uppercase text-ink/72">
                  {node.court}
                </span>
              )}
              {/* Selalu ada untuk pembaca layar; ikut terlihat kalau <dialog> tak didukung. */}
              <span className={cx('mt-[11px] block text-[0.74rem] leading-[1.65] text-ink/72', HAS_DIALOG && 'sr-only')}>
                {t(node.role)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── lembar profil ───────────────────────────────────────────────────────── */

function MemberSheet({ member, onClose }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (member) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [member]);

  if (!HAS_DIALOG) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="member-name"
      onClose={onClose}
      // Klik pada backdrop mendarat di elemen dialog itu sendiri, tidak pernah di
      // isinya — itulah yang membuat tes klik-di-luar ini bisa diandalkan.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(760px,100%)] max-h-[90vh] overflow-y-auto rounded-lg border border-forest/32 bg-paper p-0 text-ink shadow-[0_40px_100px_rgb(27_47_33/0.32)] min-[761px]:max-h-[84vh]"
    >
      <div className="grid grid-cols-1 min-[761px]:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Frame
          src="/img/royal-portrait.png"
          label={t({ id: 'Potret', en: 'Portrait' })}
          rounded={false}
          className="min-h-[clamp(200px,24vw,340px)] border-0"
        />

        <div className="relative p-[clamp(28px,3vw,44px)]">
          <button
            type="button"
            onClick={onClose}
            aria-label={t({ id: 'Tutup profil', en: 'Close profile' })}
            className="absolute top-4 right-4 z-[2] grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-lg border border-forest/32 bg-paper/80 text-forest transition-colors duration-[350ms] ease-heritage hover:bg-forest/12"
          >
            &#10005;
          </button>

          <p className="mb-3.5 text-[0.64rem] tracking-[0.28em] uppercase text-gold-deep">{t(member?.reign)}</p>
          <h2 id="member-name" className="mb-[18px] font-display text-[clamp(1.6rem,2.8vw,2.5rem)] font-light leading-[1.15] text-forest">
            {member?.name}
          </h2>
          <p className="mb-[26px] text-[0.88rem] leading-[1.9] text-ink/88 text-pretty">{t(member?.role)}</p>
          <Dlink to="/archive">{t({ id: 'Buka di arsip', en: 'Open in archive' })}</Dlink>
        </div>
      </div>
    </dialog>
  );
}
