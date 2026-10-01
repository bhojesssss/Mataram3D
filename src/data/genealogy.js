/**
 * Silsilah Wangsa Mataram.
 *
 * Tiap entri array = satu generasi. Generasi dengan dua node adalah pecahan
 * Perjanjian Giyanti 1755, saat satu wangsa jadi dua keraton — komponen tree
 * menggambar palang horizontal begitu sebuah generasi berisi lebih dari satu
 * node, jadi tidak ada flag khusus yang perlu dijaga.
 *
 * `name` dan `court` adalah proper noun — sama di kedua bahasa. `reign` plain
 * string kalau isinya cuma rentang tahun (sama di kedua bahasa); dibungkus
 * `{ id, en }` kalau ada kata seperti "sejak"/"from" atau "w."/"d.". `role`
 * selalu pasangan `{ id, en }`.
 */
export const generations = [
  [
    {
      name: 'Ki Ageng Pemanahan',
      reign: { id: 'w. 1584', en: 'd. 1584' },
      role: { id: 'Menerima hutan Mentaok; bapak pendiri wangsa.', en: 'Received the forest of Mentaok; father of the dynasty.' },
    },
  ],
  [
    {
      name: 'Panembahan Senopati',
      reign: '1587 – 1601',
      role: { id: 'Pendiri Mataram di Kotagede.', en: 'Founder of Mataram at Kotagede.' },
    },
  ],
  [
    {
      name: 'Panembahan Hanyakrawati',
      reign: '1601 – 1613',
      role: { id: 'Mengokohkan kerajaan yang masih muda.', en: 'Consolidated the young kingdom.' },
    },
  ],
  [
    {
      name: 'Sultan Agung',
      reign: '1613 – 1645',
      role: {
        id: 'Zaman keemasan: ekspansi, reformasi kalender, budaya istana.',
        en: 'The golden age: expansion, calendar reform, court culture.',
      },
    },
  ],
  [
    {
      name: 'Amangkurat I',
      reign: '1646 – 1677',
      role: { id: 'Masa pemerintahan yang diperebutkan; istana diguncang pemberontakan.', en: 'A contested reign; the court is shaken by rebellion.' },
    },
  ],
  [
    {
      name: 'Amangkurat II',
      reign: '1677 – 1703',
      role: { id: 'Mendirikan keraton di Kartasura.', en: 'Founded the keraton at Kartasura.' },
    },
  ],
  [
    {
      name: 'Pakubuwono II',
      reign: '1726 – 1749',
      role: { id: 'Memindahkan istana ke Surakarta pada 1745.', en: 'Moved the court to Surakarta in 1745.' },
    },
  ],
  [
    {
      name: 'Pakubuwono III',
      reign: { id: 'sejak 1749', en: 'from 1749' },
      court: 'Kasunanan Surakarta',
      role: {
        id: 'Susuhunan pertama Kasunanan Surakarta setelah Perjanjian Giyanti.',
        en: 'First Susuhunan of the Kasunanan Surakarta after Giyanti.',
      },
    },
    {
      name: 'Hamengkubuwono I',
      reign: { id: 'sejak 1755', en: 'from 1755' },
      court: 'Kasultanan Yogyakarta',
      role: { id: 'Sultan pertama Ngayogyakarta Hadiningrat.', en: 'First Sultan of Ngayogyakarta Hadiningrat.' },
    },
  ],
  [
    {
      name: 'Pakubuwono XIII',
      reign: { id: 'sejak 2004', en: 'since 2004' },
      court: 'Kasunanan Surakarta',
      role: {
        id: 'Susuhunan Surakarta yang bertakhta; penjaga istana dan pusakanya.',
        en: 'Reigning Susuhunan of Surakarta; guardian of the court and its regalia.',
      },
    },
    {
      name: 'GKR Wandansari',
      reign: 'Koes Moertiyah',
      court: 'Kasunanan Surakarta',
      role: { id: 'Pengampu budaya istana dan arsip kerajaan.', en: 'Custodian of court culture and the royal archive.' },
    },
  ],
];
