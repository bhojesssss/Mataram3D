import { cx } from '@/lib/cx';
import { Rosette } from '@/components/ui/Icons';

/**
 * Layar pembuka.
 *
 * Bertahan sampai renderer benar-benar menaruh satu frame di canvas dan font
 * display selesai dimuat — memperlihatkan canvas kosong, atau membiarkan
 * Cormorant menggantikan judul hero di depan mata, dua-duanya lebih buruk
 * daripada tahan sebentar lebih lama.
 */
export function Loader({ done }) {
  return (
    <div
      className={cx(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-cream text-gold',
        'transition-[opacity,visibility] duration-[900ms] ease-heritage',
        done && 'invisible opacity-0',
      )}
    >
      <Rosette size={40} strokeWidth={1.1} className="animate-breathe" />
      <p className="font-display text-[1.1rem] tracking-[0.5em] indent-[0.5em] text-forest">MATARAM</p>
    </div>
  );
}
