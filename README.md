# MATARAM — The Royal Heritage

Homepage untuk digital heritage experience Istana Mataram. Three.js + scroll-driven
camera, dibangun dari `referensi/` (moodboard + PDF content structure).

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

```
src/
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
├── scroll/ScrollController.js   Lenis + GSAP, satu-satunya sumber progress
└── main.js
```

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

Diambil langsung dari moodboard:

| token | hex | pakai di |
|---|---|---|
| `--forest` | `#2C4A34` | heading, panel Palace |
| `--sage` | `#93A98D` | teks sekunder, layer jauh |
| `--gold` | `#C9A34E` | CTA, rule, ornamen |
| `--tan` | `#DCC89A` | trim, teks di panel gelap |
| `--cream` | `#E8E2D0` | ground halaman |
| `--paper` | `#F7F4EC` | card |

Font: **Cormorant Garamond** (display) + **Inter** (body).

Motion mengikuti PDF §8 — "slow & dignified": tidak ada transisi di bawah 0.35s,
tidak ada bounce, reveal `power2.out` 1.05s.

---

## Aksesibilitas & ketahanan

- `prefers-reduced-motion` dihormati di CSS **dan** di CameraRig (kamera snap ke
  pose, tanpa breath/parallax).
- Reveal di-gate `.has-js`. Kalau JS gagal, konten tidak pernah tersembunyi.
- WebGL gagal → canvas dibuang, halaman tetap dokumen lengkap yang terbaca.
- Loader punya timeout 2.5s, tidak akan menggantung kalau font atau GPU macet.
- Scene pause saat tab hidden.

---

## Halaman dalam (History → About)

Lima halaman di luar homepage dibangun dari handoff Claude Design
(`Istana Mataram.dc.html`) — layout dan konten ikut design, warna diambil dari
palette yang sudah ada di `main.css`.

Skemanya **terang**, mengikuti navbar homepage: paper untuk panel, cream untuk
ground. Hijau bukan lagi latar melainkan aksen — warna heading, hairline, dan
dua blok kutipan. Semua diatur lewat token `--pg-*` di `pages.css`; blok hijau
(`.psec--forest`, `.closing`) menimpa token yang sama dengan nilai on-dark-nya,
jadi komponen di dalamnya membalik sendiri tanpa aturan tambahan.

Ini **multi-page**, bukan router: tiap halaman punya entry sendiri di
`vite.config.js`, sehingga three/gsap/lenis hanya dikirim ke homepage.

| Halaman | File | Script | Interaksi |
| --- | --- | --- | --- |
| History | `history.html` | `src/pages/history.js` | Rail 9 era, panel detail, prev/next, panah kiri-kanan |
| Royal House | `royal-house.html` | `src/pages/royal-house.js` | Silsilah 9 generasi, profil di `<dialog>` |
| Palace | `palace.html` | `src/pages/palace.js` | Denah keraton interaktif + chip 10 ruang |
| Royal Archive | `archive.html` | `src/pages/archive.js` | Pencarian live + filter kategori |
| About | `about.html` | `src/pages/page.js` | Statis |

Semua konten ditulis langsung di HTML — JS cuma menyembunyikan/menampilkan,
tidak pernah merender. Jadi tanpa JS pun kelima halaman tetap dokumen lengkap.

Chrome bersama (nav gelap, overlay menu mobile, reveal on scroll, fallback
gambar) ada di `src/pages/shell.js` + `src/styles/pages.css`.

### Foto

Halaman-halaman ini memakai `/img/<nama>.png` dari `public/img/`, yang masih
kosong. Setiap `.frame` sengaja dikirim dengan `data-empty`, jadi yang tampil
adalah plat placeholder bergaris emas berlabel; `shell.js` melepas flag itu
begitu gambar sungguhan berhasil dimuat. Cukup jatuhkan file ke `public/img/`
dan foto langsung muncul, tanpa ubah markup.

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
