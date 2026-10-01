import { cx } from '@/lib/cx';

/*
  Pudaran radial tanpa tepi, untuk teks yang duduk di LUAR band.

  Sekarang tinggal satu pemakai: sub-copy hero. Varian `glass` yang dulu ada
  di sini — kartu berkaca dengan backdrop-filter — sudah dihapus bersama
  seluruh pendekatan panel-per-blok; lihat components/ui/Band.jsx untuk apa
  yang menggantikannya dan kenapa.

  Kepekatannya sengaja dibaca dari `--band-alpha` yang sama, bukan token
  sendiri. Percobaan sebelumnya memberi wash alpha lebih rendah (0.70) dan
  itu langsung jadi jalur yang lolos audit tanpa memenuhi syarat — gold-deep
  di situ cuma 3.76:1. Satu angka untuk seluruh halaman berarti tidak ada
  bahan yang bisa diam-diam lebih lemah dari yang lain.
*/
export function Surface({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={cx('surface-wash', className)} {...rest}>
      {children}
    </Tag>
  );
}
