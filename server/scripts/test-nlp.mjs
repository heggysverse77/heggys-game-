// Test NLP similarity script
import {
  calculateSimilarity,
  isSemanticDuplicate,
  normalizeArabicText,
  getConceptKey,
} from '../src/utils/arabic.nlp.ts';

const pairs = [
  ['برجر', 'burger'],
  ['برجر', 'همبرجر'],
  ['hamburger', 'burger'],
  ['hamburger', 'برجر'],
  ['بيتزا', 'pizza'],
  ['شاورما', 'shawerma'],
  ['ميسي', 'messi'],
  ['كريستيانو رونالدو', 'رونالدو'],
  ['الاهلي', 'al ahly'],
  ['برجر', 'تفاح'],
  ['شاي', 'قهوة']
];

console.log('--- NLP ENGINE VERIFICATION ---');
for (const [a, b] of pairs) {
  const sim = calculateSimilarity(a, b);
  const dup = isSemanticDuplicate(a, b);
  console.log(`${a} <--> ${b} => Similarity: ${sim} | IsDuplicate: ${dup}`);
}
