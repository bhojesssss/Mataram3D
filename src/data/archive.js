/**
 * Koleksi Royal Archive.
 *
 * `cat` tetap kunci kanonik (Inggris) — dipakai untuk penyaringan, bukan
 * ditampilkan langsung. Label yang tampil di chip dan badge kartu diambil
 * dari `categoryLabels` di bawah lewat `t()`. `title`/`sub` adalah pasangan
 * `{ id, en }`; `era` proper/angka jadi sama di kedua bahasa.
 */
export const records = [
  {
    cat: 'People',
    era: '1613 – 1645',
    title: { id: 'Sultan Agung Hanyakrakusuma', en: 'Sultan Agung Hanyakrakusuma' },
    sub: { id: 'Potret dan catatan pemerintahan', en: 'Portrait and regnal record' },
    image: '/img/royal-couple.png',
  },
  {
    cat: 'Documents',
    era: '1742',
    title: { id: 'Serat Babad Tanah Jawi', en: 'Serat Babad Tanah Jawi' },
    sub: { id: 'Naskah babad, daun lontar', en: 'Chronicle manuscript, palm leaf' },
    image: '/img/manuscript.png',
  },
  {
    cat: 'Artifacts',
    era: '18th c.',
    title: { id: 'Gamelan Kyai Guntur Madu', en: 'Gamelan Kyai Guntur Madu' },
    sub: { id: 'Perangkat gamelan perunggu upacara', en: 'Ceremonial bronze ensemble' },
    image: '/img/gamelan.png',
  },
  {
    cat: 'Places',
    era: { id: 'Berdiri 1745', en: 'Founded 1745' },
    title: { id: 'Keraton Surakarta', en: 'Keraton Surakarta' },
    sub: { id: 'Kompleks istana, Baluwarti', en: 'Palace compound, Baluwarti' },
    image: '/img/keraton-pendopo.png',
  },
  {
    cat: 'Artifacts',
    era: '19th c.',
    title: { id: 'Batik Parang Barong', en: 'Batik Parang Barong' },
    sub: { id: 'Motif terlarang, khusus istana', en: 'Forbidden pattern, court use only' },
    image: '/img/batik.png',
  },
  {
    cat: 'Events',
    era: '1755',
    title: { id: 'Perjanjian Giyanti', en: 'Treaty of Giyanti' },
    sub: { id: 'Pembagian wilayah kerajaan', en: 'Division of the realm' },
    image: '/img/historic-illustration.png',
  },
  {
    cat: 'People',
    era: { id: 'w. 1584', en: 'd. 1584' },
    title: { id: 'Ki Ageng Pemanahan', en: 'Ki Ageng Pemanahan' },
    sub: { id: 'Bapak pendiri wangsa', en: 'Founder of the line' },
    image: '/img/pemanahan.png',
  },
  {
    cat: 'Places',
    era: { id: 'sejak 1584', en: 'from 1584' },
    title: { id: 'Kotagede', en: 'Kotagede' },
    sub: { id: 'Pusat pertama Mataram', en: 'First seat of Mataram' },
    image: '/img/kotagede.png',
  },
  {
    cat: 'Events',
    era: '1628 – 1629',
    title: { id: 'Pengepungan Batavia', en: 'The Siege of Batavia' },
    sub: { id: 'Kampanye melawan VOC', en: 'Campaign against the VOC' },
    image: '/img/batavia.png',
  },
  {
    cat: 'Documents',
    era: '1633',
    title: { id: 'Dekret Anno Javanico', en: 'Anno Javanico Decree' },
    sub: { id: 'Reformasi kalender Sultan Agung', en: "Calendar reform of Sultan Agung" },
    image: '/img/calendar-decree.png',
  },
  {
    cat: 'Artifacts',
    era: '17th c.',
    title: { id: 'Keris Kyai Ageng Kopek', en: 'Kris Kyai Ageng Kopek' },
    sub: { id: 'Pusaka bilah keraton', en: 'Royal heirloom blade' },
    image: '/img/kris.png',
  },
  {
    cat: 'Places',
    era: { id: 'sejak 1645', en: 'from 1645' },
    title: { id: 'Imogiri', en: 'Imogiri' },
    sub: { id: 'Makam keramat wangsa', en: 'Royal necropolis' },
    image: '/img/imogiri.png',
  },
  {
    cat: 'People',
    era: { id: 'sejak 2004', en: 'since 2004' },
    title: { id: 'Pakubuwono XIII', en: 'Pakubuwono XIII' },
    sub: { id: 'Susuhunan yang bertakhta', en: 'Reigning Susuhunan' },
    image: '/img/pakubuwono-xiii.png',
  },
  {
    cat: 'Events',
    era: { id: 'Tahunan', en: 'Annual' },
    title: { id: 'Grebeg Maulud', en: 'Grebeg Maulud' },
    sub: { id: 'Kirab dan sedekah istana', en: 'Court procession and offering' },
    image: '/img/grebeg.png',
  },
  {
    cat: 'Documents',
    era: '1830',
    title: { id: 'Serat Centhini, jilid IV', en: 'Serat Centhini, vol. IV' },
    sub: { id: 'Puisi ensiklopedis Jawa', en: 'Encyclopaedic Javanese verse' },
    image: '/img/centhini.png',
  },
];

/**
 * Urutan chip filter. Ditulis manual, bukan diturunkan dari `records`, karena
 * urutannya editorial — orang, tempat, peristiwa, lalu benda — bukan urutan
 * kemunculan pertama di daftar koleksi. Kunci ini juga dipakai sebagai kunci
 * kanonik penyaringan; jangan diterjemahkan langsung, pakai `categoryLabels`.
 */
export const categories = ['All', 'People', 'Places', 'Events', 'Artifacts', 'Documents'];

/** Label tampil untuk tiap kunci kategori. */
export const categoryLabels = {
  All: { id: 'Semua', en: 'All' },
  People: { id: 'Tokoh', en: 'People' },
  Places: { id: 'Tempat', en: 'Places' },
  Events: { id: 'Peristiwa', en: 'Events' },
  Artifacts: { id: 'Artefak', en: 'Artifacts' },
  Documents: { id: 'Dokumen', en: 'Documents' },
};
