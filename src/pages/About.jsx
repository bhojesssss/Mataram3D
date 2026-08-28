import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { coreValues } from '@/data/about';
import { Wrap } from '@/components/ui/Wrap';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonOutline, Eyebrow } from '@/components/ui/Type';
import { HEAD_PADDING, PageTitle, PSection } from '@/components/ui/Page';

export default function About() {
  usePageMeta(
    'About — Mataram',
    'To keep a living culture, not to preserve a relic. The record of a court still keeping ceremony, still teaching craft, still opening its gates.',
  );

  return (
    <>
      <div className={cx(HEAD_PADDING, 'bg-paper pb-[clamp(56px,6vw,100px)]')}>
        <Wrap>
          <Eyebrow>About Mataram</Eyebrow>
          <PageTitle className="mb-[26px] max-w-[900px] text-[clamp(2.25rem,5.2vw,5rem)] leading-[1.06] text-pretty">
            To keep a living culture, not to preserve <em>a relic</em>.
          </PageTitle>
          <p className="max-w-[60ch] text-[clamp(0.86rem,1.15vw,1.06rem)] leading-[1.95] text-ink/72 text-pretty">
            Mataram is not only a chapter of Javanese history. It is a court still keeping ceremony,
            still teaching craft, still opening its gates. This is the record of that work.
          </p>
        </Wrap>
      </div>

      <PSection tone="paper">
        <Wrap>
          <Reveal className="grid grid-cols-1 gap-[clamp(24px,3.2vw,64px)] min-[761px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            <div>
              <Eyebrow as="h2">Mission</Eyebrow>
              <p className={STATEMENT}>
                To safeguard the heritage of Mataram and make it legible to anyone willing to look —
                through record, ceremony, and open doors.
              </p>
            </div>
            <div>
              <Eyebrow as="h2">Vision</Eyebrow>
              <p className={STATEMENT}>
                A court whose culture is carried forward by the generation that comes next, not
                merely admired by it.
              </p>
            </div>
          </Reveal>
        </Wrap>
      </PSection>

      <PSection tone="banded">
        <Wrap>
          <Reveal>
            <Eyebrow as="h2">Core Values</Eyebrow>
          </Reveal>

          {/*
            Membulat di grid-nya, bukan di tiap sel: overflow memotong empat sudut
            luar sementara jahitan 1px antar sel tetap persegi, dan itulah yang
            membuatnya terbaca sebagai garis pemisah alih-alih sekadar jarak.
          */}
          <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px overflow-hidden rounded-lg border border-forest/18 bg-forest/18">
            {coreValues.map((value) => (
              <article
                key={value.num}
                className="flex min-h-[clamp(180px,18vw,240px)] flex-col justify-between bg-paper p-[clamp(26px,3vw,40px)]"
              >
                <p className="font-display text-[0.82rem] tracking-[0.2em] text-gold-deep">{value.num}</p>
                <div>
                  <h3 className="mb-2.5 font-display text-[clamp(1.4rem,2.3vw,2rem)] text-forest">{value.title}</h3>
                  <p className="mb-3 text-[0.6rem] tracking-[0.24em] uppercase text-gold-deep">{value.jv}</p>
                  <p className="text-[0.82rem] leading-[1.75] text-ink/72 text-pretty">{value.desc}</p>
                </div>
              </article>
            ))}
          </Reveal>
        </Wrap>
      </PSection>

      <section className="bg-forest-deep py-[clamp(50px,6vw,96px)] text-center">
        <Wrap>
          <Reveal
            as="p"
            className="mx-auto mb-[26px] max-w-[760px] font-display text-[clamp(1.5rem,3.2vw,3rem)] font-light italic leading-[1.4] text-paper text-pretty"
          >
            &ldquo;Manunggaling Kawula Gusti&rdquo; — the harmony of people, ruler, and cosmos.
          </Reveal>
          <ButtonOutline to="/history" tone="dark">
            Begin with the history <span aria-hidden="true">&#8594;</span>
          </ButtonOutline>
        </Wrap>
      </section>
    </>
  );
}

const STATEMENT =
  'font-display text-[clamp(1.3rem,2.2vw,1.95rem)] font-light leading-[1.5] text-forest text-pretty';
