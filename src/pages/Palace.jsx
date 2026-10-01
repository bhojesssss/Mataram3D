import { useState } from 'react';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { palaceNotes, spaces } from '@/data/palace';
import { Wrap } from '@/components/ui/Wrap';
import { Frame } from '@/components/ui/Frame';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Type';
import { PageHeader, Prose, PSection } from '@/components/ui/Page';

export default function Palace() {
  const { t } = useLanguage();

  usePageMeta(
    t({ id: 'Keraton — Mataram', en: 'Palace — Mataram' }),
    t({
      id: 'Keraton tertata pada satu sumbu tunggal dari gunung di utara hingga laut di selatan. Baca denah kompleks istananya, halaman demi halaman.',
      en: 'The keraton is laid on a single axis from the mountain in the north to the sea in the south. Read the plan of the palace compound, ground by ground.',
    }),
  );

  // Denah itu satu-satunya kontrol; kartu di sebelahnya cuma menampilkan apa
  // yang sedang dipilih. Karena kartunya diperbarui tanpa memindahkan fokus,
  // ia diberi aria-live supaya pembaca layar tetap mendengar perubahannya.
  // Belum ada yang terpilih sampai pembaca sendiri menyentuh denah; sampai
  // saat itu kartunya berisi ajakan untuk memilih.
  const [activeId, setActiveId] = useState(null);
  const active = spaces.find((space) => space.id === activeId);

  return (
    <>
      <PageHeader
        eyebrow={t({ id: 'Istana', en: 'The Palace' })}
        title={
          <>
            {t({ id: 'Membaca', en: 'Reading the' })}
            <br />
            <em>{t({ id: 'Keraton', en: 'Keraton' })}</em>
          </>
        }
        lede={t({
          id: 'Kompleks ini tertata pada satu sumbu dari gunung di utara hingga laut di selatan. Sentuh area mana pun di denah untuk mempelajari apa yang terjadi di sana.',
          en: 'The compound is laid on a single axis from the mountain in the north to the sea in the south. Touch any ground on the plan to learn what happens there.',
        })}
      />

      <PSection aria-label={t({ id: 'Denah keraton', en: 'Palace plan' })}>
        <Wrap>
          {/* items-center, bukan items-start: kartu detail lebih pendek daripada
              denah di sebelahnya, jadi dirata-tengahkan terhadap denah itu. */}
          <div className="grid grid-cols-1 items-center gap-[clamp(24px,3.2vw,58px)] min-[901px]:grid-cols-[repeat(auto-fit,minmax(290px,1fr))]">
            <PlanBoard activeId={activeId} onSelect={setActiveId} />

            <div aria-live="polite" className="overflow-hidden rounded-lg border border-forest/18 bg-paper">
              <Frame
                src="/img/pendopo-interior.png"
                alt={t({ id: 'Interior pendopo keraton.', en: 'Interior of the palace pendopo.' })}
                label={t({ id: 'Foto ruang', en: 'Space photo' })}
                rounded={false}
                className="h-[clamp(160px,17vw,240px)] border-0"
              />
              <div className="p-[clamp(22px,2.6vw,34px)]">
                <p className="mb-3.5 text-[0.64rem] tracking-[0.28em] uppercase text-gold-deep">
                  {t(active?.gloss ?? { id: 'Denah keraton', en: 'Palace plan' })}
                </p>
                <h2 className="mb-4 font-display text-[clamp(1.5rem,2.6vw,2.35rem)] font-light leading-[1.15] text-forest">
                  {active?.name ?? t({ id: 'Pilih satu ruang', en: 'Choose a ground' })}
                </h2>
                <p className="text-[0.88rem] leading-[1.9] text-ink/88 text-pretty">
                  {t(
                    active?.desc ?? {
                      id: 'Sentuh ruang mana pun di denah untuk membaca apa yang terjadi di sana.',
                      en: 'Touch any ground on the plan to read what happens there.',
                    },
                  )}
                </p>
              </div>
            </div>
          </div>
        </Wrap>
      </PSection>

      <PSection tone="paper">
        <Wrap>
          <Reveal>
            <Eyebrow>{t({ id: 'Simbol & Kehidupan Istana', en: 'Symbols & Palace Life' })}</Eyebrow>
          </Reveal>
          <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(18px,2.4vw,44px)]">
            {palaceNotes.map((note) => (
              <article key={note.title.en} className="border-t border-forest/25 pt-[22px]">
                <h2 className="mb-3 font-display text-[clamp(1.35rem,2.2vw,1.85rem)] text-forest">{t(note.title)}</h2>
                <Prose dim>{t(note.body)}</Prose>
              </article>
            ))}
          </Reveal>
        </Wrap>
      </PSection>
    </>
  );
}

/* ── denah skematik ──────────────────────────────────────────────────────── */

/**
 * Penempatan mengikuti kompleks aslinya, utara di atas: tiga alun publik
 * membentang selebar denah, gerbangnya jadi ambang selebar itu juga, dan
 * halaman dalam di bawahnya terbelah kiri, tengah, kanan.
 */
function PlanBoard({ activeId, onSelect }) {
  const { t } = useLanguage();

  return (
    <div>
      <p className="mb-4 flex items-center justify-between gap-3 text-[0.6rem] tracking-[0.3em] uppercase text-ink/72">
        <span>{t({ id: 'Denah keraton · skematik', en: 'Palace plan · schematic' })}</span>
        <span className="flex items-center gap-[7px] text-gold-deep">
          {t({ id: 'U', en: 'N' })} <span aria-hidden="true">&#8593;</span>
        </span>
      </p>

      <div className="relative rounded-lg border border-forest/18 bg-paper p-[clamp(14px,1.8vw,26px)]">
        <div
          role="group"
          aria-label={t({ id: 'Pilih ruang keraton', en: 'Select a palace ground' })}
          // Di bawah 520px skematiknya kehilangan bentuk, jadi diberi ruang vertikal tetap.
          className={cx(
            'relative grid grid-cols-3 grid-rows-[0.9fr_0.8fr_0.8fr_0.5fr_1.15fr_1.15fr_0.9fr]',
            'h-[520px] gap-1',
            'min-[521px]:h-[clamp(460px,96vw,620px)] min-[521px]:gap-1.5',
            'min-[901px]:h-[clamp(420px,46vw,620px)]',
          )}
        >
          {spaces.map((space) => (
            <button
              key={space.id}
              type="button"
              aria-pressed={space.id === activeId}
              onClick={() => onSelect(space.id)}
              className={cx(
                space.area,
                'relative grid cursor-pointer place-items-center rounded-lg border border-forest/18 p-1.5 text-center leading-[1.6] whitespace-pre-line uppercase text-forest',
                'transition-[background-color,border-color] duration-[350ms] ease-heritage hover:bg-forest/6',
                'aria-pressed:border-[1.5px] aria-pressed:border-gold aria-pressed:bg-gold/28',
                space.small
                  ?'text-[0.46rem] tracking-[0.14em] min-[521px]:text-[0.56rem]'
                  : 'text-[0.5rem] tracking-[0.08em] min-[521px]:text-[0.6rem] min-[521px]:tracking-[0.16em]',
              )}
            >
              {space.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
