/** Gaya dan komponen dasar yang dipakai lintas halaman dasbor. */
import { cx } from '@/lib/cx';

export const ERROR_TEXT = 'text-[#9b3b2f]';

export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold';

export const INPUT = cx(
  'w-full rounded-lg border border-forest/28 bg-white/55 px-3.5 py-2.5 text-[0.92rem] font-normal text-ink',
  'outline-none placeholder:text-ink/50 transition-[border-color,box-shadow,background-color] duration-[350ms] ease-heritage',
  'hover:border-forest/45 focus:border-gold focus:bg-white/80 focus:ring-3 focus:ring-gold/20',
  'aria-[invalid=true]:border-[#9b3b2f]/70',
);

export const PRIMARY = cx(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-forest bg-forest px-5 py-2.5',
  'text-[0.84rem] font-medium whitespace-nowrap text-paper no-underline',
  'transition-[background-color,border-color] duration-[350ms] ease-heritage hover:border-forest-mid hover:bg-forest-mid',
  'disabled:cursor-not-allowed disabled:opacity-55',
  FOCUS,
);

export const SECONDARY = cx(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-forest/28 bg-paper px-4 py-2.5',
  'text-[0.84rem] whitespace-nowrap text-forest no-underline',
  'transition-[background-color,border-color] duration-[350ms] ease-heritage hover:border-gold hover:bg-gold/12',
  'disabled:cursor-not-allowed disabled:opacity-55',
  FOCUS,
);

export const ICON_BUTTON = cx(
  'grid size-9 cursor-pointer place-items-center rounded-lg text-forest',
  'transition-colors duration-[350ms] ease-heritage hover:bg-forest/8',
  'disabled:cursor-not-allowed disabled:opacity-45',
  FOCUS,
);

export const DANGER_ICON = cx(ICON_BUTTON, 'text-[#9b3b2f] hover:bg-[#9b3b2f]/8');

export const SMALL_GHOST = cx(
  'cursor-pointer rounded-md px-3 py-1.5 text-[0.8rem] text-forest hover:bg-forest/8 disabled:opacity-50',
  FOCUS,
);

export const DANGER_SOLID = cx(
  'cursor-pointer rounded-md bg-[#9b3b2f] px-3 py-1.5 text-[0.8rem] font-medium text-paper hover:bg-[#7d2f25] disabled:opacity-60',
  FOCUS,
);

export const LABEL = 'text-[0.84rem] font-medium text-forest';

export function PrimaryButton({ type = 'button', className, ...rest }) {
  return <button type={type} className={cx(PRIMARY, className)} {...rest} />;
}

export const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export function Field({ id, label, hint, error, count, max, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {max != null && (
          <span className={cx('text-[0.72rem] tabular-nums', count > max ? ERROR_TEXT : 'text-ink/60')}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

export function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={`${id}-error`} className={cx('mt-1.5 text-[0.78rem]', ERROR_TEXT)}>
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-[0.78rem] leading-relaxed text-ink/72">
        {hint}
      </p>
    );
  }
  return null;
}

export function Section({ title, description, children, className }) {
  return (
    <section className={cx('rounded-lg border border-forest/15 bg-paper p-[clamp(18px,2.4vw,26px)]', className)}>
      <header className="mb-5">
        <h2 className="font-display text-[1.4rem] leading-tight text-forest">{title}</h2>
        {description && <p className="mt-1 text-[0.8rem] leading-relaxed text-ink/72">{description}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Switch({ id, checked, onChange, disabled, label, labelledBy, describedBy: describedById }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedById}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border',
        'transition-colors duration-[350ms] ease-heritage disabled:cursor-wait disabled:opacity-60',
        checked ? 'border-forest bg-forest' : 'border-forest/30 bg-forest/10',
        FOCUS,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'inline-block size-[18px] rounded-full bg-paper transition-transform duration-[350ms] ease-heritage',
          checked ? 'translate-x-[21px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );
}

export function Notice({ tone = 'info', children, className }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'rounded-lg border px-4 py-3 text-[0.84rem] leading-relaxed',
        tone === 'error' ? 'border-[#9b3b2f]/35 bg-[#9b3b2f]/6 text-[#7d2f25]' : 'border-forest/20 bg-forest/6 text-forest',
        className,
      )}
    >
      {children}
    </div>
  );
}
