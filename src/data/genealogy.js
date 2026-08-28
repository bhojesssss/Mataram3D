/**
 * Silsilah Wangsa Mataram.
 *
 * Tiap entri array = satu generasi. Generasi dengan dua node adalah pecahan
 * Perjanjian Giyanti 1755, saat satu wangsa jadi dua keraton — komponen tree
 * menggambar palang horizontal begitu sebuah generasi berisi lebih dari satu
 * node, jadi tidak ada flag khusus yang perlu dijaga.
 */
export const generations = [
  [{ name: 'Ki Ageng Pemanahan', reign: 'd. 1584', role: 'Received the forest of Mentaok; father of the dynasty.' }],
  [{ name: 'Panembahan Senopati', reign: '1587 – 1601', role: 'Founder of Mataram at Kotagede.' }],
  [{ name: 'Panembahan Hanyakrawati', reign: '1601 – 1613', role: 'Consolidated the young kingdom.' }],
  [{ name: 'Sultan Agung', reign: '1613 – 1645', role: 'The golden age: expansion, calendar reform, court culture.' }],
  [{ name: 'Amangkurat I', reign: '1646 – 1677', role: 'A contested reign; the court is shaken by rebellion.' }],
  [{ name: 'Amangkurat II', reign: '1677 – 1703', role: 'Founded the keraton at Kartasura.' }],
  [{ name: 'Pakubuwono II', reign: '1726 – 1749', role: 'Moved the court to Surakarta in 1745.' }],
  [
    {
      name: 'Pakubuwono III',
      reign: 'from 1749',
      court: 'Kasunanan Surakarta',
      role: 'First Susuhunan of the Kasunanan Surakarta after Giyanti.',
    },
    {
      name: 'Hamengkubuwono I',
      reign: 'from 1755',
      court: 'Kasultanan Yogyakarta',
      role: 'First Sultan of Ngayogyakarta Hadiningrat.',
    },
  ],
  [
    {
      name: 'Pakubuwono XIII',
      reign: 'since 2004',
      court: 'Kasunanan Surakarta',
      role: 'Reigning Susuhunan of Surakarta; guardian of the court and its regalia.',
    },
    {
      name: 'GKR Wandansari',
      reign: 'Koes Moertiyah',
      court: 'Kasunanan Surakarta',
      role: 'Custodian of court culture and the royal archive.',
    },
  ],
];
