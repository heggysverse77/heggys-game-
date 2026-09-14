import { normalizeArabicText, calculateSimilarity, isSemanticDuplicate } from '../src/utils/arabic.nlp.js';

const testCases = [
  // 1. Alef variations & typos
  { a: 'إيطاليا', b: 'ايطاليا', expectedDuplicate: true, desc: 'همزة الألف (إيطاليا vs ايطاليا)' },
  { a: 'ألمانيا', b: 'المانيا', expectedDuplicate: true, desc: 'همزة الألف (ألمانيا vs المانيا)' },
  { a: 'أحمد', b: 'احمد', expectedDuplicate: true, desc: 'همزة الألف (أحمد vs احمد)' },

  // 2. Definite article (ال)
  { a: 'بيتزا', b: 'البيتزا', expectedDuplicate: true, desc: 'أداة التعريف ال (بيتزا vs البيتزا)' },
  { a: 'شاورما', b: 'الشاورما', expectedDuplicate: true, desc: 'أداة التعريف ال (شاورما vs الشاورما)' },
  { a: 'مانجو', b: 'المانجو', expectedDuplicate: true, desc: 'أداة التعريف ال (مانجو vs المانجو)' },

  // 3. Taa Marbouta / Haa & Yaa variations
  { a: 'قهوة', b: 'قهوه', expectedDuplicate: true, desc: 'تاء مربوطة vs هاء (قهوة vs قهوه)' },
  { a: 'شاي أخضر', b: 'شاي اخضر', expectedDuplicate: true, desc: 'ياء وألف (شاي أخضر vs شاي اخضر)' },

  // 4. Repeated elongated letters (مط الحروف)
  { a: 'شاورمااااا', b: 'شاورما', expectedDuplicate: true, desc: 'مط الحروف (شاورمااااا vs شاورما)' },
  { a: 'بورشششش', b: 'بورش', expectedDuplicate: true, desc: 'مط الحروف (بورشششش vs بورش)' },

  // 5. Diacritics (التشكيل)
  { a: 'لَيْمُون', b: 'ليمون', expectedDuplicate: true, desc: 'التشكيل والحركات (لَيْمُون vs ليمون)' },

  // 6. Egyptian Colloquial / Fuzzy similarity
  { a: 'ليمون نعناع', b: 'لمون نعناع', expectedDuplicate: true, desc: 'عامية مصرية (ليمون نعناع vs لمون نعناع)' },
  { a: 'سوشي سلمون', b: 'سوشي سالمون', expectedDuplicate: true, desc: 'نطق معرب (سوشي سلمون vs سوشي سالمون)' },

  // 7. Distinct answers (Must NOT be duplicates)
  { a: 'شاورما لحمة', b: 'شاورما دجاج', expectedDuplicate: false, desc: 'إجابات مختلفة (شاورما لحمة vs شاورما دجاج)' },
  { a: 'مانجو', b: 'فراولة', expectedDuplicate: false, desc: 'إجابات مختلفة تماماً (مانجو vs فراولة)' },
  { a: 'إيطاليا', b: 'إسبانيا', expectedDuplicate: false, desc: 'إجابات مختلفة (إيطاليا vs إسبانيا)' },
  { a: 'قهوة تركي', b: 'قهوة اسبريسو', expectedDuplicate: false, desc: 'أنواع مختلفة (قهوة تركي vs قهوة اسبريسو)' },
];

console.log('==================================================');
console.log('🧪 Testing Arabic NLP Semantic Deduplication Layer');
console.log('==================================================\n');

let passedCount = 0;

for (const tc of testCases) {
  const normA = normalizeArabicText(tc.a);
  const normB = normalizeArabicText(tc.b);
  const sim = calculateSimilarity(tc.a, tc.b);
  const isDup = sim >= 0.75 || normA === normB;

  const passed = isDup === tc.expectedDuplicate;
  if (passed) passedCount++;

  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusIcon} | ${tc.desc}`);
  console.log(`   "${tc.a}" vs "${tc.b}"`);
  console.log(`   Norm: "${normA}" vs "${normB}"`);
  console.log(`   Similarity: ${(sim * 100).toFixed(0)}% | Result: ${isDup ? 'مكررة (Duplicate)' : 'مختلفة (Unique)'}\n`);
}

console.log('==================================================');
console.log(`🎯 Test Summary: ${passedCount}/${testCases.length} Tests Passed`);
console.log('==================================================');
