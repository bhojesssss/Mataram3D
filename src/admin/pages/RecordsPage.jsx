/** Halaman daftar arsip: pencarian, filter status dan kategori, serta aksi tiap kartu. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '@/lib/cx';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Wrap } from '@/components/ui/Wrap';
import { Chip } from '@/components/ui/Chip';
import { Eyebrow } from '@/components/ui/Type';
import { Rosette, SearchIcon } from '@/components/ui/Icons';
import { api } from '../api';
import { RecordCard } from '../components/RecordCard';
import { useI18n } from '../i18n';
import { PlusIcon } from '../icons';
import { CATEGORIES } from '../records';
import { useApiError } from '../session';
import { useToast } from '../toast';
import { FOCUS, INPUT, Notice, PRIMARY, SECONDARY } from '../ui';

const ALL = '__all__';

const GRID = 'grid list-none grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5';

export default function RecordsPage() {
  const { t } = useI18n();
  usePageMeta(t('list.metaTitle'));
  const toMessage = useApiError();
  const toast = useToast();

  const [records, setRecords] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(() => {
    setLoadError(null);
    setRecords(null);
    api.listRecords().then(setRecords, (err) => {
      const message = toMessage(err);
      if (message) setLoadError(message);
    });
  }, [toMessage]);

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const all = records?.length ?? 0;
    const published = records ? records.filter((record) => record.isPublished).length : 0;
    return { all, published, draft: all - published };
  }, [records]);

  const statuses = [
    { value: 'all', label: t('list.all') },
    { value: 'published', label: t('status.published') },
    { value: 'draft', label: t('status.draft') },
  ];

  const filtered = category !== ALL || status !== 'all' || query.trim() !== '';

  const shown = useMemo(() => {
    if (!records) return [];
    const q = query.trim().toLowerCase();
    return records.filter(
      (record) =>
        (category === ALL || record.category === category) &&
        (status === 'all' || (status === 'published') === record.isPublished) &&
        (!q || `${record.title} ${record.era} ${record.category} ${record.description}`.toLowerCase().includes(q)),
    );
  }, [records, query, category, status]);

  const resetFilters = () => {
    setQuery('');
    setCategory(ALL);
    setStatus('all');
  };

  async function runAction(record, action) {
    setBusyId(record.id);
    try {
      await action();
    } catch (err) {
      const message = toMessage(err);
      if (message) toast(message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  const togglePublish = (record) =>
    runAction(record, async () => {
      const updated = await api.updateRecord(record.id, { isPublished: !record.isPublished });
      setRecords((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      toast(t(updated.isPublished ? 'list.toastPublished' : 'list.toastDrafted', { title: updated.title }));
    });

  const remove = (record) =>
    runAction(record, async () => {
      await api.deleteRecord(record.id);
      setRecords((list) => list.filter((item) => item.id !== record.id));
      setConfirmId(null);
      toast(t('list.toastDeleted', { title: record.title }));
    });

  const lede = t('list.lede');

  return (
    <Wrap className="pt-[clamp(24px,4vw,44px)]">
      <header>
        <Eyebrow>Royal Archive</Eyebrow>

        <div className="flex items-end justify-between gap-4">
          <h1 className="min-w-0 font-display text-[clamp(1.85rem,3.6vw,2.9rem)] font-light leading-none text-forest">
            {t('list.title')}
          </h1>
          <Link to="/admin/records/new" className={cx(PRIMARY, 'shrink-0')}>
            <PlusIcon />
            <span className="min-[421px]:hidden">{t('list.addShort')}</span>
            <span className="max-[420px]:hidden">{t('list.add')}</span>
          </Link>
        </div>
        <p className="mt-3 max-w-[62ch] text-[0.86rem] leading-relaxed text-ink/72 max-[640px]:text-[0.8rem]">
          {lede.before}
          <span className="font-medium text-forest">{lede.strong}</span>
          {lede.after}
        </p>
      </header>

      {records && records.length > 0 && (
        <div className="mt-7 space-y-4 border-b border-forest/15 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label={t('list.statusGroup')} className="inline-flex rounded-lg border border-forest/18 bg-paper p-1">
              {statuses.map((item) => {
                const pressed = item.value === status;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setStatus(item.value)}
                    className={cx(
                      'inline-flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[0.84rem] whitespace-nowrap',
                      'transition-colors duration-[350ms] ease-heritage max-[400px]:px-2.5',
                      pressed ? 'bg-forest text-paper' : 'text-forest hover:bg-forest/8',
                      FOCUS,
                    )}
                  >
                    {item.label}
                    <span
                      className={cx(
                        'rounded-full px-1.5 text-[0.72rem] tabular-nums',
                        pressed ? 'bg-paper/20 text-paper' : 'bg-forest/8 text-ink/72',
                      )}
                    >
                      {counts[item.value]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full min-[720px]:w-[320px]">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/55">
                <SearchIcon size={16} />
              </span>
              <label htmlFor="records-search" className="sr-only">
                {t('list.search')}
              </label>
              <input
                id="records-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('list.searchPlaceholder')}
                autoComplete="off"
                className={cx(INPUT, 'pl-10')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center min-[641px]:gap-x-4">

            <ul
              aria-label={t('list.categoryGroup')}
              className="rail-scroll -mx-[clamp(20px,5vw,40px)] flex list-none gap-[7px] overflow-x-auto px-[clamp(20px,5vw,40px)] pb-1 min-[641px]:mx-0 min-[641px]:flex-wrap min-[641px]:overflow-visible min-[641px]:px-0 min-[641px]:pb-0"
            >
              {[ALL, ...CATEGORIES].map((item) => (
                <li key={item} className="shrink-0">
                  <Chip uppercase pressed={item === category} onClick={() => setCategory(item)}>
                    {item === ALL ? t('list.all') : item}
                  </Chip>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="text-[0.8rem] text-ink/72 min-[641px]:ml-auto">
              {filtered
                ? t('list.countFiltered', { shown: shown.length, total: records.length })
                : t('list.countAll', { n: records.length })}
            </p>
          </div>
        </div>
      )}

      <section aria-label={t('list.listLabel')} className="mt-6">
        {records === null && !loadError && <SkeletonGrid label={t('list.loading')} />}

        {loadError && (
          <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
            <Notice tone="error">{loadError}</Notice>
            <button type="button" onClick={load} className={SECONDARY}>
              {t('common.tryAgain')}
            </button>
          </div>
        )}

        {records && records.length === 0 && (
          <div className="mt-2 flex flex-col items-center rounded-lg border border-dashed border-forest/25 bg-paper/60 px-6 py-[clamp(48px,8vw,96px)] text-center">
            <span className="mb-5 text-gold">
              <Rosette size={40} strokeWidth={1.1} />
            </span>
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] italic text-forest">{t('list.emptyTitle')}</p>
            <p className="mt-2 mb-7 max-w-[48ch] text-[0.88rem] leading-relaxed text-ink/72">{t('list.emptyText')}</p>
            <Link to="/admin/records/new" className={PRIMARY}>
              <PlusIcon />
              {t('list.add')}
            </Link>
          </div>
        )}

        {records && records.length > 0 && shown.length === 0 && (
          <div className="rounded-lg border border-dashed border-forest/25 px-5 py-14 text-center">
            <p className="mb-5 text-[0.92rem] text-ink/88">{t('list.noMatch')}</p>
            <button type="button" onClick={resetFilters} className={SECONDARY}>
              {t('list.clearFilters')}
            </button>
          </div>
        )}

        {shown.length > 0 && (
          <ul className={GRID}>
            {shown.map((record) => (
              <RecordCard
                key={record.id}
                record={record}

                number={records.indexOf(record) + 1}
                busy={busyId === record.id}
                confirming={confirmId === record.id}
                onTogglePublish={() => togglePublish(record)}
                onAskDelete={() => setConfirmId(record.id)}
                onCancelDelete={() => setConfirmId(null)}
                onDelete={() => remove(record)}
              />
            ))}
          </ul>
        )}
      </section>
    </Wrap>
  );
}

function SkeletonGrid({ label }) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <ul aria-hidden="true" className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="overflow-hidden rounded-lg border border-forest/12 bg-paper">
            <div className="hatch aspect-[16/10] bg-forest/6" />
            <div className="space-y-2.5 p-4">
              <div className="h-2.5 w-24 rounded bg-forest/10" />
              <div className="h-4 w-4/5 rounded bg-forest/12" />
              <div className="h-3 w-3/5 rounded bg-forest/8" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
