/** Strip Arabic diacritics (tashkeel) */
export function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

/** Remove kashida (tatweel) */
export function removeTatweel(text: string): string {
  return text.replace(/\u0640/g, '');
}

/** Normalize alef variants → ا */
export function normalizeAlef(text: string): string {
  return text.replace(/[أإآ]/g, 'ا');
}

/** Normalize teh marbuta → ه */
export function normalizeTeh(text: string): string {
  return text.replace(/ة/g, 'ه');
}

/** Normalize alef maqsura → ي */
export function normalizeYa(text: string): string {
  return text.replace(/ى/g, 'ي');
}

/** Full normalization pipeline (mirrors backend arabic.nlp.ts) */
export function normalizeArabic(text: string): string {
  return normalizeYa(normalizeTeh(normalizeAlef(removeTatweel(stripDiacritics(text.trim())))));
}
