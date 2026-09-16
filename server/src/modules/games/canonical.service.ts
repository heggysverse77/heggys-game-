import { pool } from '../../config/db.js';
import { normalizeArabicText, calculateSimilarity, getConceptKey } from '../../utils/arabic.nlp.js';

export interface CanonicalResolution {
  rawText: string;
  normalizedText: string;
  canonicalKey: string;
  isCustomSecret: boolean;
}

/**
 * Resolves a player's raw answer into a standardized Canonical Key
 * Handles multi-lingual synonyms, dialects, and falls back to dynamic custom hashes.
 */
export const resolveCanonicalAnswer = async (rawText: string): Promise<CanonicalResolution> => {
  const normalizedText = normalizeArabicText(rawText);

  if (!normalizedText) {
    return {
      rawText,
      normalizedText: '',
      canonicalKey: 'EMPTY',
      isCustomSecret: true,
    };
  }

  // 1. In-memory fast bilingual concepts match (e.g. 'جيتار' / 'guitar' -> 'GUITAR', 'احمر' / 'red' -> 'RED')
  const conceptKey = getConceptKey(normalizedText);
  if (conceptKey) {
    return {
      rawText,
      normalizedText,
      canonicalKey: conceptKey,
      isCustomSecret: false,
    };
  }

  // 2. Query the answer_aliases table for exact normalized synonym match
  const aliasQuery = `
    SELECT ca.canonical_key 
    FROM answer_aliases aa
    JOIN canonical_answers ca ON aa.canonical_id = ca.id
    WHERE aa.alias_normalized = $1
    LIMIT 1;
  `;

  const result = await pool.query(aliasQuery, [normalizedText]);

  if (result.rows.length > 0) {
    return {
      rawText,
      normalizedText,
      canonicalKey: result.rows[0].canonical_key,
      isCustomSecret: false,
    };
  }

  // 2. Open-ended / custom secret answer fallback
  return {
    rawText,
    normalizedText,
    canonicalKey: `CUSTOM:${normalizedText}`,
    isCustomSecret: true,
  };
};

/**
 * Checks if an answer is duplicate or semantically similar to any other player's answer in the current round
 */
export const isCanonicalAnswerTakenInRound = async (
  roundId: string,
  canonicalKey: string,
  currentPlayerId: string,
  candidateText?: string
): Promise<boolean> => {
  const query = `
    SELECT id, raw_text, normalized_text, canonical_key 
    FROM round_answers 
    WHERE round_id = $1 
      AND game_player_id != $2;
  `;

  const result = await pool.query(query, [roundId, currentPlayerId]);

  if (result.rows.length === 0) {
    return false;
  }

  const candidateNorm = candidateText ? normalizeArabicText(candidateText) : '';

  for (const row of result.rows) {
    // 1. Exact canonical key match (e.g. synonyms like burger/hamburger)
    if (canonicalKey && canonicalKey !== 'EMPTY' && row.canonical_key === canonicalKey) {
      return true;
    }

    // 2. Normalized text match
    if (candidateNorm && row.normalized_text === candidateNorm) {
      return true;
    }

    // 3. NLP Semantic Fuzzy Similarity (e.g. "ليمون نعناع" vs "لمون نعناع" vs "ليمون ونعناع")
    if (candidateText && row.raw_text) {
      const similarity = calculateSimilarity(candidateText, row.raw_text);
      if (similarity >= 0.75) {
        return true;
      }
    }
  }

  return false;
};
