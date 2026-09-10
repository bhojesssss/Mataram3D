# MATARAM — The Royal Heritage

Digital heritage experience Istana Mataram. React + Tailwind, dengan homepage
Three.js + scroll-driven camera. Dibangun dari `referensi/` (moodboard + PDF
content structure).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

---

## ⚠️ Status asset Higgsfield

**Belum ada satu pun asset yang di-generate di Higgsfield.** Akun yang tersambung
punya **0 credit** (`balance` → `{"credits": 0, "subscription_plan_type": "free"}`),
`unlim.available: false`, dan generate termurah butuh 2 credit.

Semua geometri 3D di halaman ini **di-author procedural di three.js**, bukan hasil
generate. Situsnya lengkap dan jalan tanpa Higgsfield.

Kalau credit sudah ada, lihat `src/config/assets.manifest.js` — tiap slot sudah berisi
prompt siap pakai, pilihan model, dan target polycount. Alurnya:

1. `generate_image` pakai `imagePrompt` slot tersebut
2. `generate_3d` (`image_to_3d` atau `multi_image_to_3d`) dari job_id-nya
3. Taruh GLB di `public/models/`, isi `file`, set `enabled: true`

Tidak ada file lain yang perlu diubah — `hydrateAssets()` otomatis menukar
stand-in procedural-nya, dan GLTFLoader di-import lazy jadi build sekarang tidak
membawanya.

**Catatan CLI:** `higgsfield auth login` juga belum pernah selesai — masih
`Not authenticated`. Yang tersambung itu MCP server, bukan CLI. Jalankan
`! higgsfield auth login` kalau butuh CLI-nya.

---

## Arsitektur

**React 19 + React Router 7 + Tailwind 4, di atas Vite.** Three.js-nya tidak
disentuh konversi — semua di `src/scene/` masih kelas JS biasa; React hanya
mengurus daur hidupnya lewat `<Scene3D>`.

```
src/
├── main.jsx                 createRoot + BrowserRouter
├── App.jsx                  peta route
├── index.css                @theme Tailwind (palet, font, easing, keyframes)
├── data/                    seluruh isi editorial — era, silsilah, ruang, arsip
├── pages/                   Home, History, RoyalHouse, Palace, Archive, About
├── components/
│   ├── layout/              SiteLayout, Nav, MobileMenu, Footer
│   ├── home/                Scene3D, Loader, HomeBackdrop
│   └── ui/                  Wrap, Frame, Chip, Reveal, HashLink, Type, Page
├── hooks/                   usePageMeta, useReveal
├── config/
│   ├── tokens.js            palette, font, beat table + resolveBeats()
│   └── assets.manifest.js   slot Higgsfield (semua disabled)
├── scene/
│   ├── Scene.js             renderer, lighting schedule, frame loop
│   ├── Pendopo.js           joglo procedural (soko guru, tumpang sari, atap)
│   ├── Environment.js       langit, ridge Merapi, tree ring, mist
│   ├── Particles.js         debu, GPU-animated
│   ├── CameraRig.js         spline kamera + damping
│   └── textures.js          canvas texture (batik, jati, batu, sirap)
└── scroll/
    ├── ScrollController.js  Lenis + GSAP, satu-satunya sumber progress
    └── scrollBus.js         jembatan tipis ke React (progress + scrollToHash)
```

**Konten hidup di `src/data/`, bukan di markup.** Sembilan era History, sembilan
generasi silsilah, sepuluh ruang keraton, dan lima belas record arsip dulunya
ditulis satu per satu di HTML. Sekarang masing-masing satu array, dan komponennya
merender daftar itu. Menambah era cukup satu entri — rail, panel detail, dan
navigasi panah semuanya ikut.

**`scrollBus.js` menjaga batas React.** ScrollController itu imperatif dan hidup
di luar React. Dulu ia menyentuh DOM langsung — `nav.classList.toggle('is-solid')`
dan listener klik global untuk anchor. Sekarang ia menerbitkan progress ke sebuah
store kecil yang navbar-nya berlangganan, dan `<HashLink>` yang meminta geseran.
React tetap satu-satunya yang menulis ke DOM-nya sendiri.

### Yang penting dipahami sebelum mengubah

**1. Beat diukur dari DOM, bukan di-hardcode.**
`resolveBeats()` di `tokens.js` mengukur posisi tiap `[data-section]` dan
menghasilkan tabel beat. `beatSections` menentukan pasangan editorialnya — kamera
harus ada di bawah atap saat pembaca di section Palace, bukan di angka 0.40 yang
kebetulan. Tinggi section boleh berubah bebas tanpa tuning ulang.

Yang mau diubah biasanya `beatSections`, bukan angka fallback di `beats`.

**2. Geometri dan jadwal dipisah.**
`CAMERA_PATH` (CameraRig) dan `LIGHT_PATH` (Scene) menyimpan *bentuk* — posisi,
look-at, fov, warna cahaya. *Kapan*-nya datang dari `retime(beatTable)`. Keduanya
dipanggil ulang saat resize.

**3. Scrim itu kurva, bukan konstanta.**
`SCRIM_PATH` di ScrollController sengaja ekstrem di dua arah: 3D penuh di hero dan
di Palace (0.10), cream bersih di section teks (0.84+). Nilai tengah menghasilkan
render kelabu yang teksnya tetap susah dibaca — sudah dicoba, hasilnya buruk.
Turunnya ke 0.10 di beat `interior` itu reveal-nya.

**4. `squareFrustum` default `openEnded: true`.**
Jangan diubah. Frustum bertutup itu solid — tutup bawah tiap tingkat atap jadi
slab selebar pendopo tepat di atas kepala, dan kamera di dalam cuma melihat bagian
bawahnya, bukan tumpang sari. Material atap juga `DoubleSide` karena alasan yang
sama.

**5. Tiap tingkat atap punya material sendiri.**
Bukan boros — memang harus. Satu tingkat itu panjang mengelilingi tapi pendek ke
arah kemiringan (penitih: keliling ~130 unit, pitch 2.4 unit). UV repeat apa pun
yang benar di satu sumbu pasti salah jauh di sumbu lain, dan hasilnya sirap
menghilang jadi warna rata. `_roofMaterialFor()` menghitung repeat dari ukuran
sirap dunia-nyata yang ditarget, jadi kursnya sama besar di ketiga tingkat.

**6. Kolom, usuk, dan balustrade pakai InstancedMesh.**
Versi awal bikin 3 geometri baru per kolom — 150 geometri dan 150 draw call untuk
50 kolom, dan itu menghabiskan budget sebelum detailnya sempat ditambah. Sekarang
satu InstancedMesh per bagian per ring. Kalau mau menambah detail kolom, tambahkan
entri di array `parts` dalam `_pillarRing()` — biayanya satu draw call, bukan satu
per kolom.

Anggaran saat ini: **163 draw call / 323k segitiga / ~10.6ms per frame**
(115 geometri, 41 tekstur). Pohon pakai LOD tiga tingkat — subdivisi ikosahedron
2 / 1 / 0 dari ring dekat ke jauh — karena tanpa itu 124 pohon berdetail penuh
saja sudah lebih dari 3 juta segitiga.

**7. Realisme datang dari shading, bukan dari jumlah poligon.**
Poligon cuma mengontrol siluet. Semua yang ada *di dalam* siluet itu shading, dan
permukaan dengan normal rata akan terbaca seperti kartu dicat berapa pun
segitiganya. Urutan pengungkitnya, dari yang paling besar:

- **Normal + roughness map** (`textures.js`). Diturunkan dari albedo-nya sendiri
  lewat Sobel, jadi relief tidak mungkin melenceng dari warnanya. Ini yang bikin
  sirap, nat batu, dan serat kayu punya kedalaman.
- **`scene.environment`** — probe IBL di-prefilter dari shader langit itu sendiri.
  Tanpa ini logam tidak punya apa pun untuk dipantulkan dan emas terbaca sebagai
  plastik berwarna.
- **Smooth shading.** `flatShading: true` pada pohon adalah penanda "low poly"
  paling keras di seluruh scene — ia menggambar setiap batas segitiga sebagai
  lipatan tajam, dan itu tidak tertutupi oleh geometri tambahan sebanyak apa pun.
- **GTAO** — penggelapan kontak. Tanpanya setiap celah seterang permukaan di
  sekitarnya dan model terbaca seperti rakitan bagian yang melayang.

**8. Ambient itu rasio, bukan jumlah.**
Jebakan terbesar di pass ini: env map + hemisphere light dinyalakan penuh
bersamaan, dan hasilnya sisi bayangan hampir seterang sisi terang — bayangannya
di-*cast* dengan benar lalu dihapus lagi oleh ambient. `AMBIENT_SCALE` (0.26) dan
`environmentIntensity` (0.30) sengaja rendah. Kalau menambah sumber cahaya baru,
turunkan yang lain; kalau tidak, gambarnya balik jadi rata.

**9. Shadow map dibake sekali, tidak per frame.**
`shadowMap.autoUpdate = false`. Matahari diam dan tidak ada caster yang bergerak
di world space — kamera terbang, lentera berkedip, debu melayang, tapi tidak ada
yang berpindah. Merender ulang 4096² dari ~90 caster tiap frame memakan 11ms dari
25ms total. Kalau nanti ada objek bergerak yang harus berbayang, set
`renderer.shadowMap.needsUpdate = true` saat itu (flag-nya menghapus dirinya
sendiri setelah pass jalan).

**10. Arah matahari punya satu sumber kebenaran.**
`SUN_DIR` di `Scene.js`. Shader langit menggambar silau di sekitar `uSunDir`-nya
sendiri dan DirectionalLight melempar bayangan dari posisinya sendiri; sebelumnya
keduanya tidak sepakat. Ditaruh di **samping**, bukan di belakang — matahari di
-Z membelakangi pendopo dan seluruh muka yang dilihat pengunjung jatuh ke bayangan
rata.

**11. Kualitas render itu adaptif — jangan hardcode angkanya.**
`src/config/quality.js`. Pass realisme awalnya ditune dengan asumsi GPU diskrit,
padahal target aslinya Intel Iris Xe. GTAO full-res + MSAA 4× di target half-float
+ shadow 4096 + buffer 3,76MP semuanya biaya **fill rate**, dan itu persis yang
paling langka di GPU terintegrasi.

Tiga tier (`low` / `medium` / `high`) dipilih otomatis dari string GPU +
`hardwareConcurrency`, lalu `ResolutionAdaptor` menyesuaikan skala resolusi
terus-menerus dari frame time nyata. Turunnya cepat, naiknya lambat — kalau
simetris, skalanya berosilasi dan osilasinya lebih mengganggu daripada sekadar
jalan di resolusi rendah.

Override manual: **`?q=low`**, `?q=medium`, `?q=high`.

Tuas yang paling berpengaruh adalah **jumlah piksel**, bukan jumlah poligon atau
jumlah efek. Scene di resolusi 60% dengan AO terlihat lebih baik daripada scene
yang sama di resolusi penuh tanpa apa-apa. Kalau nanti perlu mengencangkan lagi,
turunkan `maxPixels` dulu, baru matikan efek.

Di Iris Xe: 3,76MP → 2,10MP, ~25ms → ~6–8ms per frame, load 3,1s → 2,3s.

**12. Koreografi penari ditulis tangan, dan memang harus.**
`src/scene/dance.js`. Library rig Higgsfield punya 678 aksi mocap dan **tidak satu
pun tarian Jawa**. Seluruh grup `Dancing` itu pop Barat — `FunnyDancing`,
`Gangnam_Groove`, `Hip_Hop_Dance`, `Bass_Beats`; search "graceful / slow /
traditional / ballet / tai chi" → nol hasil.

Bedhaya itu lambat, ditahan dalam *mendhak*, pergelangan *nyempurit*, kepala
*pacak gulu*. Tidak ada di library manapun. Jadi walaupun nanti ada credit dan
Higgsfield bisa memasok **mesh**-nya, **gerakannya tetap dari file ini** — slot
`dancer` di manifest sengaja diset `enable_animation: false`.

Delapan pose membentuk satu frase tertutup (pose 7 kembali ke pose 0), disampling
oleh scroll. Waktu (`elapsed`) menambah napas dan ayunan kain di atasnya, supaya
pembaca yang berhenti scroll melihat penari **menahan pose**, bukan model beku.

Konvensi sudut: figur menghadap +Z, tiap anggota badan menggantung di -Y lokalnya
(jadi rotasi 0 = pose istirahat anatomis), dan rotasi Z dikali `side` supaya satu
angka positif membuka **kedua** lengan ke luar.

**13. Selendang itu rentang, bukan untaian.**
Percobaan pertama menggantung persegi panjang lurus ke bawah dari tangan — hasilnya
lempengan pink kaku. Selendang itu membentang **dari tangan ke pinggang**, dan
bentuknya adalah lengkungan di antaranya; sesuatu tanpa rentang tidak punya apa-apa
untuk melengkung. Sekarang dibangun ulang tiap frame sepanjang Bézier kuadratik
hand→hip, dengan titik kontrol di bawah tali busur sebagai gravitasi.

**14. Alpha bertekstur tidak berfungsi di pipeline ini — hanya `material.opacity`.**
Ditemukan saat membuat contact shadow penari. Tiga cara gagal:
tekstur hitam dengan gradien di channel alpha-nya sendiri lewat `map` → tidak
terlihat; gradien putih-ke-hitam lewat `alphaMap` → tidak terlihat; vertex alpha
(color attribute itemSize 4) → ter-render sebagai cakram hitam pekat.

Material hitam transparan **tanpa tekstur** menggelapkan dengan benar. Jadi jalur
transparansinya sehat, yang hilang spesifik alpha hasil sampling — dugaan terkuat
ada hubungannya dengan render target half-float di composer. Belum ditelusuri
sampai akar.

**Konsekuensi praktis:** kalau butuh gradien transparansi, jangan pakai tekstur —
susun beberapa mesh dengan `material.opacity` berbeda, seperti empat cincin di
`_buildContactShadow()`. Kalau nanti ada yang mau menelusuri, mulai dari
`_initPost()` dan coba bandingkan dengan `composer = null` (tier `low`).

**15. Penari dikeluarkan dari shadow map matahari.**
Dia satu-satunya yang bergerak. Memasukkannya memaksa seluruh pass 2048² atas ~200
caster jalan ulang — terukur lebih mahal daripada sisa frame digabung. Dia bawa
contact shadow sendiri; itu yang sebenarnya dibutuhkan shot-nya: pijakan, bukan
siluet.

**16. `DynamicDrawUsage` wajib untuk geometri yang ditulis ulang tiap frame.**
Selendang, jarik, dan silk fall semuanya menulis ulang vertex tiap frame. Tanpa
hint ini driver memperlakukan tiap upload sebagai buffer statis baru — alokasi dan
pipeline stall per frame. Ini penyebab tunggal terbesar biaya penari:
**34,9ms → 11,6ms** hanya dari tiga baris `setUsage()`.

**17. Tubuh penari itu mesh referensi, di-rig saat runtime.**
`referensi/dancin_statue.glb` (disalin ke `public/models/dancer.glb`) datang
**tanpa tulang, tanpa skin, tanpa animasi** — satu pose beku, 2406 vertex. Dipakai
apa adanya berarti kehilangan tarian; jadi `src/scene/statueRig.js` memasang
kerangka 11-tulang ke mesh itu saat load.

Landmark diukur dari vertex cloud-nya (pinggang di 66% tinggi, garis bahu tempat
lebar melonjak 0.27→0.87, massa kepala di 84-95%, dua ujung tangan) dan disimpan
sebagai **fraksi tinggi**, bukan angka absolut — jadi tetap benar kalau mesh
di-ekspor ulang dengan skala berbeda.

**Pose pahatannya adalah rest pose.** Patungnya sudah berdiri dalam pose bagus,
jadi pose dance.js diterapkan sebagai **delta dari pose 2** dan diredam `DAMP =
0.5`. Di beat Palace dia persis seperti dipahat; di beat lain dia menyimpang dari
situ. Peredaman itu perlu: bobot linear dua-tulang tidak selamat dari ayunan bahu
90°, dan tari Jawa memang amplitudonya kecil.

**Kostum disegmentasi dari geometri** (`computeRegions`) — mesh-nya satu kesatuan
tanpa material terpisah. Aturannya pakai landmark yang sama plus **jarak sepanjang
lengan** (kebaya berlengan panjang, jadi hanya tangan yang terbuka). Penugasan
tulang jadi penengah untuk kepala, karena lengan yang terangkat lewat tepat di
samping kepala dan aturan spasial murni sempat mengecat bercak kulit di lengan atas.

**Sumbu-atas dideteksi, bukan diasumsikan.** Data mentahnya Z-up (ekspor
Sketchfab), tapi node tree glTF-nya **juga** membawa rotasi -90° X yang
mengoreksinya. Jadi orientasi yang sampai tergantung apakah pemanggil sudah
mem-bake transform node. Mengasumsikan Z-up begitu saja memutar mesh yang sudah
benar untuk kedua kalinya — penari jadi terbaring sepanjang 8 meter. Sekarang
diukur: sumbu terpanjang figur berdiri adalah tingginya.

**UV diganti proyeksi silinder.** UV bawaan ekspor tidak untuk tiling apa pun;
batiknya keluar sebagai satu pita melar di rok yang selebihnya polos.

**Verifikasi tanpa browser:** `node tools/rig-preview.mjs` memuat modul rig yang
sebenarnya, menerapkan pose, dan merasterisasi hasilnya ke PNG. Dipakai untuk
memasang rig ini saat ekstensi browser mati, dan tetap disimpan karena setiap
perubahan pada fraksi landmark atau pembobotan perlu dicek dengan cara yang sama.

**Diketahui belum dikerjakan:** normal mesh tidak dihitung ulang setelah skinning.
Dengan `DAMP = 0.5` deformasinya kecil dan normal basi tidak terlihat, tapi kalau
DAMP dinaikkan, pencahayaannya akan mulai meleset.

**18. Dua tahap smoothing itu disengaja.**
Lenis menghaluskan input (menghilangkan step notch wheel); damping di CameraRig
memberi bobot pada gerak kamera. Keduanya menyelesaikan masalah berbeda.
Damping-nya frame-rate independent (`1 - exp(-λ·dt)`), jadi terasa sama di 60Hz
maupun 144Hz.

---

## Design system

Diambil langsung dari moodboard, didaftarkan di blok `@theme` pada
`src/index.css`. Tailwind menurunkan utility-nya sendiri dari situ, jadi
`--color-forest` langsung jadi `bg-forest` / `text-forest` / `border-forest`:

| token | hex | pakai di |
|---|---|---|
| `--color-forest` | `#2C4A34` | heading, panel Palace |
| `--color-sage` | `#93A98D` | teks sekunder, layer jauh |
| `--color-gold` | `#C9A34E` | CTA, rule, ornamen |
| `--color-tan` | `#DCC89A` | trim, teks di panel gelap |
| `--color-cream` | `#E8E2D0` | ground halaman |
| `--color-paper` | `#F7F4EC` | card |

Turunannya — `forest-deep`, `forest-mid`, `gold-deep`, `ink`, `ink-soft` — bukan
warna baru: `gold` di atas `paper` cuma ~2:1, jadi `gold-deep` dipakai untuk teks
kecil di latar terang.

Font: **Cormorant Garamond** (`font-display`) + **Inter** (`font-body`).

Yang tidak bisa diungkapkan utility bawaan didefinisikan sebagai `@utility` di
file yang sama, bukan sebagai class lepas: `halo` / `halo-strong` (bayangan teks
krem di bawah copy yang duduk langsung di atas render 3D), `hatch` (arsiran emas
untuk frame foto yang kosong), dan `rail-scroll` (scrollbar timeline History).

Untuk hal yang berulang di banyak halaman, class-nya dipegang satu komponen —
`<Eyebrow>`, `<Kicker>`, `<Dlink>`, `<ButtonOutline>`, `<Rule>` di
`components/ui/Type.jsx` — bukan disalin sebagai deretan class panjang. Blok
hijau (kutipan Royal House, penutup About) memakai prop `tone="dark"`; di CSS
lama ini ditangani dengan menukar custom property `--pg-*` di dalam
`.psec--forest`.

Motion mengikuti PDF §8 — "slow & dignified": tidak ada transisi di bawah 0.35s,
tidak ada bounce, reveal `power2.out` 1.05s.

---

## Aksesibilitas & ketahanan

- `prefers-reduced-motion` dihormati di CSS **dan** di CameraRig (kamera snap ke
  pose, tanpa breath/parallax). Di halaman dalam, `<Reveal>` memakai varian
  `motion-reduce:` sehingga isinya langsung tampil tanpa transisi.
- Reveal homepage di-gate `.has-js` — kelas itu dipasang `<Scene3D>` dan dilepas
  lagi kalau boot-nya gagal, jadi kegagalan scene tidak pernah meninggalkan
  halaman kosong.
- WebGL gagal → canvas dibuang, halaman tetap dokumen lengkap yang terbaca.
- `<dialog>` tanpa `showModal` (browser lawas) → silsilah turun jadi kartu
  statis dengan profil yang ikut terlihat, bukan tombol yang tidak membuka
  apa-apa.
- Loader punya timeout 2.5s, tidak akan menggantung kalau font atau GPU macet.
- Scene pause saat tab hidden.

---

## Halaman dalam (History → About)

Lima halaman di luar homepage dibangun dari handoff Claude Design
(`Istana Mataram.dc.html`) — layout dan konten ikut design, warna diambil dari
palette yang sudah ada di `@theme` (`src/index.css`).

Skemanya **terang**, mengikuti navbar homepage: paper untuk panel, cream untuk
ground. Hijau bukan lagi latar melainkan aksen — warna heading, hairline, dan
dua blok kutipan.

| Halaman | Route | Komponen | Interaksi |
| --- | --- | --- | --- |
| History | `/history` | `src/pages/History.jsx` | Rail 9 era, panel detail, prev/next, panah kiri-kanan |
| Royal House | `/royal-house` | `src/pages/RoyalHouse.jsx` | Silsilah 9 generasi, profil di `<dialog>` |
| Palace | `/palace` | `src/pages/Palace.jsx` | Denah keraton interaktif, 10 ruang |
| Royal Archive | `/archive` | `src/pages/Archive.jsx` | Pencarian live + filter kategori |
| About | `/about` | `src/pages/About.jsx` | Statis |

URL-nya sama seperti sebelumnya, tanpa akhiran `.html`.

**Yang hilang dari pindah ke SPA:** versi lama adalah enam dokumen HTML lengkap
yang tetap terbaca tanpa JS dan langsung bisa di-crawl. Sekarang seluruh isi
dirender React, jadi tanpa JS yang tersisa cuma `<div id="root">`. Kalau SEO atau
ketahanan tanpa-JS jadi penting, jalan keluarnya prerender saat build (mis.
`vite-plugin-ssg`) — bukan kembali ke enam file HTML.

Karena ini SPA, server produksinya harus mengembalikan `index.html` untuk semua
path (rewrite SPA), kalau tidak `/history` yang dibuka langsung akan 404.

**three/gsap/lenis tetap tidak dikirim ke halaman dalam.** Dulu itu dijamin oleh
build multi-entry Vite; sekarang oleh satu `lazy(() => import('./Scene3D'))` di
`HomeBackdrop`. Bundle utama tinggal React + router + kelima halaman; 750 kB
scene dan motion diunduh hanya kalau homepage yang dibuka. Kalau impor itu
diubah jadi statis, seluruh three ikut ke setiap halaman.

Chrome bersama — navbar, overlay menu mobile, footer — ada di
`components/layout/SiteLayout.jsx`, satu tempat untuk enam halaman.

### Foto

Halaman-halaman ini memakai `/img/<nama>.png` dari `public/img/`, yang masih
kosong. `<Frame>` (`components/ui/Frame.jsx`) mulai dalam keadaan kosong dan
menampilkan plat placeholder bergaris emas berlabel; `onLoad` yang membukanya
begitu gambar sungguhan berhasil dimuat. Gambarnya tetap dirender dengan
`opacity: 0` — bukan `display: none` — supaya browser terus memuatnya. Cukup
jatuhkan file ke `public/img/` dan foto langsung muncul, tanpa ubah markup.

Nama file yang sudah ditunggu: `keraton-pendopo`, `royal-couple`, `batik`,
`gamelan`, `manuscript`, `pendopo-interior`, `historic-illustration` (tujuh ini
ada di project Claude Design), plus `imogiri`, `surakarta`, `kotagede`,
`pemanahan`, `batavia`, `calendar-decree`, `kris`, `pakubuwono-xiii`, `grebeg`,
`centhini`, `royal-portrait`.

---

## Yang belum dikerjakan

- Halaman Culture, Discover, dan News & Events — sitemap-nya ada di PDF §4.
  Untuk sekarang item-item itu jadi anchor ke section homepage.
- Foto untuk `public/img/`, sesuai daftar di atas.
- Konten masih placeholder editorial; belum dari CMS atau data existing.
- Asset Higgsfield, sesuai catatan di atas.
