import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { Wrap } from '@/components/ui/Wrap';
import { Band } from '@/components/ui/Band';
import { Surface } from '@/components/ui/Surface';
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
  Homepage — satu pengalaman 3D yang digulir. Scene dan loader dipasang
  SiteLayout lewat <HomeBackdrop>; file ini murni isi editorialnya.

  Dua atribut di bawah dibaca kode di luar React dan harus tetap ada:
    data-section  — tokens.js mengukur letaknya untuk menentukan beat kamera
    data-reveal   — ScrollController menganimasikannya lewat GSAP ScrollTrigger
  `data-reveal-delay` menahan sekian detik supaya blok terbuka berurutan.

  KETERBACAAN: kontras dibawa <Band>, bukan tiap blok. Section baru cukup
  ditaruh di dalam salah satu band dan sudah aman — tidak perlu panel, wash,
  atau halo sendiri. Yang butuh perhatian justru sebaliknya: menaruh sesuatu
  di LUAR band (seperti Palace) berarti mengambil alih tanggung jawab kontras
  section itu. Alasan lengkapnya di components/ui/Band.jsx.

  BAHASA: seluruh copy di file ini dibungkus `t({ id, en })` dari
  LanguageContext. Konten daftar (kartu, timeline, dst.) sudah bilingual di
  data/home.js; yang ditulis literal di sini (kicker, judul section, hero)
  dibungkus langsung di tempat pakainya.
*/

export default function Home() {
  const { t } = useLanguage();

  usePageMeta(
    t({ id: 'Mataram — Warisan Luhur Kerajaan', en: 'Mataram — The Royal Heritage' }),
  );

  /*
    Susunannya adalah strukturnya. Dua rentang baca mengapit satu momen 3D:
    hero membuka dengan pendopo tanpa penghalang, band pertama menutupinya
    selama tiga section teks, lalu MENGELUPAS tepat di Palace — itu reveal-nya
    — dan band kedua menutup kembali sampai footer.

    Palace sengaja berdiri di luar band. Ia satu-satunya section yang membawa
    panelnya sendiri (hijau, rata kanan), dan di beat itu kamera menahan
    penari di sepertiga kiri; pelat paper di sana akan menutupi tepat
    satu-satunya gambar yang jadi alasan section itu ada.
  */
  return (
    <>
      <Hero />

      <Band>
        <Introduction />
        <HistoryPreview />
        <RoyalHousePreview />
      </Band>

      <PalaceBeat />

      {/*
        Jangkar `ascend` (lihat config/tokens.js) — tinggi nol, sengaja diletakkan
        tepat di batas Palace/Band, BUKAN di dalam Culture seperti sebelumnya.
        Beat itu mengangkat kamera lurus ke tumpang sari, bagian paling terang di
        seluruh scene, dan kalau ia dipusatkan di section Culture ia mendarat
        tepat di belakang heading "A Culture Still Breathing" — band-plate
        (alpha 0.88, dikalibrasi untuk atap gelap) tidak cukup pekat menutupi
        pola berlian emas yang seterang itu, dan hasilnya kelihatan seperti
        render dobel/rusak di belakang teks.
        Dengan jangkar di sini, puncak `ascend` jatuh saat batas ini baru
        separuh layar — sebelum padding-top Band + Section sempat membawa
        pembaca ke heading — sehingga pada saat heading benar-benar terlihat,
        kamera sudah bergerak ke arah `compound` (aerial, jauh lebih tenang).
      */}
      <div data-section="ascend-reveal" aria-hidden="true" className="h-0" />

      <Band fade="top">
        <Culture />
        <Discover />
        <ArchivePreview />
        <News />
      </Band>
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
  const { t } = useLanguage();
  return (
    <header className={cx('mb-16 max-w-[60ch]', center && 'mx-auto')}>
      <Kicker data-reveal="">{t(kicker)}</Kicker>
      <SectionTitle data-reveal="" data-reveal-delay="0.06">
        {t(title)}
      </SectionTitle>
      {children}
    </header>
  );
}

/* ── hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  const { t } = useLanguage();

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
      {/*
        Hero adalah satu-satunya pengecualian dari aturan "semua teks di dalam
        surface", dan pengecualiannya per-baris, bukan per-blok.

        Percobaan membungkus seluruh blok hero dengan wash sudah dicoba dan
        dibuang: pada lebar 760px, dataran alpha penuhnya menutupi tepat bagian
        layar tempat pendopo berdiri, dan pendoponya jadi hantu. Itu membunuh
        satu-satunya momen di halaman ini di mana 3D-nya utuh tanpa kompetisi —
        persis kerugian yang bikin scrim global ditolak sejak awal.

        Yang benar: baca komposisinya. Padding bawah section ini sengaja
        mengangkat teks ke langit terbuka DI ATAS atap, dan di langit itu
        forest sudah 7.97:1 tanpa bantuan apa pun. Judul besar dan baris
        italiknya karena itu dibiarkan telanjang.

        Yang tidak selamat cuma sub-copy: ia paling bawah, paling kecil, dan di
        viewport pendek ia turun sampai menyentuh garis atap. Itu satu elemen,
        jadi wash-nya dipasang di elemen itu saja — awan kecil setinggi dua
        baris, bukan panel selebar hero.
      */}
      <div className="relative max-w-[760px]">
        <p
          data-reveal=""
          className="halo m-0 font-display text-[clamp(1.15rem,2.4vw,1.75rem)] font-light italic text-forest opacity-90"
        >
          {t({ id: 'Warisan Luhur dari', en: 'The Royal Heritage of' })}
        </p>

        <h1
          data-reveal=""
          data-reveal-delay="0.08"
          className="halo mt-1 mb-0 font-display text-[clamp(3.4rem,12vw,8.2rem)] font-normal leading-[0.95] tracking-[0.06em] indent-[0.06em] text-forest"
        >
          MATARAM
        </h1>

        <div data-reveal="" data-reveal-delay="0.16">
          <Rule />
        </div>

        {/* <Surface
          as="p"
          data-reveal=""
          data-reveal-delay="0.22"
          className="mx-auto mb-16 max-w-[40ch] text-[clamp(0.95rem,1.5vw,1.08rem)] leading-[1.9] text-ink"
        >

          <br />
          {t({ id: 'dalam sejarah, budaya, dan nilai-nilai Jawa.', en: 'in history, culture, and Javanese values.' })}
        </Surface> */}

        <ButtonGold href="#intro" data-reveal="" data-reveal-delay="0.3">
          {t({ id: 'JELAJAHI', en: 'EXPLORE' })}
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
        {/*
          Satu-satunya teks di homepage yang memang tidak boleh punya panel —
          panel di bawah hero akan membaca sebagai tombol. Ini kasus yang
          tersisa untuk `halo`, dan ia cukup di sini karena empat huruf
          berjarak lebar tidak punya celah dalam yang perlu diisi.
        */}
        <span className="halo text-[0.6rem] tracking-[0.3em] indent-[0.3em] text-ink">
          {t({ id: 'GULIR', en: 'SCROLL' })}
        </span>
      </div>
    </section>
  );
}

/* ── introduction ────────────────────────────────────────────────────────── */

function Introduction() {
  const { t } = useLanguage();

  return (
    <Section id="intro" center>
      <Wrap narrow>
        <Kicker data-reveal="">{t({ id: 'Pengantar', en: 'Introduction' })}</Kicker>
        <SectionTitle data-reveal="" data-reveal-delay="0.06">
          {t({ id: 'Akulah Mataram', en: 'I Am Mataram' })}
        </SectionTitle>
        <p
          data-reveal=""
          data-reveal-delay="0.12"
          className="mx-auto max-w-[58ch] text-[clamp(1.02rem,1.5vw,1.16rem)] leading-[1.85] text-ink-soft"
        >
          {t({
            id: 'Bukan sekadar kerajaan yang tercatat dalam buku sejarah, melainkan sebuah cara memandang dunia — tempat manusia, penguasa, dan alam semesta berdiri dalam satu keselarasan.',
            en: 'Not merely a kingdom recorded in history books, but a way of seeing the world — where people, ruler, and cosmos stand in a single harmony.',
          })}
        </p>

        <figure data-reveal="" data-reveal-delay="0.18" className="mx-auto my-16 max-w-[32ch]">
          <blockquote className="mb-4 font-display text-[clamp(1.6rem,3.6vw,2.5rem)] font-light italic leading-[1.3] text-forest">
            Manunggaling Kawula Gusti
          </blockquote>
          <figcaption className="text-[0.94rem] leading-[1.75] text-ink-soft">
            {t({
              id: 'Keselarasan antara manusia, raja, dan alam semesta.',
              en: 'The harmony of people, ruler, and cosmos.',
            })}
          </figcaption>
        </figure>

        <ul
          data-reveal=""
          data-reveal-delay="0.24"
          className="mt-16 flex list-none flex-wrap justify-center gap-[clamp(20px,5vw,64px)] border-t border-gold/30 pt-8"
        >
          {values.map((value) => (
            <li
              key={value.en}
              className="inline-flex items-center gap-2.5 text-[0.74rem] font-medium tracking-[0.2em] text-forest"
            >
              <span aria-hidden="true" className="text-gold">
                &#10022;
              </span>
              {t(value)}
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}

/* ── history ─────────────────────────────────────────────────────────────── */

function HistoryPreview() {
  const { t } = useLanguage();

  return (
    <Section id="history">
      <Wrap>
        <SectionHead
          kicker={{ id: 'Sebuah Kerajaan Sepanjang Masa', en: 'A Kingdom Through Time' }}
          title={{ id: 'Kisah Mataram', en: 'The Story of Mataram' }}
        >
          <LinkMore to="/history" data-reveal="" data-reveal-delay="0.1">
            {t({ id: 'Jelajahi timeline', en: 'Explore the timeline' })}
          </LinkMore>
        </SectionHead>

        {/*
          Kembali ke minmax 230px seperti versi aslinya. Waktu timeline masih
          dibungkus panelnya sendiri, padding panel itu memakan ~104px dan
          empat entri tidak muat lagi di 1180px — relnya pecah jadi 3+1. Band
          tidak menambah padding apa pun ke dalam kolom, jadi batasan itu
          hilang bersama panelnya.
        */}
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
              <span className="mb-2 block font-display text-[1.9rem] text-gold-deep">{item.year}</span>
              <h3 className="mb-2.5 font-display text-[1.32rem] font-medium text-forest">{t(item.title)}</h3>
              <p className="pr-4 text-[0.92rem] leading-[1.8] text-ink-soft">{t(item.body)}</p>
            </li>
          ))}
        </ol>
      </Wrap>
    </Section>
  );
}

/* ── royal house ─────────────────────────────────────────────────────────── */

/*
  Varian max-[520px] ada karena dua kotak cabang harus tetap berdampingan
  (garisnya tidak bisa menyambung bagan yang terlipat): di 320px tiap kolom
  cuma ~108px, dan nama terpanjang (YOGYAKARTA) di ukuran desktop saja
  sudah ~102px sebelum padding.
*/
const GENEALOGY_BOX = 'rounded-lg border border-forest/20 bg-paper px-[30px] py-4 text-center max-[520px]:px-3';
const GENEALOGY_NAME =
  'text-[0.76rem] font-medium tracking-[0.16em] leading-[1.6] text-forest max-[520px]:text-[0.66rem] max-[520px]:tracking-[0.1em]';

function RoyalHousePreview() {
  const { t } = useLanguage();

  return (
    <Section id="royal-house">
      <Wrap>
        <SectionHead kicker={{ id: 'Wangsa Kerajaan', en: 'The Royal House' }} title={{ id: 'Wangsa Mataram', en: 'House of Mataram' }}>
          <LinkMore to="/royal-house" data-reveal="" data-reveal-delay="0.1">
            {t({ id: 'Silsilah lengkap', en: 'Full genealogy' })}
          </LinkMore>
        </SectionHead>

        {/*
          Cuplikan silsilah — meniru "STRUKTUR KELUARGA KERAJAAN" di moodboard.
          Kotaknya dipertahankan sebagai diagram, bukan sebagai panel kontras:
          band sudah menanggung keterbacaannya, jadi tint di sini murni untuk
          memisahkan bagan dari teks di sekitarnya. Nama dan gelar di dalamnya
          adalah proper noun, sama di kedua bahasa — tidak dibungkus t().
        */}
        <div
          data-reveal=""
          className="mb-16 flex flex-col items-center rounded-lg border border-gold/28 bg-paper/55 px-8 py-16 max-[520px]:px-3"
        >
          <div className={GENEALOGY_BOX}>
            <p className={GENEALOGY_NAME}>SULTAN AGUNG</p>
            <p className="mt-1.5 text-[0.72rem] text-gold-deep">1613 &ndash; 1645</p>
          </div>

          {/* Batang dari Sultan Agung — berhenti tepat di palang, tidak menembusnya. */}
          <div aria-hidden="true" className="h-5 w-px bg-forest/28" />

          {/*
            Palangnya dirakit per anak, bukan satu garis selebar baris. Palang
            lama diukur dari lebar baris (left/right 1/4) dan tidak tahu di mana
            kotak anaknya berdiri, jadi ujungnya meleset dari batang turunnya.
            Sekarang tiap <li> menggambar separuh kiri (::before) dan separuh
            kanan (::after) di tepi atasnya; anak pertama membuang separuh
            kirinya dan anak terakhir separuh kanannya, sehingga palangnya
            berujung persis di tengah kotak pertama dan terakhir, berapa pun
            lebarnya. Kolomnya sama lebar (auto-cols-fr) supaya batang Sultan
            Agung jatuh tepat di tengah palang.
            Tidak lagi flex-wrap: bagan yang pecah ke dua baris tidak bisa
            disambung garis, jadi di layar sempit ukurannya yang mengecil
            (lihat GENEALOGY_BOX).
          */}
          <ul className="grid list-none auto-cols-fr grid-flow-col">
            {['KASUNANAN\nSURAKARTA', 'KESULTANAN\nYOGYAKARTA'].map((court) => (
              <li
                key={court}
                className={cx(
                  'relative flex justify-center px-[clamp(6px,3vw,45px)] pt-5',
                  "before:absolute before:top-0 before:left-0 before:h-px before:w-1/2 before:bg-forest/28 before:content-[''] first:before:hidden",
                  "after:absolute after:top-0 after:right-0 after:h-px after:w-1/2 after:bg-forest/28 after:content-[''] last:after:hidden",
                )}
              >
                <div
                  className={cx(
                    GENEALOGY_BOX,
                    "relative before:absolute before:-top-5 before:left-1/2 before:h-5 before:w-px before:bg-forest/28 before:content-['']",
                  )}
                >
                  <p className={cx(GENEALOGY_NAME, 'whitespace-pre-line')}>{court}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <CardGrid>
          {royalHouseCards.map((card, i) => (
            <Card key={card.title.en} delay={i * 0.06} title={card.title} body={card.body} />
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

/* ── palace ──────────────────────────────────────────────────────────────── */

function PalaceBeat() {
  const { t } = useLanguage();

  return (
    <section id="palace" data-section="palace" className="py-[clamp(109px,13vw,156px)]">
      <Wrap>
        {/*
          Rata kanan dan disempitkan, bukan selebar halaman. Di beat ini kamera
          menahan penari di sepertiga kiri, dan panel penuh di tengah akan
          menutupi tepat satu-satunya gambar yang jadi alasan section ini ada.
        */}
        <div className="ml-auto w-[min(100%,620px)] rounded-lg bg-forest/90 px-[clamp(22px,3vw,40px)] py-8 text-cream backdrop-blur-[3px] pointer-coarse:backdrop-blur-none">
          <p data-reveal="" className="mb-4 text-[0.72rem] font-medium tracking-[0.26em] uppercase text-tan">
            {t({ id: 'Istana', en: 'The Palace' })}
          </p>
          <h2
            data-reveal=""
            data-reveal-delay="0.06"
            className="mb-8 font-display text-[clamp(2.1rem,4.4vw,3.4rem)] font-normal leading-[1.12] text-paper"
          >
            Pendopo
          </h2>
          <p data-reveal="" data-reveal-delay="0.12" className="mb-8 max-w-[52ch] text-cream/82">
            {t({
              id: (
                <>
                  Ruang terbuka utama di Keraton sebagai tempat menerima tamu dan upacara resmi. Empat{' '}
                  <em className="font-display text-[1.1em] italic text-tan">soko guru</em> menyangga atap
                  bertingkat, dan di atasnya{' '}
                  <em className="font-display text-[1.1em] italic text-tan">tumpang sari</em> menyusun
                  langit-langit berundak — sebuah pernyataan tentang tatanan.
                </>
              ),
              en: (
                <>
                  The main open space in the Keraton for receiving guests and holding official
                  ceremony. Four <em className="font-display text-[1.1em] italic text-tan">soko guru</em>{' '}
                  pillars carry the tiered roof, and above them{' '}
                  <em className="font-display text-[1.1em] italic text-tan">tumpang sari</em> forms a
                  stepped ceiling — a statement about order.
                </>
              ),
            })}
          </p>
          <LinkMore to="/palace" data-reveal="" data-reveal-delay="0.18" className="text-tan hover:text-paper">
            {t({ id: 'Baca selengkapnya', en: 'Read more' })}
          </LinkMore>

          <ul data-reveal="" data-reveal-delay="0.1" className="mt-8 list-none border-t border-tan/28">
            {palaceIndex.map((label) => (
              <li key={label.en}>
                <a
                  href="#palace"
                  className="flex items-center justify-between gap-4 border-b border-tan/28 px-1 py-[17px] text-[0.88rem] text-cream no-underline transition-[padding,color] duration-[400ms] ease-heritage hover:pl-3.5 hover:text-tan"
                >
                  <span>{t(label)}</span>
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
        <SectionHead
          kicker={{ id: 'Warisan yang Masih Hidup', en: 'The Living Heritage' }}
          title={{ id: 'Budaya yang Masih Bernapas', en: 'A Culture Still Breathing' }}
        />
        {/* min="300px" (bukan default 260px) supaya enam kartu memenuhi 3 kolom
            persis — di lebar konten 1100px, 260px menghasilkan 4 kolom dan
            menyisakan 2 sel kosong di baris kedua yang menampakkan scene 3D
            di baliknya. */}
        <CardGrid min="300px">
          {cultureCards.map((card, i) => (
            <Card key={card.title.en} delay={i * 0.05} title={card.title} body={card.body} />
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
        <SectionHead
          kicker={{ id: 'Jelajahi Mataram', en: 'Discover Mataram' }}
          title={{ id: 'Menyusuri Jejaknya', en: 'Tracing Its Footsteps' }}
        />
        <CardGrid min="230px">
          {discoverCards.map((card, i) => (
            <Card key={card.title.en} delay={i * 0.06} tall title={card.title} body={card.body} />
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
  const { t } = useLanguage();
  return (
    <article
      data-reveal=""
      data-reveal-delay={delay ? delay.toFixed(2) : undefined}
      className={cx(
        'bg-paper/88 p-8 transition-colors duration-500 ease-heritage hover:bg-paper',
        tall && 'flex min-h-[260px] flex-col justify-end',
      )}
    >
      <h3 className="mb-2.5 font-display text-[1.4rem] font-medium text-forest">{t(title)}</h3>
      <p className="text-[0.92rem] leading-[1.8] text-ink-soft">{t(body)}</p>
    </article>
  );
}

/* ── archive ─────────────────────────────────────────────────────────────── */

/*
  Tint sepenuh-section (dulu bg-paper/58) dibuang. Itu peninggalan dari saat
  tiap section harus mengurus kontrasnya sendiri; sekarang section ini berada di
  dalam band kedua, jadi lapisan cat tambahan hanya menumpuk di atas pelat yang
  sudah ada dan membuat bandnya belang di satu section saja.
*/
function ArchivePreview() {
  const { t } = useLanguage();

  return (
    <Section id="archive">
      <Wrap>
        <SectionHead kicker={{ id: 'Arsip Kerajaan', en: 'Royal Archive' }} title={{ id: 'Arsip Kerajaan', en: 'Royal Archive' }} />

        {/* Kotak cari hiasan; pencarian sungguhannya ada di /archive. */}
        <form
          role="search"
          data-reveal=""
          data-reveal-delay="0.1"
          onSubmit={(e) => e.preventDefault()}
          className="mb-8 flex items-center gap-2 rounded-lg border border-forest/20 bg-paper py-1.5 pr-1.5 pl-5"
        >
          <label className="sr-only" htmlFor="archive-q">
            {t({ id: 'Cari koleksi', en: 'Search the collection' })}
          </label>
          <input
            id="archive-q"
            type="search"
            placeholder={t({ id: 'Cari koleksi…', en: 'Search the collection…' })}
            autoComplete="off"
            className="flex-1 border-none bg-transparent py-2.5 text-[0.92rem] outline-none placeholder:text-sage"
          />
          <button
            type="submit"
            aria-label={t({ id: 'Cari arsip', en: 'Search the archive' })}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg bg-forest text-paper transition-colors duration-[400ms] ease-heritage hover:bg-gold"
          >
            <SearchIcon size={17} />
          </button>
        </form>

        <CardGrid>
          {archivePreview.map((item, i) => (
            <article
              key={item.glyph}
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
              <h3 className="mb-1 font-display text-[1.16rem] font-medium text-forest">{t(item.title)}</h3>
              <p className="text-[0.78rem] text-ink-soft">{t(item.meta)}</p>
            </article>
          ))}
        </CardGrid>
      </Wrap>
    </Section>
  );
}

/* ── news ────────────────────────────────────────────────────────────────── */

function News() {
  const { t } = useLanguage();

  return (
    <Section id="news">
      <Wrap>
        <SectionHead kicker={{ id: 'Berita & Acara', en: 'News & Events' }} title={{ id: 'Kabar dari Keraton', en: 'News from the Court' }} />

        <ul className="list-none border-t border-forest/16">
          {news.map((item, i) => (
            <li
              key={item.title.en}
              data-reveal=""
              data-reveal-delay={(i * 0.05).toFixed(2)}
              className="grid grid-cols-1 items-baseline gap-2 border-b border-forest/12 py-8 transition-[padding-left] duration-500 ease-heritage hover:pl-3.5 min-[761px]:grid-cols-[110px_1fr_auto] min-[761px]:gap-8"
            >
              <span className="text-[0.66rem] font-medium tracking-[0.18em] uppercase text-gold-deep">
                {t(item.tag)}
              </span>
              <h3 className="font-display text-[clamp(1.18rem,2.2vw,1.55rem)] font-normal text-forest">
                {t(item.title)}
              </h3>
              <span className="text-[0.8rem] whitespace-nowrap text-ink-soft">{t(item.date)}</span>
            </li>
          ))}
        </ul>
      </Wrap>
    </Section>
  );
}
