import { cx } from '@/lib/cx';
import { useReveal } from '@/hooks/useReveal';

/**
 * Membuka isi dengan naik-memudar saat masuk viewport.
 *
 * Pengganti atribut [data-rise] + CSS di halaman dalam. Di mode reduced-motion
 * isinya langsung tampil tanpa transisi.
 */
export function Reveal({ as: Tag = 'div', className, children, ...rest }) {
  const [ref, shown] = useReveal();

  return (
    <Tag
      ref={ref}
      className={cx(
        'transition-[opacity,transform] duration-[800ms] ease-heritage motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[22px] opacity-0',
        'motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
