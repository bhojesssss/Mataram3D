import { cx } from '@/lib/cx';

/*
  Bahan tempat teks boleh duduk di atas render 3D.

  Aturan keterbacaan homepage cuma satu kalimat: teks tidak pernah duduk
  langsung di atas canvas, selalu di atas salah satu varian di sini. Itu
  menggantikan pendekatan lama (scrim global + halo per-elemen), yang tidak
  bisa benar karena render-nya tidak seragam — langit terang dan massa pendopo
  gelap ada di layar yang sama, dan satu angka opacity global harus memilih
  salah satunya.

  Angkanya bukan selera. Diukur terhadap kasus terburuk, yaitu teks yang jatuh
  di atas sirap atap tergelap dengan scrim global nyaris nol:

    glass (paper 82%)   forest 6.67:1   ink-soft 5.24:1   gold-deep 5.00:1
    wash  (paper 70%)   forest 5.02:1   ink 7.08:1

  Semua di atas 4.5:1, jadi varian mana pun aman untuk teks kecil sekalipun.

  Karena tiap blok sudah membawa kontrasnya sendiri, SCRIM_PATH di
  ScrollController justru bisa diturunkan jauh — 3D-nya sekarang lebih
  terlihat daripada sebelum perubahan ini, bukan lebih tertutup.
*/

/**
 * @param {'glass'|'wash'} variant
 *   'glass' — kartu berkaca dengan tepi dan blur. Untuk blok prosa yang tidak
 *   punya kartu sendiri.
 *   'wash'  — pudaran radial tanpa tepi dan tanpa blur. Untuk kepala section
 *   yang isinya sudah berupa kartu; panel kedua di situ cuma jadi bingkai di
 *   dalam bingkai.
 * @param {boolean} pad
 *   Padding bawaan varian glass. Matikan kalau anaknya sudah mengatur sendiri.
 */
export function Surface({ variant = 'glass', pad = true, as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        variant === 'glass' && 'surface',
        variant === 'glass' && pad && 'px-[clamp(22px,4vw,52px)] py-[clamp(28px,4vw,56px)]',
        variant === 'wash' && 'surface-wash',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
