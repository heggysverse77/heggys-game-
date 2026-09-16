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

// English, Franco, and Arabic standalone article words to strip when comparing answers
const ARTICLE_WORDS = new Set(['the', 'a', 'an', 'el', 'al', 'ال']);

/**
 * Strips Arabic definite article (ال) from words longer than 3 characters (e.g. البيتزا -> بيتزا),
 * strips standalone 'ال' (e.g. "ال جيتار" -> "جيتار"),
 * and strips English/Franco articles (the, a, an, el, al).
 * e.g. "البيتزا" -> "بيتزا", "ال جيتار" -> "جيتار", "the guiter" -> "guiter", "the guitar" -> "guitar", "el ahly" -> "ahly"
 */
export const removeDefiniteArticle = (text: string): string => {
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) return '';

  // 1. Strip Arabic attached 'ال' from words longer than 3 characters
  let processed = words.map((word) =>
    word.startsWith('ال') && word.length > 3 ? word.slice(2) : word
  );

  // 2. Strip standalone English, Franco, or Arabic articles if other words remain
  if (processed.length > 1) {
    const withoutArticles = processed.filter(
      (w) => !ARTICLE_WORDS.has(w.toLowerCase())
    );
    if (withoutArticles.length > 0) {
      processed = withoutArticles;
    }
  }

  return processed.join(' ');
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
 * Comprehensive Bilingual (Arabic <-> English) Semantic Concept Dictionary
 * Maps common Arabic answers and their English/Franco equivalents to a unified Canonical Concept Key.
 */
export const BILINGUAL_CONCEPTS: Record<string, string> = {
  // Musical Instruments
  'جيتار': 'GUITAR', 'الجيتار': 'GUITAR', 'guitar': 'GUITAR', 'guiter': 'GUITAR', 'gitar': 'GUITAR',
  'بيانو': 'PIANO', 'البيانو': 'PIANO', 'piano': 'PIANO',
  'عود': 'OUD', 'العود': 'OUD', 'oud': 'OUD',
  'درامز': 'DRUMS', 'طبلة': 'DRUMS', 'drums': 'DRUMS', 'drum': 'DRUMS',
  'كمان': 'VIOLIN', 'الكمان': 'VIOLIN', 'كمانجة': 'VIOLIN', 'violin': 'VIOLIN',
  'ناي': 'FLUTE', 'فلوت': 'FLUTE', 'flute': 'FLUTE',
  'ساكسفون': 'SAXOPHONE', 'saxophone': 'SAXOPHONE', 'sax': 'SAXOPHONE',
  'قانون': 'QANUN', 'qanun': 'QANUN',

  // Colors
  'احمر': 'RED', 'red': 'RED',
  'ازرق': 'BLUE', 'blue': 'BLUE',
  'اخضر': 'GREEN', 'green': 'GREEN',
  'اصفر': 'YELLOW', 'yellow': 'YELLOW',
  'اسود': 'BLACK', 'black': 'BLACK',
  'ابيض': 'WHITE', 'white': 'WHITE',
  'برتقالي': 'ORANGE', 'orange': 'ORANGE',
  'بنفسجي': 'PURPLE', 'موف': 'PURPLE', 'purple': 'PURPLE', 'violet': 'PURPLE',
  'وردي': 'PINK', 'بينك': 'PINK', 'pink': 'PINK',
  'رمادي': 'GREY', 'رصاصي': 'GREY', 'grey': 'GREY', 'gray': 'GREY',
  'بني': 'BROWN', 'brown': 'BROWN',
  'كحلي': 'NAVY', 'navy': 'NAVY',
  'سماوي': 'CYAN', 'cyan': 'CYAN',

  // Animals
  'اسد': 'LION', 'lion': 'LION',
  'نمر': 'TIGER', 'tiger': 'TIGER',
  'فهد': 'CHEETAH', 'cheetah': 'CHEETAH', 'leopard': 'CHEETAH',
  'كلب': 'DOG', 'dog': 'DOG',
  'قطة': 'CAT', 'قط': 'CAT', 'بسة': 'CAT', 'cat': 'CAT',
  'حصان': 'HORSE', 'خيل': 'HORSE', 'horse': 'HORSE',
  'قرد': 'MONKEY', 'نسناس': 'MONKEY', 'monkey': 'MONKEY',
  'دب': 'BEAR', 'bear': 'BEAR',
  'ذئب': 'WOLF', 'ديب': 'WOLF', 'wolf': 'WOLF',
  'ثعلب': 'FOX', 'fox': 'FOX',
  'فيل': 'ELEPHANT', 'elephant': 'ELEPHANT',
  'زرافة': 'GIRAFFE', 'giraffe': 'GIRAFFE',
  'حمار وحشي': 'ZEBRA', 'zebra': 'ZEBRA',
  'تمساح': 'CROCODILE', 'crocodile': 'CROCODILE',
  'قرش': 'SHARK', 'shark': 'SHARK',
  'دولفين': 'DOLPHIN', 'dolphin': 'DOLPHIN',
  'حوت': 'WHALE', 'whale': 'WHALE',
  'صقر': 'FALCON', 'falcon': 'FALCON', 'hawk': 'FALCON',
  'نسر': 'EAGLE', 'eagle': 'EAGLE',
  'بومة': 'OWL', 'owl': 'OWL',
  'طاووس': 'PEACOCK', 'peacock': 'PEACOCK',
  'بطريق': 'PENGUIN', 'penguin': 'PENGUIN',
  'ارنب': 'RABBIT', 'rabbit': 'RABBIT',
  'سلحفاة': 'TURTLE', 'turtle': 'TURTLE',
  'باندا': 'PANDA', 'panda': 'PANDA',
  'كوالا': 'KOALA', 'koala': 'KOALA',

  // Foods & Drinks
  'بيتزا': 'PIZZA', 'pizza': 'PIZZA',
  'برجر': 'BURGER', 'همبرجر': 'BURGER', 'burger': 'BURGER', 'hamburger': 'BURGER',
  'شاورما': 'SHAWARMA', 'شاورمه': 'SHAWARMA', 'shawarma': 'SHAWARMA', 'shawerma': 'SHAWARMA',
  'سوشي': 'SUSHI', 'sushi': 'SUSHI',
  'كشري': 'KOSHARY', 'koshary': 'KOSHARY', 'koshari': 'KOSHARY',
  'ملوخية': 'MOLOKHIA', 'ملوخيه': 'MOLOKHIA', 'molokhia': 'MOLOKHIA',
  'فراخ': 'CHICKEN', 'دجاج': 'CHICKEN', 'فراخ مقلية': 'CHICKEN', 'chicken': 'CHICKEN', 'kfc': 'CHICKEN',
  'لحمة': 'MEAT', 'لحم': 'MEAT', 'meat': 'MEAT', 'steak': 'MEAT',
  'سمك': 'FISH', 'fish': 'FISH',
  'جمبري': 'SHRIMP', 'shrimp': 'SHRIMP',
  'مكرونة': 'PASTA', 'باستا': 'PASTA', 'pasta': 'PASTA',
  'شاي': 'TEA', 'tea': 'TEA',
  'قهوة': 'COFFEE', 'قهوه': 'COFFEE', 'اسبريسو': 'COFFEE', 'coffee': 'COFFEE', 'espresso': 'COFFEE',
  'بيبسي': 'PEPSI', 'pepsi': 'PEPSI',
  'كولا': 'COCA_COLA', 'كوكاكولا': 'COCA_COLA', 'cola': 'COCA_COLA', 'coca cola': 'COCA_COLA', 'coke': 'COCA_COLA',
  'ماء': 'WATER', 'مية': 'WATER', 'water': 'WATER',
  'مانجو': 'MANGO', 'مانجه': 'MANGO', 'mango': 'MANGO',
  'فراولة': 'STRAWBERRY', 'فراوله': 'STRAWBERRY', 'strawberry': 'STRAWBERRY',
  'موز': 'BANANA', 'banana': 'BANANA',
  'تفاح': 'APPLE', 'apple': 'APPLE',
  'برتقال': 'ORANGE',
  'بطيخ': 'WATERMELON', 'watermelon': 'WATERMELON',
  'عنب': 'GRAPES', 'grapes': 'GRAPES',
  'ايس كريم': 'ICE_CREAM', 'جيلاتي': 'ICE_CREAM', 'ice cream': 'ICE_CREAM',
  'شوكولاتة': 'CHOCOLATE', 'شوكولاته': 'CHOCOLATE', 'chocolate': 'CHOCOLATE',
  'تشيز كيك': 'CHEESECAKE', 'cheesecake': 'CHEESECAKE',
  'دوناتس': 'DONUTS', 'donuts': 'DONUTS', 'donut': 'DONUTS',

  // Tech & Brands
  'مرسيدس': 'MERCEDES', 'mercedes': 'MERCEDES', 'benz': 'MERCEDES',
  'بي ام': 'BMW', 'بي ام دبليو': 'BMW', 'bmw': 'BMW',
  'اودي': 'AUDI', 'audi': 'AUDI',
  'بورش': 'PORSCHE', 'porsche': 'PORSCHE',
  'فيراري': 'FERRARI', 'ferrari': 'FERRARI',
  'لمبورجيني': 'LAMBORGHINI', 'lamborghini': 'LAMBORGHINI',
  'تويوتا': 'TOYOTA', 'toyota': 'TOYOTA',
  'هيونداي': 'HYUNDAI', 'hyundai': 'HYUNDAI',
  'كيا': 'KIA', 'kia': 'KIA',
  'هوندا': 'HONDA', 'honda': 'HONDA',
  'نيسان': 'NISSAN', 'nissan': 'NISSAN',
  'تسلا': 'TESLA', 'tesla': 'TESLA',
  'نايكي': 'NIKE', 'نايك': 'NIKE', 'nike': 'NIKE',
  'اديداس': 'ADIDAS', 'adidas': 'ADIDAS',
  'بوما': 'PUMA', 'puma': 'PUMA',
  'زارا': 'ZARA', 'zara': 'ZARA',
  'ابل': 'APPLE', 'ايفون': 'IPHONE', 'iphone': 'IPHONE',
  'سامسونج': 'SAMSUNG', 'samsung': 'SAMSUNG',
  'بلايستيشن': 'PLAYSTATION', 'بلايستيشن 5': 'PLAYSTATION', 'playstation': 'PLAYSTATION', 'ps5': 'PLAYSTATION', 'ps4': 'PLAYSTATION',
  'اكس بوكس': 'XBOX', 'xbox': 'XBOX',
  'كمبيوتر': 'COMPUTER', 'pc': 'COMPUTER', 'computer': 'COMPUTER',
  'لابتوب': 'LAPTOP', 'laptop': 'LAPTOP',

  // Pop culture & Superheroes
  'باتمان': 'BATMAN', 'batman': 'BATMAN',
  'سوبرمان': 'SUPERMAN', 'superman': 'SUPERMAN',
  'سبايدرمان': 'SPIDERMAN', 'سبايدر مان': 'SPIDERMAN', 'spiderman': 'SPIDERMAN', 'spider man': 'SPIDERMAN',
  'ايرون مان': 'IRONMAN', 'iron man': 'IRONMAN', 'ironman': 'IRONMAN',
  'هالك': 'HULK', 'hulk': 'HULK',
  'ثور': 'THOR', 'thor': 'THOR',
  'كابتن امريكا': 'CAPTAIN_AMERICA', 'captain america': 'CAPTAIN_AMERICA',
  'ديدبول': 'DEADPOOL', 'deadpool': 'DEADPOOL',
  'ولفرين': 'WOLVERINE', 'wolverine': 'WOLVERINE',
  'جوكر': 'JOKER', 'الجوكر': 'JOKER', 'joker': 'JOKER',
  'فلاش': 'FLASH', 'flash': 'FLASH',
  'ناروتو': 'NARUTO', 'naruto': 'NARUTO',
  'لوفي': 'LUFFY', 'luffy': 'LUFFY',
  'غوكو': 'GOKU', 'جوكو': 'GOKU', 'goku': 'GOKU',
  'كونان': 'CONAN', 'المحقق كونان': 'CONAN', 'conan': 'CONAN',
  'توم وجيري': 'TOM_AND_JERRY', 'tom and jerry': 'TOM_AND_JERRY',
  'سبونج بوب': 'SPONGEBOB', 'spongebob': 'SPONGEBOB',
  'ميكي ماوس': 'MICKEY_MOUSE', 'mickey mouse': 'MICKEY_MOUSE', 'mickey': 'MICKEY_MOUSE',

  // Football & Sports
  'ميسي': 'MESSI', 'messi': 'MESSI', 'lionel messi': 'MESSI',
  'رونالدو': 'RONALDO', 'كريستيانو': 'RONALDO', 'ronaldo': 'RONALDO', 'cr7': 'RONALDO',
  'محمد صلاح': 'SALAH', 'صلاح': 'SALAH', 'salah': 'SALAH', 'mo salah': 'SALAH',
  'نيمار': 'NEYMAR', 'neymar': 'NEYMAR',
  'مبابي': 'MBAPPE', 'mbappe': 'MBAPPE',
  'هالاند': 'HAALAND', 'haaland': 'HAALAND',
  'الاهلي': 'AHLY', 'ahly': 'AHLY', 'al ahly': 'AHLY', 'el ahly': 'AHLY',
  'الزمالك': 'ZAMALEK', 'zamalek': 'ZAMALEK', 'el zamalek': 'ZAMALEK',
  'ريال مدريد': 'REAL_MADRID', 'real madrid': 'REAL_MADRID',
  'برشلونة': 'BARCELONA', 'barcelona': 'BARCELONA', 'barca': 'BARCELONA',
  'ليفربول': 'LIVERPOOL', 'liverpool': 'LIVERPOOL',
  'مانشستر سيتي': 'MAN_CITY', 'manchester city': 'MAN_CITY', 'man city': 'MAN_CITY',
  'مانشستر يونايتد': 'MAN_UNITED', 'manchester united': 'MAN_UNITED', 'man united': 'MAN_UNITED',
  'كرة قدم': 'FOOTBALL', 'كورة': 'FOOTBALL', 'football': 'FOOTBALL', 'soccer': 'FOOTBALL',
  'كرة سلة': 'BASKETBALL', 'باسكت': 'BASKETBALL', 'basketball': 'BASKETBALL',
  'تنس': 'TENNIS', 'tennis': 'TENNIS',
  'سباحة': 'SWIMMING', 'swimming': 'SWIMMING',
  'ملاكمة': 'BOXING', 'boxing': 'BOXING',
  'شطرنج': 'CHESS', 'chess': 'CHESS',

  // Countries & Astronomy
  'مصر': 'EGYPT', 'egypt': 'EGYPT',
  'ايطاليا': 'ITALY', 'italy': 'ITALY',
  'فرنسا': 'FRANCE', 'france': 'FRANCE',
  'اسبانيا': 'SPAIN', 'spain': 'SPAIN',
  'المانيا': 'GERMANY', 'germany': 'GERMANY',
  'انجلترا': 'ENGLAND', 'بريطانيا': 'ENGLAND', 'england': 'ENGLAND', 'uk': 'ENGLAND',
  'امريكا': 'USA', 'america': 'USA', 'usa': 'USA',
  'اليابان': 'JAPAN', 'japan': 'JAPAN',
  'الصين': 'CHINA', 'china': 'CHINA',
  'روسيا': 'RUSSIA', 'russia': 'RUSSIA',
  'البرازيل': 'BRAZIL', 'brazil': 'BRAZIL',
  'الارجنتين': 'ARGENTINA', 'argentina': 'ARGENTINA',
  'المريخ': 'MARS', 'mars': 'MARS',
  'المشتري': 'JUPITER', 'jupiter': 'JUPITER',
  'زحل': 'SATURN', 'saturn': 'SATURN',
  'عطارد': 'MERCURY', 'mercury': 'MERCURY',
  'الزهرة': 'VENUS', 'venus': 'VENUS',
  'الارض': 'EARTH', 'earth': 'EARTH',
};

/**
 * Returns concept key for a normalized answer if present in dictionary
 */
export const getConceptKey = (text: string): string | null => {
  if (!text) return null;
  const direct = BILINGUAL_CONCEPTS[text];
  if (direct) return direct;

  const normalized = normalizeArabicText(text);
  return BILINGUAL_CONCEPTS[normalized] ?? null;
};

/**
 * Transliterates Arabic characters to Latin phonetic equivalents
 * Enables cross-script fuzzy matching between Arabic and Franco/English transliterations.
 */
export const transliterateArabicToLatin = (text: string): string => {
  const charMap: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ٱ': 'a',
    'ب': 'b',
    'ت': 't', 'ط': 't',
    'ث': 'th', 'س': 's', 'ص': 's',
    'ج': 'g', // Egyptian pronunciation (e.g. gitar, burger)
    'ح': 'h', 'ه': 'h',
    'خ': 'kh',
    'د': 'd', 'ض': 'd',
    'ذ': 'z', 'ز': 'z', 'ظ': 'z',
    'ر': 'r',
    'ش': 'sh',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'k', 'ك': 'k',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'و': 'o',
    'ي': 'i', 'ى': 'i',
    'ة': 'a',
  };
  return text
    .split('')
    .map((c) => charMap[c] ?? c)
    .join('');
};

/**
 * Checks if a string contains Arabic script characters
 */
const hasArabicScript = (str: string): boolean => /[\u0600-\u06FF]/.test(str);

/**
 * Checks if a string contains Latin characters
 */
const hasLatinScript = (str: string): boolean => /[a-z]/i.test(str);

/**
 * Calculates similarity percentage (0.0 to 1.0) between two Arabic or mixed Arabic/English strings
 */
export const calculateSimilarity = (textA: string, textB: string): number => {
  const normA = normalizeArabicText(textA);
  const normB = normalizeArabicText(textB);

  if (normA === normB) return 1.0;
  if (!normA.length || !normB.length) return 0.0;

  // 1. Check Bilingual Concept Dictionary (e.g. "جيتار" vs "guitar", "احمر" vs "red")
  const conceptA = getConceptKey(normA);
  const conceptB = getConceptKey(normB);
  if (conceptA && conceptB && conceptA === conceptB) {
    return 1.0;
  }

  // 2. Cross-lingual phonetic comparison (One Arabic, One English/Franco)
  const isAArabic = hasArabicScript(normA);
  const isBArabic = hasArabicScript(normB);
  const isALatin = hasLatinScript(normA);
  const isBLatin = hasLatinScript(normB);

  if ((isAArabic && isBLatin) || (isALatin && isBArabic)) {
    const latinFromAr = transliterateArabicToLatin(isAArabic ? normA : normB);
    const latinTarget = isAArabic ? normB : normA;

    if (latinFromAr === latinTarget) return 1.0;

    const crossDistance = calculateLevenshteinDistance(latinFromAr, latinTarget);
    const crossMaxLen = Math.max(latinFromAr.length, latinTarget.length);
    const crossSim = parseFloat(((crossMaxLen - crossDistance) / crossMaxLen).toFixed(2));

    if (crossSim >= 0.75) {
      return crossSim;
    }
  }

  // 3. Standard Levenshtein distance on normalized text
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
  threshold: number = 0.75
): boolean => {
  return calculateSimilarity(answerA, answerB) >= threshold;
};
