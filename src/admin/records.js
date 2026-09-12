import { categories } from '@/data/archive';

/**
 * Kategori yang boleh disimpan: chip filter Royal Archive tanpa "All". Diambil
 * dari data situs supaya urutan dan ejaannya tidak bisa berbeda; backend
 * memakai enum yang sama (People, Places, Events, Artifacts, Documents).
 */
export const CATEGORIES = categories.filter((category) => category !== 'All');

/** Sama dengan batas DTO backend. */
export const LIMITS = { title: 200, description: 1000, era: 60 };

export const EMPTY_RECORD = {
  title: '',
  description: '',
  category: '',
  era: '',
  imageUrl: '',
  externalUrl: '',
  isPublished: true,
};

export function toFormValues(record) {
  return {
    title: record.title,
    description: record.description,
    category: record.category,
    era: record.era,
    imageUrl: record.imageUrl,
    externalUrl: record.externalUrl,
    isPublished: record.isPublished,
  };
}

export function toPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    era: values.era.trim(),
    imageUrl: values.imageUrl,
    externalUrl: values.externalUrl.trim(),
    isPublished: values.isPublished,
  };
}

/**
 * Aturan yang sama dengan backend, supaya kesalahan tertangkap sebelum request
 * dikirim. Pesannya lewat `t`, jadi ikut berganti saat bahasa dasbor diganti.
 */
export function validateRecord(values, t) {
  const errors = {};
  const title = values.title.trim();
  const era = values.era.trim();
  const description = values.description.trim();

  if (!values.imageUrl) errors.imageUrl = t('validation.imageRequired');

  if (!title) errors.title = t('validation.titleRequired');
  else if (title.length > LIMITS.title) errors.title = t('validation.titleMax', { max: LIMITS.title });

  if (!description) errors.description = t('validation.descriptionRequired');
  else if (description.length > LIMITS.description) {
    errors.description = t('validation.descriptionMax', { max: LIMITS.description });
  }

  if (!CATEGORIES.includes(values.category)) errors.category = t('validation.categoryRequired');

  if (!era) errors.era = t('validation.eraRequired');
  else if (era.length > LIMITS.era) errors.era = t('validation.eraMax', { max: LIMITS.era });

  if (!isHttpsUrl(values.externalUrl.trim())) errors.externalUrl = t('validation.urlInvalid');

  return errors;
}

/** Backend menolak URL tanpa https dan tanpa domain bertitik; di sini dicek lebih awal. */
function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}
