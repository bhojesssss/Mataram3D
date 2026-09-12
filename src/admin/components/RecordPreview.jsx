/** Pratinjau kartu seperti tampilannya di halaman Royal Archive. */
import { cx } from '@/lib/cx';
import { Frame } from '@/components/ui/Frame';
import { useI18n } from '../i18n';

export function RecordPreview({ values }) {
  const { t } = useI18n();
  const empty = (value) => !value && 'opacity-45';

  return (
    <article aria-hidden="true" className="overflow-hidden rounded-lg border border-forest/18 bg-paper">
      <Frame
        key={values.imageUrl || 'empty'}
        src={values.imageUrl || undefined}
        label="Archive image"
        rounded={false}
        className="h-[clamp(140px,14vw,180px)] border-0"
      />
      <div className="px-[18px] pt-4 pb-5">
        <p className="mb-2.5 flex justify-between gap-2.5 text-[0.56rem]">
          <span className={cx('tracking-[0.26em] uppercase text-gold-deep', empty(values.category))}>
            {values.category || t('preview.category')}
          </span>
          <span className={cx('tracking-[0.14em] text-ink/72', empty(values.era.trim()))}>
            {values.era.trim() || t('preview.era')}
          </span>
        </p>
        <p className={cx('mb-[7px] font-display text-[1.18rem] leading-[1.25] text-forest', empty(values.title.trim()))}>
          {values.title.trim() || t('preview.title')}
        </p>
        <p className={cx('text-[0.72rem] leading-[1.6] text-ink/72', empty(values.description.trim()))}>
          {values.description.trim() || t('preview.description')}
        </p>
      </div>
    </article>
  );
}
