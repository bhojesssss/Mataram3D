/**
 * Ruang-ruang keraton, urut dari utara ke selatan.
 *
 * `area` adalah penempatan di denah skematik (grid 3 kolom × 7 baris) dan
 * ditulis sebagai class Tailwind arbitrer supaya letak di denah dan isi panel
 * deskripsinya bersumber dari satu entri.
 *
 * `accent` menandai dua ruang yang punya bobot bahkan saat tidak dipilih:
 * 'gate' untuk gerbang ambang, 'heart' untuk pendopo di jantung kompleks.
 */
export const spaces = [
  {
    id: 'alun-lor',
    label: 'Alun-Alun Lor',
    en: 'The Northern Square',
    name: 'Alun-Alun Lor',
    area: '[grid-area:1/1/2/4]',
    desc: 'The great open ground before the palace, guarded by twin banyan trees. Every approach to the keraton begins by crossing it on foot.',
  },
  {
    id: 'pagelaran',
    label: 'Pagelaran',
    en: 'Hall of Assembly',
    name: 'Pagelaran',
    area: '[grid-area:2/1/3/4]',
    desc: 'An open pillared hall where officials once gathered before audience. Its columns count the ranks of the court.',
  },
  {
    id: 'sitihinggil',
    label: 'Sitihinggil Lor',
    en: 'The Elevated Ground',
    name: 'Sitihinggil Lor',
    area: '[grid-area:3/1/4/4]',
    desc: 'Literally “high earth” — the raised platform used for coronations and the most solemn state ceremonies.',
  },
  {
    id: 'kori',
    label: 'Kori Kamandungan',
    en: 'The Principal Gate',
    name: 'Kori Kamandungan',
    area: '[grid-area:4/1/5/4]',
    accent: 'gate',
    desc: 'The threshold between the public world and the inner court. Beyond it, protocol changes entirely.',
  },
  {
    id: 'pustaka',
    label: 'Sasana Pustaka',
    en: 'Royal Library',
    name: 'Sasana Pustaka',
    area: '[grid-area:5/1/6/2]',
    small: true,
    desc: 'Home to manuscripts, chronicles, and genealogies — the written memory of the dynasty.',
  },
  {
    id: 'pendopo',
    label: 'Pendopo\nSasana Sewaka',
    en: 'The Great Pavilion',
    name: 'Pendopo Sasana Sewaka',
    area: '[grid-area:5/2/7/3]',
    accent: 'heart',
    desc: 'The main open hall of the keraton, where the court receives guests and holds ceremony. Open on all sides: the palace has nothing to hide from those it welcomes.',
  },
  {
    id: 'kaputren',
    label: 'Kaputren',
    en: 'The Women’s Quarters',
    name: 'Kaputren',
    area: '[grid-area:5/3/6/4]',
    small: true,
    desc: 'The residence of the princesses and ladies of the court, and the workshop where court batik is drawn.',
  },
  {
    id: 'tamansari',
    label: 'Taman Sari',
    en: 'The Water Garden',
    name: 'Taman Sari',
    area: '[grid-area:6/1/7/2]',
    small: true,
    desc: 'Bathing pools and pavilions set among water — a retreat, and a lesson in stillness.',
  },
  {
    id: 'kencana',
    label: 'Bangsal Kencana',
    en: 'The Golden Hall',
    name: 'Bangsal Kencana',
    area: '[grid-area:6/3/7/4]',
    small: true,
    desc: 'The gilded throne hall at the heart of the compound, reserved for the sovereign.',
  },
  {
    id: 'alun-kidul',
    label: 'Alun-Alun Kidul',
    en: 'The Southern Square',
    name: 'Alun-Alun Kidul',
    area: '[grid-area:7/1/8/4]',
    desc: 'The southern ground, facing the sea. It closes the axis that runs from mountain to ocean through the throne.',
  },
];

export const palaceNotes = [
  {
    title: 'The Axis',
    body: 'Mount Merapi to the north, the southern sea beyond. The keraton sits on the line between them, and every gate repeats that orientation.',
  },
  {
    title: 'Colour & Cloth',
    body: 'Certain batik patterns — parang barong among them — were reserved for the sovereign. What a person wore inside these walls stated exactly where they stood.',
  },
  {
    title: 'Abdi Dalem',
    body: 'The court servants who keep the compound, the ceremonies, and the gamelan. Many serve for life, and their families for generations.',
  },
];
