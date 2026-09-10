import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Wrap } from '@/components/ui/Wrap';
import { SearchIcon } from '@/components/ui/Icons';
import { ButtonGold, Kicker, LinkMore, Rule, SectionTitle } from '@/components/ui/Type';
import {
  archivePreview,
  cultureCards,
  discoverCards,
  news,
  palaceIndex,
  royalHouseCards,
  timeline,
  values,
} from '@/data/home';

/*
  Homepage — satu pengalaman 3D yang digulir. Scene, scrim, dan loader dipasang
  SiteLayout lewat <HomeBackdrop>; file ini murni isi editorialnya.

  Dua atribut di bawah dibaca kode di luar React dan harus tetap ada:
    data-section  — tokens.js mengukur letaknya untuk menentukan beat kamera
    data-reveal   — ScrollController menganimasikannya lewat GSAP ScrollTrigger
  `data-reveal-delay` menahan sekian detik supaya blok terbuka berurutan.
*/

export default function Home() {
  usePageMeta(
    'Mataram — The Royal Heritage',
    'Sebuah warisan luhur yang hidup dalam sejarah, budaya, dan nilai-nilai Jawa. Digital heritage experience Istana Mataram.',
  );

  return (
    <>
      <Hero />
      <Introduction />
      <HistoryPreview />
      <RoyalHousePreview />
      <PalaceBeat />
      <Culture />
      <Discover />
      <ArchivePreview />
      <News />
    </>
  );
}

/* ── kerangka section ────────────────────────────────────────────────────── */

function Section({ id, center = false, className, children }) {
  return (
    <section
      id={id}
      data-section={id}
      className={cx('py-[clamp(84px,10vw,120px)]', center && 'text-center', className)}
    >
      {children}
    </section>
  );
}

function SectionHead({ kicker, title, center = false, children }) {
  return (
    <header className={cx('mb-16 max-w-[60ch]', center && 'mx-auto')}>
      <Kicker data-reveal="">{kicker}</Kicker>
      <SectionTitle data-reveal="" data-reveal-delay="0.06">
        {title}
      </SectionTitle>
      {children}
    </header>
  );
}

/* ── hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      id="hero"
      data-section="hero"
      /*
        Padding bawah yang berat mengangkat blok teks ke langit terbuka di atas
        atap, bukan menaruhnya persis di tengah pendopo. Pakai vh supaya di
        viewport pendek tombolnya tidak terdorong keluar layar.
      */
      className="relative grid min-h-[100svh] place-items-center px-5 pt-[110px] pb-[clamp(120px,22vh,250px)] text-center"
    >
      <div className="relative max-w-[760px]">
        {/*
          Teks hero duduk langsung di atas render 3D. Scrim yang menutupi seluruh
          hero memang memperbaiki keterbacaan, tapi memucatkan pendopo jadi hantu.
          Halo krem per-elemen melakukan hal yang sama tanpa tepi yang terlihat.
        */}
        <p
          data-reveal=""
          className="halo-strong m-0 font-display text-[clamp(1.15rem,2.4vw,1.75rem)] font-light italic text-forest opacity-90"
        >
          The Royal Heritage of
        </p>

        <h1
          data-reveal=""
          data-reveal-delay="0.08"
          className="mt-1 mb-0 font-display text-[clamp(3.4rem,12vw,8.2rem)] font-normal leading-[0.95] tracking-[0.06em] indent-[0.06em] text-forest"
        >
          MATARAM
        </h1>

        <div data-reveal="" data-reveal-delay="0.16">
          <Rule />
        </div>

        <p
          data-reveal=""
          data-reveal-delay="0.22"
          className="halo-strong mx-auto mb-16 max-w-[40ch] text-[clamp(0.95rem,1.5vw,1.08rem)] leading-[1.9] text-ink"
        >
          Sebuah warisan luhur yang hidup
          <br />
          dalam sejarah, budaya, dan nilai-nilai Jawa.
        </p>

        <ButtonGold href="#intro" data-reveal="" data-reveal-delay="0.3">
          EXPLORE
        </ButtonGold>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-[34px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="relative h-[54px] w-px overflow-hidden bg-gradient-to-b from-transparent to-gold">
          {/* Satu tanda berjalan — satu-satunya gerak berulang di halaman ini. */}
          <span className="animate-scroll-tick absolute inset-0 bg-forest" />
        </span>
        <span className="text-[0.6rem] tracking-[0.3em] indent-[0.3em] text-ink-soft">SCROLL</span>
      </div>
    </section>
  );
}

/* ── introduction ────────────────────────────────────────────────────────── */

function Introduction() {
  return (
    <Section id="intro" center>
      <Wrap narrow>
        <Kicker data-reveal="">Introduction</Kicker>
        <SectionTitle data-reveal="" data-reveal-delay="0.06">
          I Am Mataram
        </SectionTitle>
        <p
          data-reveal=""
          data-reveal-delay="0.12"
          className="halo mx-auto max-w-[58ch] text-[clamp(1.02rem,1.5vw,1.16rem)] leading-[1.85] text-ink-soft"
        >
          Bukan sekadar kerajaan yang tercatat dalam buku sejarah, melainkan sebuah cara
          memandang dunia — tempat manusia, penguasa, dan alam semesta berdiri dalam satu
          keselarasan.
        </p>

        <figure data-reveal="" data-reveal-delay="0.18" className="mx-auto my-16 max-w-[32ch]">
          <blockquote className="halo mb-4 font-display text-[clamp(1.6rem,3.6vw,2.5rem)] font-light italic leading-[1.3] text-forest">
            Manunggaling Kawula Gusti
          </blockquote>
          <figcaption className="halo text-[0.94rem] leading-[1.75] text-ink-soft">
            Keselarasan antara manusia, raja, dan alam semesta.
          </figcaption>
        </figure>

        <ul
          data-reveal=""
          data-reveal-delay="0.24"
          className="mt-16 flex list-none flex-wrap justify-center gap-[clamp(20px,5vw,64px)] border-t border-gold/30 pt-8"
        >
          {values.map((value) => (
            <li
              key={value}
              className="halo inline-flex items-center gap-2.5 text-[0.74rem] font-medium tracking-[0.2em] text-forest"
            >
              <span aria-hidden="true" className="text-gold">
                &#10022;
              </span>
              {value}
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}

/* ── history ─────────────────────────────────────────────────────────────── */

function HistoryPreview() {
  return (
    <Section id="history">
      <Wrap>
        <SectionHead kicker="A Kingdom Through Time" title="The Story of Mataram">
          <LinkMore to="/history" data-reveal="" data-reveal-delay="0.1">
            Jelajahi timeline
          </LinkMore>
        </SectionHead>

        <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(230px,1fr))] border-t border-forest/16">
          {timeline.map((item, i) => (
            <li
              key={item.year}
              data-reveal=""
              data-reveal-delay={(i * 0.06).toFixed(2)}
              // before:* menggambar simpul emas di atas rel. Di bawah 900px kolomnya
              // menumpuk, jadi garis pemisah pindah dari kanan ke bawah.
              className={cx(
                'relative border-forest/10 py-8 pr-8',
                'border-b max-[900px]:last:border-b-0',
                'min-[901px]:border-b-0 min-[901px]:border-r min-[901px]:last:border-r-0',
                "before:absolute before:-top-[4.5px] before:left-0 before:h-2 before:w-2 before:rounded-full before:bg-gold before:content-['']",
              )}
            >
              <span className="halo mb-2 block font-display text-[1.9rem] text-gold">{item.year}</span>
              <h3 className="halo mb-2.5 font-display text-[1.32rem] font-medium text-forest">{item.title}</h3>
              <p className="halo pr-4 text-[0.92rem] leading-[1.8] text-ink-soft">{item.body}</p>
            </li>
          ))}
        </ol>
      </Wrap>
    </Section>
  );
}

/* ── royal house ─────────────────────────────────────────────────────────── */

const GENEALOGY_BOX = 'rounded-lg border border-forest/20 bg-paper px-[30px] py-4 text-center';
const GENEALOGY_NAME = 'text-[0.76rem] font-medium tracking-[0.16em] leading-[1.6] text-forest';

function RoyalHousePreview() {
  return (
    <Section id="royal-house">
      <Wrap>
        <SectionHead kicker="The Royal House" title="Wangsa Mataram">
          <LinkMore to="/royal-house" data-reveal="" data-reveal-delay="0.1">
            Silsilah lengkap
          </LinkMore>
        </SectionHead>

        {/* Cuplikan silsilah — meniru "STRUKTUR KELUARGA KERAJAAN" di moodboard. */}
        <div
          data-reveal=""
          className="mb-16 flex flex-col items-center rounded-lg border border-gold/28 bg-paper/72 px-8 py-16"
        >
          <div className={GENEALOGY_BOX}>
            <p className={GENEALOGY_NAME}>SULTAN AGUNG</p>
            <p className="mt-1.5 text-[0.72rem] text-gold">1613 &ndash; 1645</p>
          </div>

          <div aria-hidden="true" className="h-10 w-px bg-forest/28" />

          <div className="relative flex flex-wrap justify-center gap-[clamp(20px,6vw,90px)] before:absolute before:-top-5 before:right-1/4 before:left-1/4 before:h-px before:bg-forest/28 before:content-['']">
            {['KASUNANAN\nSURAKARTA', 'KESULTANAN\nYOGYAKARTA'].map((court) => (
              <div
                key={court}
                className={cx(
                  GENEALOGY_BOX,
                  "relative before:absolute before:-top-5 before:left-1/2 before:h-5 before:w-px before:bg-forest/28 before:content-['']",
                )}
              >
                <p className={cx(GENEALOGY_NAME, 'whitespace-pre-line')}>{court}</p>
              </div>
            ))}
          </div>
        </div>

        <CardGrid>
          {royalHouseCards.map((card, i) => (
            <Card key={card.title} delay={i * 0.06} {...card} />
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

/* ── palace ──────────────────────────────────────────────────────────────── */

function PalaceBeat() {
  return (
    <section id="palace" data-section="palace" className="py-[clamp(109px,13vw,156px)]">
      <Wrap>
        {/*
          Rata kanan dan disempitkan, bukan selebar halaman. Di beat ini kamera
          menahan penari di sepertiga kiri, dan panel penuh di tengah akan
          menutupi tepat satu-satunya gambar yang jadi alasan section ini ada.
        */}
        <div className="ml-auto w-[min(100%,620px)] rounded-lg bg-forest/90 px-[clamp(22px,3vw,40px)] py-8 text-cream backdrop-blur-[3px]">
          <p data-reveal="" className="mb-4 text-[0.72rem] font-medium tracking-[0.26em] uppercase text-tan">
            The Palace
          </p>
          <h2
            data-reveal=""
            data-reveal-delay="0.06"
            className="mb-8 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-normal leading-[1.12] text-paper"
          >
            Pendopo
          </h2>
          <p data-reveal="" data-reveal-delay="0.12" className="mb-8 max-w-[52ch] text-cream/82">
            Ruang terbuka utama di Keraton sebagai tempat menerima tamu dan upacara resmi. Empat{' '}
            <em className="font-display text-[1.1em] italic text-tan">soko guru</em> menyangga atap
            bertingkat, dan di atasnya{' '}
            <em className="font-display text-[1.1em] italic text-tan">tumpang sari</em> menyusun
            langit-langit berundak — sebuah pernyataan tentang tatanan.
          </p>
          <LinkMore to="/palace" data-reveal="" data-reveal-delay="0.18" className="text-tan hover:text-paper">
            Baca selengkapnya
          </LinkMore>

          <ul data-reveal="" data-reveal-delay="0.1" className="mt-8 list-none border-t border-tan/28">
            {palaceIndex.map((label) => (
              <li key={label}>
                <a
                  href="#palace"
                  className="flex items-center justify-between gap-4 border-b border-tan/28 px-1 py-[17px] text-[0.88rem] text-cream no-underline transition-[padding,color] duration-[400ms] ease-heritage hover:pl-3.5 hover:text-tan"
                >
                  <span>{label}</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Wrap>
    </section>
  );
}

/* ── culture + discover ──────────────────────────────────────────────────── */

function Culture() {
  return (
    <Section id="culture">
      <Wrap>
        <SectionHead kicker="The Living Heritage" title="Budaya yang Masih Bernapas" />
        <CardGrid>
          {cultureCards.map((card, i) => (
            <Card key={card.title} delay={i * 0.05} {...card} />
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

function Discover() {
  return (
    <Section id="discover">
      <Wrap>
        <SectionHead kicker="Discover Mataram" title="Menyusuri Jejaknya" />
        <CardGrid min="230px">
          {discoverCards.map((card, i) => (
            <Card key={card.title} delay={i * 0.06} tall {...card} />
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

/*
  Membulat di grid-nya, bukan di tiap sel. Jarak 1px di atas induk bertint
  itulah yang menggambar garis pemisah antar kartu, jadi membulatkan tiap kartu
  akan membocorkan tint itu di setiap sudut.
*/
function CardGrid({ min = '260px', children }) {
  return (
    <div
      className="grid gap-px overflow-hidden rounded-lg border border-forest/12 bg-forest/12"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))` }}
    >
      {children}
    </div>
  );
}

function Card({ title, body, delay = 0, tall = false }) {
  return (
    <article
      data-reveal=""
      data-reveal-delay={delay ? delay.toFixed(2) : undefined}
      className={cx(
        'bg-paper/88 p-8 transition-colors duration-500 ease-heritage hover:bg-paper',
        tall && 'flex min-h-[260px] flex-col justify-end',
      )}
    >
      <h3 className="mb-2.5 font-display text-[1.4rem] font-medium text-forest">{title}</h3>
      <p className="text-[0.92rem] leading-[1.8] text-ink-soft">{body}</p>
    </article>
  );
}

/* ── archive ─────────────────────────────────────────────────────────────── */

function ArchivePreview() {
  return (
    <Section id="archive" className="bg-paper/58">
      <Wrap>
        <SectionHead kicker="Royal Archive" title="Arsip Kerajaan" />

        {/* Kotak cari hiasan; pencarian sungguhannya ada di /archive. */}
        <form
          role="search"
          data-reveal=""
          data-reveal-delay="0.1"
          onSubmit={(e) => e.preventDefault()}
          className="mb-8 flex items-center gap-2 rounded-lg border border-forest/20 bg-paper py-1.5 pr-1.5 pl-5"
        >
          <label className="sr-only" htmlFor="archive-q">
            Cari koleksi
          </label>
          <input
            id="archive-q"
            type="search"
            placeholder="Cari koleksi…"
            autoComplete="off"
            className="flex-1 border-none bg-transparent py-2.5 text-[0.92rem] outline-none placeholder:text-sage"
          />
          <button
            type="submit"
            aria-label="Cari arsip"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-forest text-paper transition-colors duration-[400ms] ease-heritage hover:bg-gold"
          >
            <SearchIcon size={17} />
          </button>
        </form>

        <CardGrid>
          {archivePreview.map((item, i) => (
            <article
              key={item.title}
              data-reveal=""
              data-reveal-delay={(i * 0.06).toFixed(2)}
              className="bg-paper/90 p-4 transition-colors duration-500 ease-heritage hover:bg-paper"
            >
              <div
                aria-hidden="true"
                className={cx(
                  'mb-4 grid aspect-[4/3] place-items-center text-[2.4rem]',
                  item.dark
                    ? 'bg-linear-[140deg,var(--color-forest-deep),var(--color-forest)] text-gold/75'
                    : 'bg-linear-[140deg,var(--color-cream),var(--color-tan)] text-forest/40',
                )}
              >
                <span>{item.glyph}</span>
              </div>
              <h3 className="mb-1 font-display text-[1.16rem] font-medium text-forest">{item.title}</h3>
              <p className="text-[0.78rem] text-ink-soft">{item.meta}</p>
            </article>
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

/* ── news ────────────────────────────────────────────────────────────────── */

function News() {
  return (
    <Section id="news">
      <Wrap>
        <SectionHead kicker="News & Events" title="Kabar dari Keraton" />

        <ul className="list-none border-t border-forest/16">
          {news.map((item, i) => (
            <li
              key={item.title}
              data-reveal=""
              data-reveal-delay={(i * 0.05).toFixed(2)}
              className="grid grid-cols-1 items-baseline gap-2 border-b border-forest/12 py-8 transition-[padding-left] duration-500 ease-heritage hover:pl-3.5 min-[761px]:grid-cols-[110px_1fr_auto] min-[761px]:gap-8"
            >
              <span className="halo text-[0.66rem] font-medium tracking-[0.18em] uppercase text-gold">
                {item.tag}
              </span>
              <h3 className="halo font-display text-[clamp(1.18rem,2.2vw,1.55rem)] font-normal text-forest">
                {item.title}
              </h3>
              <span className="halo text-[0.8rem] whitespace-nowrap text-ink-soft">{item.date}</span>
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
