import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { eras, historicPlaces } from '@/data/eras';
import { Wrap } from '@/components/ui/Wrap';
import { Frame } from '@/components/ui/Frame';
import { Reveal } from '@/components/ui/Reveal';
import { Dlink, Eyebrow } from '@/components/ui/Type';
import { DisplayHeading, PageHeader, Prose, PSection } from '@/components/ui/Page';

/** Era yang terbuka saat halaman dimuat: 1613, puncak kejayaan. */
const INITIAL_ERA = 2;

export default function History() {
  usePageMeta(
    'History — Mataram',
    'From a granted forest to two courts. Nine moments that shaped the kingdom of Mataram, 1558 to 1755.',
  );

  const [index, setIndex] = useState(INITIAL_ERA);

  return (
    <>
      <PageHeader
        eyebrow="History"
        title={
          <>
            A Kingdom
            <br />
            <em>Through Time</em>
          </>
        }
        lede="From a granted forest to two courts. Move along the line to follow the kingdom through the moments that changed it."
      />

      <EraRail index={index} onSelect={setIndex} />
      <EraDetail era={eras[index]} />
      <OriginsAndPlaces />
    </>
  );
}

/* ── rail ────────────────────────────────────────────────────────────────── */

/**
 * Garis waktu horizontal.
 *
 * Garis rambut dan isian emasnya diukur, bukan diinterpolasi. Pecahan
 * indeks/jumlah mengandaikan simpulnya tersebar merata sepanjang lebar penuh,
 * padahal tidak: simpul terakhir berhenti selebar satu simpul dari tepi kanan,
 * jadi isiannya selalu melewati atau kurang dari belah ketupat yang dituju.
 */
function EraRail({ index, onSelect }) {
  const trackRef = useRef(null);
  const innerRef = useRef(null);
  const dotRefs = useRef([]);
  const tabRefs = useRef([]);
  const [line, setLine] = useState({ left: 0, top: 0, width: 0, fill: 0 });

  const last = eras.length - 1;

  const measure = useCallback(() => {
    const inner = innerRef.current;
    const dots = dotRefs.current;
    if (!inner || !dots[0] || !dots[last]) return;

    // Titik tengah belah ketupat sebuah penanda, relatif ke sudut kiri-atas
    // .rail__inner — kotak yang lebarnya persis selebar deretan penanda, jadi
    // garis dan simpul selalu satu ruang koordinat meski rail-nya digulir.
    const origin = inner.getBoundingClientRect();
    const centreOf = (el) => {
      const box = el.getBoundingClientRect();
      return { x: box.left - origin.left + box.width / 2, y: box.top - origin.top + box.height / 2 };
    };

    const start = centreOf(dots[0]);
    setLine({
      left: start.x,
      top: start.y,
      width: centreOf(dots[last]).x - start.x,
      fill: centreOf(dots[index]).x - start.x,
    });
  }, [index, last]);

  useLayoutEffect(measure, [measure]);

  // Lebar garis dalam px, jadi harus diukur ulang tiap penanda bergeser: webfont
  // yang datang telat mengubah lebarnya, begitu juga resize. Menggulir rail
  // tidak — garisnya ikut menggulir bersama simpul di dalam .rail__inner.
  useEffect(() => {
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Menggulir rail secukupnya sampai penanda terpilih terlihat penuh. Memusatkan
  // tiap pilihan bikin klik pertama menyentak timeline dan memotong tahun-tahun
  // awal tanpa alasan.
  useEffect(() => {
    const track = trackRef.current;
    const tab = tabRefs.current[index];
    if (!track || !tab || track.scrollWidth <= track.clientWidth) return;

    const t = track.getBoundingClientRect();
    const b = tab.getBoundingClientRect();
    const margin = 24;

    if (b.left < t.left + margin) track.scrollBy({ left: b.left - t.left - margin, behavior: 'smooth' });
    else if (b.right > t.right - margin) track.scrollBy({ left: b.right - t.right + margin, behavior: 'smooth' });
  }, [index]);

  /** @param {boolean} focus pindahkan fokus keyboard ke penanda baru */
  const select = (next, focus = false) => {
    const clamped = Math.max(0, Math.min(last, next));
    onSelect(clamped);
    if (focus) tabRefs.current[clamped]?.focus();
  };

  const onKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) {
      e.preventDefault();
      select(index + step, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      select(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(last, true);
    }
  };

  return (
    <section
      aria-label="Garis waktu Mataram"
      onKeyDown={onKeyDown}
      className="bg-cream px-[clamp(18px,2.4vw,36px)] py-[clamp(28px,3.4vw,52px)]"
    >
      <Wrap>
        <div className="mb-[22px] flex items-center justify-between gap-3.5">
          <p className="text-[0.64rem] tracking-[0.3em] uppercase text-ink/72">1558 &mdash; 1755</p>
          <div className="flex gap-2">
            <StepButton label="Era sebelumnya" disabled={index === 0} onClick={() => select(index - 1)}>
              &#8592;
            </StepButton>
            <StepButton label="Era berikutnya" disabled={index === last} onClick={() => select(index + 1)}>
              &#8594;
            </StepButton>
          </div>
        </div>

        <div ref={trackRef} className="rail-scroll relative overflow-x-auto overflow-y-hidden pb-2.5">
          <div ref={innerRef} className="relative min-w-max">
            {/* Rail dibatasi simpul pertama dan terakhir, bukan lebar penuh, supaya
                garisnya tidak menjulur lewat 1755 seolah ceritanya berlanjut. */}
            <span
              aria-hidden="true"
              className="absolute h-px bg-forest/20"
              style={{ left: line.left, top: line.top, width: line.width }}
            />
            <span
              aria-hidden="true"
              className="absolute h-px bg-gold transition-[width] duration-500 ease-heritage"
              style={{ left: line.left, top: line.top, width: line.fill }}
            />

            <div role="tablist" aria-label="Pilih era" className="flex list-none gap-[clamp(10px,1.2vw,18px)] p-[0.6rem]">
              {eras.map((era, i) => (
                <div key={era.year} className="min-w-[clamp(74px,7.6vw,100px)] flex-1 basis-0">
                  <button
                    ref={(el) => (tabRefs.current[i] = el)}
                    type="button"
                    role="tab"
                    id={`tab-${i}`}
                    aria-controls="era-panel"
                    aria-selected={i === index}
                    // Roving tabindex: hanya penanda terpilih yang jadi tab stop,
                    // jadi Tab melewati seluruh rail dan panah berjalan di dalamnya.
                    tabIndex={i === index ? 0 : -1}
                    onClick={() => select(i)}
                    className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left transition-opacity duration-[350ms] ease-heritage hover:opacity-[0.72]"
                  >
                    <Diamond ref={(el) => (dotRefs.current[i] = el)} active={i === index} />
                    <span
                      className={cx(
                        'mt-[18px] block font-display text-[clamp(1.25rem,2vw,1.75rem)] leading-none',
                        i === index ? 'text-forest' : 'text-ink/88',
                      )}
                    >
                      {era.year}
                    </span>
                    <span
                      className={cx(
                        'mt-[7px] block text-[0.66rem] leading-[1.5] tracking-[0.14em] uppercase',
                        i === index ? 'text-gold-deep' : 'text-ink/72',
                      )}
                    >
                      {era.tag}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

function StepButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-lg border border-forest/32 bg-transparent text-[0.86rem] text-forest transition-[background-color,opacity] duration-[350ms] ease-heritage hover:not-disabled:bg-forest/12 disabled:cursor-default disabled:opacity-[0.32]"
    >
      {children}
    </button>
  );
}

/**
 * Simpul di atas rail.
 *
 * Kotaknya persis 11px dengan kedua belah ketupat terpusat di dalamnya. Dulu
 * ketupat diam digeser oleh margin-nya sendiri sementara yang aktif rata kiri,
 * jadi memilih penanda menggeser simpul beberapa piksel. Memusatkan keduanya
 * juga memberi titik tengah yang bisa diandalkan untuk mengukur garisnya.
 */
function Diamond({ ref, active }) {
  return (
    <span ref={ref} aria-hidden="true" className="relative block h-[11px] w-[11px]">
      <span className="absolute top-1/2 left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-forest/40" />
      {active && (
        <span className="absolute top-1/2 left-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold shadow-[0_0_0_5px_rgb(201_163_78/0.18)]" />
      )}
    </span>
  );
}

/* ── detail era ──────────────────────────────────────────────────────────── */

function EraDetail({ era }) {
  return (
    <section aria-label="Detail era" className="bg-cream pb-[clamp(60px,7vw,110px)]">
      <Wrap>
        <div
          id="era-panel"
          role="tabpanel"
          tabIndex={0}
          // key memaksa React menukar node, jadi animasi masuknya diputar ulang
          // tiap ganti era — di CSS lama ini dilakukan dengan menyembunyikan
          // sembilan panel sekaligus.
          key={era.year}
          className="animate-era-in grid grid-cols-1 items-start gap-[clamp(24px,3.2vw,58px)] min-[761px]:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]"
        >
          <Frame
            src={era.image}
            alt={era.alt}
            label="Historical image"
            tag={era.tag}
            className="h-[clamp(220px,58vw,300px)] min-[761px]:h-[clamp(280px,34vw,500px)]"
          />

          <div>
            <p className="mb-3.5 flex items-baseline gap-[18px] after:h-px after:flex-1 after:bg-forest/25 after:content-['']">
              <span className="font-display text-[clamp(3.4rem,7vw,6.8rem)] leading-[0.9] text-gold-deep">{era.year}</span>
            </p>
            <h2 className="mb-5 font-display text-[clamp(1.6rem,3vw,2.75rem)] font-light leading-[1.15] text-forest">
              {era.title}
            </h2>
            <p className="mb-7 text-[clamp(0.85rem,1.15vw,1.06rem)] leading-[1.95] text-ink/88 text-pretty">{era.body}</p>
            <Dlink to="/archive">Related records</Dlink>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/* ── asal-usul + tempat bersejarah ───────────────────────────────────────── */

function OriginsAndPlaces() {
  return (
    <PSection tone="paper">
      <Wrap>
        <Reveal className="mb-[clamp(36px,4vw,64px)] grid grid-cols-1 gap-[clamp(24px,3.2vw,64px)] min-[761px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          <div>
            <Eyebrow>Origins</Eyebrow>
            <DisplayHeading>
              Before there was
              <br />a kingdom, there
              <br />
              was <em>a forest</em>.
            </DisplayHeading>
          </div>
          <div>
            <Prose>
              Mataram does not begin with a conquest. It begins with a reward — a stretch of
              woodland called Mentaok, handed to a loyal servant of Pajang who chose to clear it
              rather than trade it.
            </Prose>
            <Prose dim>
              Within one generation his son had declared a kingdom there. Within three, that kingdom
              set the standard for Javanese language, dress, music, and time itself.
            </Prose>
          </div>
        </Reveal>

        <Reveal>
          <Eyebrow>Historical Places</Eyebrow>
        </Reveal>

        <Reveal className="grid grid-cols-2 gap-[clamp(12px,1.6vw,22px)] min-[521px]:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {historicPlaces.map((place) => (
            <article
              key={place.title}
              className="overflow-hidden rounded-lg border border-forest/16 bg-paper transition-[border-color,transform] duration-500 ease-heritage hover:-translate-y-[3px] hover:border-gold/70"
            >
              <Frame
                src={place.image}
                alt={place.alt}
                label="Place photo"
                rounded={false}
                className="h-[118px] min-[521px]:h-[clamp(140px,15vw,200px)]"
              />
              <div className="px-[18px] pt-[18px] pb-[22px]">
                <h3 className="mb-[7px] font-display text-[1.3rem] text-forest">{place.title}</h3>
                <p className="text-[0.72rem] tracking-[0.04em] text-ink-soft">{place.meta}</p>
              </div>
            </article>
          ))}
        </Reveal>
      </Wrap>
    </PSection>
  );
}
