/** Koleksi Royal Archive. */
export const records = [
  { cat: 'People', era: '1613 – 1645', title: 'Sultan Agung Hanyakrakusuma', sub: 'Portrait and regnal record', image: '/img/royal-couple.png' },
  { cat: 'Documents', era: '1742', title: 'Serat Babad Tanah Jawi', sub: 'Chronicle manuscript, palm leaf', image: '/img/manuscript.png' },
  { cat: 'Artifacts', era: '18th c.', title: 'Gamelan Kyai Guntur Madu', sub: 'Ceremonial bronze ensemble', image: '/img/gamelan.png' },
  { cat: 'Places', era: 'Founded 1745', title: 'Keraton Surakarta', sub: 'Palace compound, Baluwarti', image: '/img/keraton-pendopo.png' },
  { cat: 'Artifacts', era: '19th c.', title: 'Batik Parang Barong', sub: 'Forbidden pattern, court use only', image: '/img/batik.png' },
  { cat: 'Events', era: '1755', title: 'Treaty of Giyanti', sub: 'Division of the realm', image: '/img/historic-illustration.png' },
  { cat: 'People', era: 'd. 1584', title: 'Ki Ageng Pemanahan', sub: 'Founder of the line', image: '/img/pemanahan.png' },
  { cat: 'Places', era: 'from 1584', title: 'Kotagede', sub: 'First seat of Mataram', image: '/img/kotagede.png' },
  { cat: 'Events', era: '1628 – 1629', title: 'The Siege of Batavia', sub: 'Campaign against the VOC', image: '/img/batavia.png' },
  { cat: 'Documents', era: '1633', title: 'Anno Javanico Decree', sub: 'Calendar reform of Sultan Agung', image: '/img/calendar-decree.png' },
  { cat: 'Artifacts', era: '17th c.', title: 'Kris Kyai Ageng Kopek', sub: 'Royal heirloom blade', image: '/img/kris.png' },
  { cat: 'Places', era: 'from 1645', title: 'Imogiri', sub: 'Royal necropolis', image: '/img/imogiri.png' },
  { cat: 'People', era: 'since 2004', title: 'Pakubuwono XIII', sub: 'Reigning Susuhunan', image: '/img/pakubuwono-xiii.png' },
  { cat: 'Events', era: 'Annual', title: 'Grebeg Maulud', sub: 'Court procession and offering', image: '/img/grebeg.png' },
  { cat: 'Documents', era: '1830', title: 'Serat Centhini, vol. IV', sub: 'Encyclopaedic Javanese verse', image: '/img/centhini.png' },
];

/**
 * Urutan chip filter. Ditulis manual, bukan diturunkan dari `records`, karena
 * urutannya editorial — orang, tempat, peristiwa, lalu benda — bukan urutan
 * kemunculan pertama di daftar koleksi.
 */
export const categories = ['All', 'People', 'Places', 'Events', 'Artifacts', 'Documents'];
