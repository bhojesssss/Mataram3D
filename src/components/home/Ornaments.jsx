/*
  Ornamen latar homepage di ponsel — pengganti scene 3D di layar yang tidak
  menjalankannya (lihat PlainBackdrop). Semuanya SVG inline: tajam di DPR
  berapa pun, tanpa unduhan, dan tidak ada yang digambar ulang saat scroll.

  Warnanya dari palet: forest untuk massa atap, emas untuk garis dan trim,
  timber untuk tiang — sama dengan pendopo 3D-nya.
*/

const GOLD = '#C9A34E';
const FOREST = '#2C4A34';
const FOREST_DEEP = '#1B2F21';
const TIMBER = '#6E5A3C';
const TAN = '#DCC89A';
const PAPER = '#F7F4EC';

/* ── pendopo joglo ──────────────────────────────────────────────────────── */

// Tiga tingkat atap, dari atas: brunjung (curam), penanggap, penitih (paling
// lebar, ujungnya melentik). Sisi-sisinya kurva cekung, seperti atap 3D-nya.
const BRUNJUNG = 'M160 34H200C206 50 218 66 234 76L228 82H132L126 76C142 66 154 50 160 34Z';
const PENANGGAP = 'M124 88H236C252 98 270 106 292 110L284 116H76L68 110C90 106 108 98 124 88Z';
const PENITIH = 'M84 122H276C298 130 322 136 348 136L338 144H22L12 136C38 136 62 130 84 122Z';
const MUSTAKA = 'M180 6C181 12 189 17 189 23C189 28 185 31 180 31C175 31 171 28 171 23C171 17 179 12 180 6Z';

// Tiang depan (ring penitih), dengan bentang tengah dibiarkan terbuka sebagai
// jalan masuk — persis seperti di 3D. Dua soko guru tampak di dalam bentang itu.
const PILLARS = [36, 70, 104, 138, 222, 256, 290, 324];
const SOKO_GURU = [164, 196];

/**
 * Siluet pendopo joglo, dari depan, berdiri di atas pita parang.
 *
 * Garis emasnya tergambar sekali saat halaman terbuka; massa atap dan tiangnya
 * menyusul (lihat .line-draw di index.css).
 */
export function PendopoArt({ className }) {
  return (
    <svg viewBox="0 0 360 214" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/*
          Parang: baris-baris lengkung "S" yang miring, dipisah mlinjon (belah
          ketupat kecil). Disederhanakan untuk pita setinggi 10px — yang perlu
          terbaca hanya iramanya yang diagonal.
        */}
        <pattern id="parang" width="14" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M-1 10C2 7 5 8 7 5S11 2 15 0"
            fill="none"
            stroke={FOREST}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M3 1.6 4.6 3.2 3 4.8 1.4 3.2Z" fill={GOLD} />
        </pattern>
        <linearGradient id="parang-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.18" stopColor="#fff" />
          <stop offset="0.82" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="parang-mask">
          <rect x="0" y="198" width="360" height="12" fill="url(#parang-fade)" />
        </mask>
      </defs>

      {/* Isian: massa atap, tiang, dan lantai. */}
      <g data-fill="">
        <g mask="url(#parang-mask)">
          <rect x="0" y="199" width="360" height="10" fill="url(#parang)" opacity="0.7" />
          <path d="M0 198.5H360M0 209.5H360" stroke={GOLD} strokeWidth="0.8" />
        </g>

        {/* Bebatur (lantai) dan tangga. */}
        <rect x="26" y="176" width="308" height="12" fill={TAN} fillOpacity="0.55" />
        <rect x="150" y="188" width="60" height="5" fill={PAPER} />
        <rect x="144" y="193" width="72" height="5" fill={PAPER} />

        {/* Soko guru — di belakang, jadi sedikit lebih gelap. */}
        {SOKO_GURU.map((x) => (
          <rect key={x} x={x - 3.5} y="148" width="7" height="28" fill={FOREST_DEEP} fillOpacity="0.75" />
        ))}
        {PILLARS.map((x) => (
          <g key={x}>
            <rect x={x - 2.5} y="148" width="5" height="28" fill={TIMBER} />
            <path d={`M${x - 2.5} 154h5M${x - 2.5} 168h5`} stroke={GOLD} strokeWidth="1" />
            {/* Umpak — alas batu di kaki tiang. */}
            <path d={`M${x - 5} 176L${x - 3.5} 171H${x + 3.5}L${x + 5} 176Z`} fill={PAPER} />
          </g>
        ))}

        {/* Celah di antara tingkat atap — tempat cahaya masuk di 3D-nya. */}
        <rect x="132" y="82" width="96" height="6" fill={FOREST_DEEP} />
        <rect x="84" y="116" width="192" height="6" fill={FOREST_DEEP} />

        <path d={BRUNJUNG} fill={FOREST} />
        <path d={PENANGGAP} fill={FOREST} />
        <path d={PENITIH} fill={FOREST} />

        {/* Garis sirap — irama horizontal di tiap tingkat atap. */}
        <path
          d="M156 46H204M150 58H210M139 70H221M108 98H252M88 106H272M58 130H302"
          stroke={GOLD}
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />

        {/* Lisplang emas di bawah atap terbawah. */}
        <rect x="22" y="144" width="316" height="4" fill={GOLD} />
        <path d={MUSTAKA} fill={GOLD} />
        <rect x="173" y="30" width="14" height="4" fill={GOLD} />
      </g>

      {/* Garis: yang tergambar lebih dulu. */}
      <g fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round">
        <path data-draw="" pathLength="1" d={MUSTAKA} />
        <path data-draw="" pathLength="1" d={BRUNJUNG} />
        <path data-draw="" pathLength="1" d={PENANGGAP} />
        <path data-draw="" pathLength="1" d={PENITIH} />
        {/* Ujung atap yang melentik. */}
        <path data-draw="" pathLength="1" d="M12 136 6 129M348 136 354 129" />
        <path data-draw="" pathLength="1" d="M26 176H334V188H26Z" />
        <path data-draw="" pathLength="1" d="M150 188H210V193H216V198H144V193H150Z" />
      </g>
    </svg>
  );
}

/* ── tumpang sari ───────────────────────────────────────────────────────── */

// Bingkai yang bertumpuk ke dalam, setengah-sisinya dari luar ke dalam.
const FRAMES = [196, 160, 126, 94, 64];

/**
 * Tumpang sari dilihat dari bawah: bingkai persegi yang bertumpuk makin kecil
 * ke arah puncak, balok sudut yang menyilang, dan bunga teratai di tengahnya —
 * langit-langit yang dibahas section Palace.
 */
export function TumpangSariArt({ className }) {
  const c = 200;
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" focusable="false">
      <g fill={TAN} fillOpacity="0.16" stroke={GOLD} strokeWidth="1.2">
        {FRAMES.map((s) => (
          <path
            key={s}
            fillRule="evenodd"
            d={`M${c - s} ${c - s}H${c + s}V${c + s}H${c - s}Z M${c - s + 9} ${c - s + 9}V${c + s - 9}H${c + s - 9}V${c - s + 9}Z`}
          />
        ))}
      </g>

      {/* Balok sudut, dari bingkai terluar ke yang terdalam. */}
      <path
        d={`M${c - 196} ${c - 196}L${c - 64} ${c - 64}M${c + 196} ${c - 196}L${c + 64} ${c - 64}M${c - 196} ${c + 196}L${c - 64} ${c + 64}M${c + 196} ${c + 196}L${c + 64} ${c + 64}`}
        stroke={GOLD}
        strokeWidth="1.2"
      />

      {/* Belah ketupat di tengah tiap sisi bingkai. */}
      <g fill={GOLD} fillOpacity="0.7">
        {FRAMES.slice(0, -1).map((s) => {
          const m = s - 4.5;
          const d = 4;
          return [
            [c, c - m],
            [c, c + m],
            [c - m, c],
            [c + m, c],
          ].map(([x, y]) => (
            <path key={`${s}-${x}-${y}`} d={`M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`} />
          ));
        })}
      </g>

      {/* Teratai di puncak. */}
      <g fill={GOLD} fillOpacity="0.28" stroke={GOLD} strokeWidth="1">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          const x = c + Math.cos(a) * 24;
          const y = c + Math.sin(a) * 24;
          return (
            <ellipse key={i} cx={x} cy={y} rx="20" ry="7.5" transform={`rotate(${(i * 180) / 4} ${x} ${y})`} />
          );
        })}
      </g>
      <circle cx={c} cy={c} r="44" fill="none" stroke={GOLD} strokeWidth="1" />
      <circle cx={c} cy={c} r="7" fill={GOLD} />
    </svg>
  );
}
