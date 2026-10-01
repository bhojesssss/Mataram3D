/**
 * Ruang-ruang keraton, urut dari utara ke selatan.
 *
 * `area` adalah penempatan di denah skematik (grid 3 kolom × 7 baris) dan
 * ditulis sebagai class Tailwind arbitrer supaya letak di denah dan isi panel
 * deskripsinya bersumber dari satu entri.
 *
 * `small` untuk ruang yang kotaknya sempit di denah — labelnya diperkecil.
 *
 * `label` dan `name` adalah nama tempat — proper noun, sama di kedua bahasa.
 * `gloss` (arti harfiah/istilah pendamping) dan `desc` adalah pasangan
 * `{ id, en }`.
 */
export const spaces = [
  {
    id: 'alun-lor',
    label: 'Alun-Alun Lor',
    gloss: { id: 'Alun-Alun Utara', en: 'The Northern Square' },
    name: 'Alun-Alun Lor',
    area: '[grid-area:1/1/2/4]',
    desc: {
      id: 'Lapangan terbuka besar di depan istana, dijaga sepasang pohon beringin. Setiap kunjungan ke keraton dimulai dengan menyeberanginya dengan berjalan kaki.',
      en: 'The great open ground before the palace, guarded by twin banyan trees. Every approach to the keraton begins by crossing it on foot.',
    },
  },
  {
    id: 'pagelaran',
    label: 'Pagelaran',
    gloss: { id: 'Balai Sidang', en: 'Hall of Assembly' },
    name: 'Pagelaran',
    area: '[grid-area:2/1/3/4]',
    desc: {
      id: 'Balai beratap terbuka berpilar tempat para pejabat dahulu berkumpul sebelum menghadap. Deretan pilarnya menghitung tingkatan di istana.',
      en: 'An open pillared hall where officials once gathered before audience. Its columns count the ranks of the court.',
    },
  },
  {
    id: 'sitihinggil',
    label: 'Sitihinggil Lor',
    gloss: { id: 'Tanah Tinggi', en: 'The Elevated Ground' },
    name: 'Sitihinggil Lor',
    area: '[grid-area:3/1/4/4]',
    desc: {
      id: 'Secara harfiah "tanah tinggi" — panggung yang ditinggikan untuk penobatan dan upacara kenegaraan paling khidmat.',
      en: 'Literally “high earth” — the raised platform used for coronations and the most solemn state ceremonies.',
    },
  },
  {
    id: 'kori',
    label: 'Kori Kamandungan',
    gloss: { id: 'Gerbang Utama', en: 'The Principal Gate' },
    name: 'Kori Kamandungan',
    area: '[grid-area:4/1/5/4]',
    small: true,
    desc: {
      id: 'Ambang batas antara dunia publik dan istana bagian dalam. Melewatinya, protokol berubah sepenuhnya.',
      en: 'The threshold between the public world and the inner court. Beyond it, protocol changes entirely.',
    },
  },
  {
    id: 'pustaka',
    label: 'Sasana Pustaka',
    gloss: { id: 'Perpustakaan Kerajaan', en: 'Royal Library' },
    name: 'Sasana Pustaka',
    area: '[grid-area:5/1/6/2]',
    small: true,
    desc: {
      id: 'Menyimpan naskah, babad, dan silsilah — ingatan tertulis wangsa ini.',
      en: 'Home to manuscripts, chronicles, and genealogies — the written memory of the dynasty.',
    },
  },
  {
    id: 'pendopo',
    label: 'Pendopo\nSasana Sewaka',
    gloss: { id: 'Pendopo Agung', en: 'The Great Pavilion' },
    name: 'Pendopo Sasana Sewaka',
    area: '[grid-area:5/2/7/3]',
    desc: {
      id: 'Ruang terbuka utama istana, tempat menerima tamu dan menggelar upacara. Terbuka di semua sisi: istana tak menyembunyikan apa pun dari yang disambutnya.',
      en: 'The main open hall of the keraton, where the court receives guests and holds ceremony. Open on all sides: the palace has nothing to hide from those it welcomes.',
    },
  },
  {
    id: 'kaputren',
    label: 'Kaputren',
    gloss: { id: 'Kediaman Putri', en: 'The Women’s Quarters' },
    name: 'Kaputren',
    area: '[grid-area:5/3/6/4]',
    small: true,
    desc: {
      id: 'Kediaman para putri dan perempuan istana, sekaligus bengkel tempat batik istana digambar.',
      en: 'The residence of the princesses and ladies of the court, and the workshop where court batik is drawn.',
    },
  },
  {
    id: 'tamansari',
    label: 'Taman Sari',
    gloss: { id: 'Taman Air', en: 'The Water Garden' },
    name: 'Taman Sari',
    area: '[grid-area:6/1/7/2]',
    small: true,
    desc: {
      id: 'Kolam pemandian dan paviliun di antara air — tempat merenung, sekaligus pelajaran tentang keheningan.',
      en: 'Bathing pools and pavilions set among water — a retreat, and a lesson in stillness.',
    },
  },
  {
    id: 'kencana',
    label: 'Bangsal Kencana',
    gloss: { id: 'Balai Emas', en: 'The Golden Hall' },
    name: 'Bangsal Kencana',
    area: '[grid-area:6/3/7/4]',
    small: true,
    desc: {
      id: 'Balai singgasana berlapis emas di jantung kompleks, khusus untuk sang penguasa.',
      en: 'The gilded throne hall at the heart of the compound, reserved for the sovereign.',
    },
  },
  {
    id: 'alun-kidul',
    label: 'Alun-Alun Kidul',
    gloss: { id: 'Alun-Alun Selatan', en: 'The Southern Square' },
    name: 'Alun-Alun Kidul',
    area: '[grid-area:7/1/8/4]',
    desc: {
      id: 'Lapangan selatan, menghadap laut. Ia menutup sumbu yang membentang dari gunung ke laut melalui singgasana.',
      en: 'The southern ground, facing the sea. It closes the axis that runs from mountain to ocean through the throne.',
    },
  },
];

export const palaceNotes = [
  {
    title: { id: 'Sumbu Kosmologis', en: 'The Axis' },
    body: {
      id: 'Gunung Merapi di utara, laut selatan di ujung lain. Keraton berdiri tepat di garis antara keduanya, dan setiap gerbang mengulang orientasi itu.',
      en: 'Mount Merapi to the north, the southern sea beyond. The keraton sits on the line between them, and every gate repeats that orientation.',
    },
  },
  {
    title: { id: 'Warna & Kain', en: 'Colour & Cloth' },
    body: {
      id: 'Motif batik tertentu — termasuk parang barong — dulu hanya untuk sang penguasa. Apa yang dikenakan seseorang di dalam tembok ini menyatakan persis di mana ia berdiri.',
      en: 'Certain batik patterns — parang barong among them — were reserved for the sovereign. What a person wore inside these walls stated exactly where they stood.',
    },
  },
  {
    title: { id: 'Abdi Dalem', en: 'Abdi Dalem' },
    body: {
      id: 'Para abdi istana yang menjaga kompleks, upacara, dan gamelan. Banyak yang mengabdi seumur hidup, dan keluarga mereka turun-temurun.',
      en: 'The court servants who keep the compound, the ceremonies, and the gamelan. Many serve for life, and their families for generations.',
    },
  },
];
