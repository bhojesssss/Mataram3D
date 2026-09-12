/** Kartu satu arsip di halaman daftar. */
import { Link } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { Frame } from '@/components/ui/Frame';
import { useI18n } from '../i18n';
import { ExternalIcon, PencilIcon, TrashIcon } from '../icons';
import { DANGER_ICON, DANGER_SOLID, FOCUS, ICON_BUTTON, SMALL_GHOST, Switch } from '../ui';

export function RecordCard({ record, number, busy, confirming, onTogglePublish, onAskDelete, onCancelDelete, onDelete }) {
  const { t } = useI18n();
  const editPath = `/admin/records/${record.id}`;
  const published = record.isPublished;
  const statusLabel = t(published ? 'status.published' : 'status.draft');

  return (
    <li
      className={cx(
        '@container flex flex-col overflow-hidden rounded-lg border bg-paper transition-[border-color] duration-[350ms] ease-heritage',
        published ? 'border-forest/18 hover:border-gold/60' : 'border-dashed border-forest/35',
      )}
    >
      <div className="relative">
        <Frame
          key={record.imageUrl}
          src={record.imageUrl}
          label="Archive image"
          rounded={false}
          className={cx('aspect-[16/10] w-full border-0 transition-[filter,opacity] duration-500', !published && 'opacity-70 grayscale')}
        />
        <span
          className={cx(
            'absolute top-3 left-3 rounded-md px-2 py-1 text-[0.64rem] font-medium tracking-[0.14em] uppercase',
            published ? 'bg-forest text-paper' : 'bg-paper text-gold-deep ring-1 ring-gold-deep/40',
          )}
        >
          {statusLabel}
        </span>
        {number != null && (
          <span
            title={t('card.orderTitle')}
            className="absolute top-3 right-3 rounded-md bg-paper/92 px-2 py-1 text-[0.72rem] tabular-nums text-forest"
          >
            #{number}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
        <p className="mb-2 flex items-baseline justify-between gap-3 text-[0.66rem]">
          <span className="tracking-[0.2em] uppercase text-gold-deep">{record.category}</span>
          <span className="truncate text-ink/72">{record.era}</span>
        </p>
        <h2 className="line-clamp-2 font-display text-[1.3rem] leading-[1.2] text-forest">
          <Link
            to={editPath}
            className={cx('rounded-sm no-underline decoration-gold/70 underline-offset-4 hover:underline', FOCUS)}
          >
            {record.title}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-relaxed text-ink/72">{record.description}</p>
      </div>

      <div
        className="flex min-h-[54px] items-center justify-between gap-2 border-t border-forest/12 px-3 py-2"
        onKeyDown={(event) => confirming && event.key === 'Escape' && onCancelDelete()}
      >
        {confirming ? (
          <>
            <span className="min-w-0 truncate pl-1 text-[0.8rem] text-[#7d2f25]">{t('card.confirmDelete')}</span>
            <span className="flex shrink-0 gap-1.5">
              <button type="button" onClick={onCancelDelete} disabled={busy} className={SMALL_GHOST}>
                {t('common.cancel')}
              </button>
              <button type="button" autoFocus onClick={onDelete} disabled={busy} className={DANGER_SOLID}>
                {busy ? t('card.deleting') : t('card.delete')}
              </button>
            </span>
          </>
        ) : (
          <>

            <span className="flex min-w-0 items-center gap-2.5 pl-1">
              <Switch
                checked={published}
                disabled={busy}
                onChange={onTogglePublish}
                label={t('card.publishLabel', { title: record.title })}
              />
              <span aria-hidden="true" className="hidden truncate text-[0.8rem] text-forest @min-[280px]:block">
                {busy ? t('common.saving') : statusLabel}
              </span>
            </span>
            <span className="flex shrink-0">
              <Link
                to={editPath}
                aria-label={t('card.editLabel', { title: record.title })}
                title={t('card.edit')}
                className={ICON_BUTTON}
              >
                <PencilIcon />
              </Link>
              <a
                href={record.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('card.openArticleLabel', { title: record.title })}
                title={t('card.openArticle')}
                className={ICON_BUTTON}
              >
                <ExternalIcon />
              </a>
              <button
                type="button"
                onClick={onAskDelete}
                disabled={busy}
                aria-label={t('card.deleteLabel', { title: record.title })}
                title={t('card.delete')}
                className={DANGER_ICON}
              >
                <TrashIcon />
              </button>
            </span>
          </>
        )}
      </div>
    </li>
  );
}
