import { cx } from '@/lib/cx';

/** Kolom terpusat situs: lebar maksimum 1180px (atau 720px untuk teks panjang). */
export function Wrap({ narrow = false, as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cx('mx-auto w-full px-[clamp(20px,5vw,40px)]', narrow ? 'max-w-[720px]' : 'max-w-[1180px]', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
