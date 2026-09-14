/**
 * Arabic NLP Processing Layer for 'اعرف صاحبك وعلّم عليه'
 * Provides text normalization, diacritics stripping, character deduplication,
 * and semantic/fuzzy similarity checking.
 */

// Unicode ranges for Arabic Diacritics (Tashkeel)
const TASHKEEL_REGEX = /[\u064B-\u0652\u0670\u0640]/g;

// Tatweel (Kashida)
const TATWEEL_REGEX = /\u0640/g;

// Punctuation and non-alphanumeric except spaces
const PUNCTUATION_REGEX = /[^\p{L}\p{N}\s]/gu;

/**
 * Strips Arabic Tashkeel (diacritics: Fatha, Damma, Kasra, Tanween, Shadda, Sukun)
 */
export const removeTashkeel = (text: string): string => {
  return text.replace(TASHKEEL_REGEX, '');
};

/**
 * Strips Tatweel/Kashida (ـ)
 */
export const removeTatweel = (text: string): string => {
  return text.replace(TATWEEL_REGEX, '');
};

/**
 * Normalizes different forms of Alef (أ, إ, آ, ٱ) to a standard bare Alef (ا)
 */
export const normalizeAlef = (text: string): string => {
  return text.replace(/[إأآٱ]/g, 'ا');
};

/**
 * Normalizes Taa Marbouta (ة) to Haa (ه)
 */
export const normalizeTaaMarbouta = (text: string): string => {
  return text.replace(/ة/g, 'ه');
};

/**
 * Normalizes Alef Maqsoura (ى) to Yaa (ي)
 */
export const normalizeYaa = (text: string): string => {
  return text.replace(/ى/g, 'ي');
};

/**
 * Collapses multiple consecutive repeated letters to a maximum of 2 occurrences
 * e.g., "لااااااااا" -> "لا", "هههههههههه" -> "هه"
 */
export const collapseRepeatedChars = (text: string): string => {
  return text.replace(/(.)\1{2,}/g, '$1$1');
};

/**
 * Strips Arabic definite article (ال) from words longer than 3 characters
 * e.g. "البيتزا" -> "بيتزا", "الشاورما" -> "شاورما", "المانجو" -> "مانجو"
 */
export const removeDefiniteArticle = (text: string): string => {
  return text
    .split(' ')
    .map((word) => (word.startsWith('ال') && word.length > 3 ? word.slice(2) : word))
    .join(' ');
};

/**
 * Comprehensive Arabic Text Normalization Pipeline
 * Prepares raw text for clean storage, indexing, and matching comparison.
 */
export const normalizeArabicText = (rawText: string): string => {
  if (!rawText) return '';

  let normalized = rawText.trim().toLowerCase();

  // 1. Remove Tashkeel & Tatweel
  normalized = removeTashkeel(normalized);
  normalized = removeTatweel(normalized);

  // 2. Normalize letter variations (Alef, Taa Marbouta, Yaa)
  normalized = normalizeAlef(normalized);
  normalized = normalizeTaaMarbouta(normalized);
  normalized = normalizeYaa(normalized);

  // 3. Collapse elongated letters
  normalized = collapseRepeatedChars(normalized);

  // 4. Remove punctuation
  normalized = normalized.replace(PUNCTUATION_REGEX, ' ');

  // 5. Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // 6. Strip leading definite article 'ال' for semantic equivalence
  normalized = removeDefiniteArticle(normalized);

  return normalized;
};

/**
 * Computes Levenshtein edit distance between two strings
 */
export const calculateLevenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

/**
 * Calculates similarity percentage (0.0 to 1.0) between two Arabic strings
 */
export const calculateSimilarity = (textA: string, textB: string): number => {
  const normA = normalizeArabicText(textA);
  const normB = normalizeArabicText(textB);

  if (normA === normB) return 1.0;
  if (!normA.length || !normB.length) return 0.0;

  const distance = calculateLevenshteinDistance(normA, normB);
  const maxLength = Math.max(normA.length, normB.length);

  return parseFloat(((maxLength - distance) / maxLength).toFixed(2));
};

/**
 * Determines if two answers are semantically/textually duplicate (>= threshold)
 */
export const isSemanticDuplicate = (
  answerA: string,
  answerB: string,
  threshold: number = 0.85
): boolean => {
  return calculateSimilarity(answerA, answerB) >= threshold;
};
