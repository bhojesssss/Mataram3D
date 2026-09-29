/**
 * Sembilan era di halaman History, 1558–1755.
 *
 * Urutan array = urutan penanda di rail. Menambah era cukup di sini; rail,
 * panel detail, dan navigasi panah semuanya membaca daftar yang sama.
 *
 * Tiap field teks adalah pasangan `{ id, en }`, dipilih lewat `t()`.
 */
export const eras = [
  {
    year: '1558',
    tag: { id: 'Pajang', en: 'Pajang' },
    title: { id: 'Anugerah Hutan Mentaok', en: 'The Grant of Mentaok' },
    image: '/img/historic-illustration.png',
    alt: {
      id: 'Ilustrasi hutan Mentaok yang dianugerahkan Pajang.',
      en: 'Illustration of the forest of Mentaok, granted by Pajang.',
    },
    body: {
      id: 'Sultan Hadiwijaya dari Pajang menganugerahkan hutan Mentaok kepada Ki Ageng Pemanahan sebagai imbalan atas kemenangannya melawan Arya Penangsang. Yang datang adalah belantara; yang pergi, satu generasi kemudian, adalah sebuah kerajaan.',
      en: 'Sultan Hadiwijaya of Pajang grants the forest of Mentaok to Ki Ageng Pemanahan as reward for defeating Arya Penangsang. What arrives is wilderness; what leaves it, a generation later, is a kingdom.',
    },
  },
  {
    year: '1584',
    tag: { id: 'Kotagede', en: 'Kotagede' },
    title: { id: 'Panembahan Senopati', en: 'Panembahan Senopati' },
    image: '/img/keraton-pendopo.png',
    alt: { id: 'Keraton pertama Mataram di Kotagede.', en: "Mataram's first court at Kotagede." },
    body: {
      id: 'Danang Sutawijaya, putra Pemanahan, menyatakan kemerdekaan dari Pajang dan mendirikan pusat kekuasaannya di Kotagede. Legenda kerajaan tentang ikrarnya dengan Kanjeng Ratu Kidul, penguasa laut selatan, bermula di sini — sebuah perjanjian antara takhta dan yang tak kasat mata.',
      en: 'Danang Sutawijaya, son of Pemanahan, declares independence from Pajang and establishes his seat at Kotagede. The royal legend of his covenant with Kanjeng Ratu Kidul, queen of the southern sea, begins here — a compact between the throne and the unseen.',
    },
  },
  {
    year: '1613',
    tag: { id: 'Zaman Keemasan', en: 'Golden Age' },
    title: { id: 'Sultan Agung Naik Takhta', en: 'Sultan Agung Ascends' },
    image: '/img/royal-couple.png',
    alt: {
      id: 'Potret pasangan bangsawan Mataram pada masa Sultan Agung.',
      en: "Portrait of a Mataram noble couple in Sultan Agung's era.",
    },
    body: {
      id: 'Sultan Agung Hanyakrakusuma naik takhta dan menjadikan Mataram kekuatan dominan di Jawa. Di bawahnya, istana menjadi bukan hanya pusat pemerintahan, tetapi juga standar bahasa, tata krama, dan seni Jawa.',
      en: 'Sultan Agung Hanyakrakusuma takes the throne and turns Mataram into the dominant power of Java. Under him the court becomes not only a seat of government but the standard of Javanese language, etiquette, and art.',
    },
  },
  {
    year: '1628',
    tag: { id: 'Ekspansi', en: 'Expansion' },
    title: { id: 'Pengepungan Batavia', en: 'The Siege of Batavia' },
    image: '/img/historic-illustration.png',
    alt: { id: 'Ilustrasi pengepungan Batavia oleh pasukan Mataram.', en: "Illustration of Mataram's forces besieging Batavia." },
    body: {
      id: 'Dua kali Sultan Agung mengirim pasukannya menyerang benteng VOC di Batavia. Kotanya bertahan, tapi kampanye ini menandai saat kerajaan mendefinisikan dirinya berhadapan dengan kekuatan asing di pesisirnya sendiri.',
      en: 'Twice Sultan Agung sends his armies against the VOC stronghold at Batavia. The city holds, but the campaigns mark the moment the kingdom defines itself against a foreign power on its own coast.',
    },
  },
  {
    year: '1633',
    tag: { id: 'Reformasi', en: 'Reform' },
    title: { id: 'Kalender Jawa', en: 'The Javanese Calendar' },
    image: '/img/manuscript.png',
    alt: { id: 'Naskah kuno berisi perhitungan kalender Jawa.', en: 'Ancient manuscript recording the Javanese calendar reckoning.' },
    body: {
      id: 'Sultan Agung menggabungkan penanggalan Saka Hindu-Jawa dengan kalender lunar Islam, menciptakan Anno Javanico yang masih dipakai untuk upacara istana hingga kini. Ini adalah warisannya yang paling abadi: satu ukuran waktu untuk dua warisan.',
      en: 'Sultan Agung merges the Hindu-Javanese Saka reckoning with the Islamic lunar calendar, creating the Anno Javanico still used for court ceremony. It is his most enduring act: a single measure of time for two inheritances.',
    },
  },
  {
    year: '1645',
    tag: { id: 'Suksesi', en: 'Succession' },
    title: { id: 'Imogiri', en: 'Imogiri' },
    image: '/img/pendopo-interior.png',
    alt: { id: 'Interior pendopo pemakaman raja-raja di Imogiri.', en: "Interior of the royal burial pavilion at Imogiri." },
    body: {
      id: 'Sultan Agung wafat dan disemayamkan di Imogiri, bukit pemakaman yang ia bangun untuk wangsanya. Para penguasa Surakarta maupun Yogyakarta masih dimakamkan di sana — satu-satunya tempat wangsa yang terbelah itu tetap utuh.',
      en: 'Sultan Agung dies and is laid to rest at Imogiri, the burial hill he built for his line. Rulers of both Surakarta and Yogyakarta are still interred there — the one place the divided house remains whole.',
    },
  },
  {
    year: '1680',
    tag: { id: 'Perpindahan', en: 'Relocation' },
    title: { id: 'Kartasura', en: 'Kartasura' },
    image: '/img/keraton-pendopo.png',
    alt: { id: 'Keraton Kartasura di pedalaman Jawa.', en: 'The court of Kartasura in inland Java.' },
    body: {
      id: 'Setelah pemberontakan memaksa Plered ditinggalkan, Amangkurat II mendirikan keraton baru di Kartasura. Satu abad berikutnya diwarnai perebutan suksesi dan keterlibatan Belanda yang kian dalam di urusan istana.',
      en: 'After rebellion forces the abandonment of Plered, Amangkurat II founds a new keraton at Kartasura. The century that follows is one of contested succession and deepening Dutch involvement in court affairs.',
    },
  },
  {
    year: '1745',
    tag: { id: 'Pendirian', en: 'Foundation' },
    title: { id: 'Surakarta Hadiningrat', en: 'Surakarta Hadiningrat' },
    image: '/img/gamelan.png',
    alt: { id: 'Gamelan pusaka keraton Surakarta.', en: 'Heirloom gamelan of the Surakarta court.' },
    body: {
      id: 'Pakubuwono II memindahkan istana dari Kartasura yang porak-poranda ke Desa Sala di tepi Bengawan Solo. Keraton baru ini ditata mengikuti sumbu kosmologis lama — laut di selatan, gunung di utara.',
      en: 'Pakubuwono II moves the court from ruined Kartasura to the village of Sala on the Bengawan Solo. The new keraton is laid out on the old cosmological axis — sea to the south, mountain to the north.',
    },
  },
  {
    year: '1755',
    tag: { id: 'Pembagian', en: 'Division' },
    title: { id: 'Perjanjian Giyanti', en: 'The Treaty of Giyanti' },
    image: '/img/manuscript.png',
    alt: { id: 'Naskah Perjanjian Giyanti yang membagi Mataram.', en: 'The Giyanti treaty document that divided Mataram.' },
    body: {
      id: 'Perjanjian ini membagi Mataram menjadi Kasunanan Surakarta dan Kasultanan Ngayogyakarta. Dua istana, satu warisan: sejak titik ini budayanya dibawa maju secara paralel, masing-masing menjaga versinya sendiri dari ingatan yang sama.',
      en: 'The treaty divides Mataram into Kasunanan Surakarta and Kasultanan Ngayogyakarta. Two courts, one inheritance: from this point the culture is carried forward in parallel, each keeping its own version of the same memory.',
    },
  },
];

/** Situs bersejarah di bagian bawah halaman History. */
export const historicPlaces = [
  {
    title: 'Kotagede',
    meta: { id: 'Pusat pertama Mataram, 1584', en: 'The first seat of Mataram, 1584' },
    image: '/img/keraton-pendopo.png',
    alt: { id: 'Situs Kotagede.', en: 'The Kotagede site.' },
  },
  {
    title: 'Imogiri',
    meta: { id: 'Makam keramat wangsa', en: 'Royal necropolis of the dynasty' },
    image: '/img/imogiri.png',
    alt: { id: 'Kompleks pemakaman raja di Imogiri.', en: 'The royal burial complex at Imogiri.' },
  },
  {
    title: 'Kartasura',
    meta: { id: 'Istana pedalaman, 1680 – 1745', en: 'The inland court, 1680 – 1745' },
    image: '/img/historic-illustration.png',
    alt: { id: 'Reruntuhan keraton Kartasura.', en: 'Ruins of the Kartasura court.' },
  },
  {
    title: 'Surakarta',
    meta: { id: 'Keraton di tepi Bengawan Solo', en: 'The keraton on the Bengawan Solo' },
    image: '/img/surakarta.png',
    alt: { id: 'Keraton Surakarta di tepi Bengawan Solo.', en: 'Keraton Surakarta on the banks of the Bengawan Solo.' },
  },
];
