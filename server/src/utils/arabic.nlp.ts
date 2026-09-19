/**
 * Arabic NLP Processing Layer for 'اعرف صاحبك وعلّم عليه'
 * Provides text normalization, diacritics stripping, character deduplication,
 * light Arabic stemming, N-gram subword vector similarity (FastText/Word2Vec style),
 * Jaro-Winkler string similarity, and bilingual concept matching.
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
 */
export const removeDefiniteArticle = (text: string): string => {
  const words = text.split(' ').filter(Boolean);
  if (words.length === 0) return '';

  let processed = words.map((word) => {
    if (word.startsWith('ال') && word.length > 3) return word.slice(2);
    if (word.startsWith('وال') && word.length > 4) return word.slice(3);
    if (word.startsWith('فال') && word.length > 4) return word.slice(3);
    if (word.startsWith('بال') && word.length > 4) return word.slice(3);
    if (word.startsWith('كال') && word.length > 4) return word.slice(3);
    if (word.startsWith('لل') && word.length > 3) return word.slice(2);
    return word;
  });

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
 * Light Arabic stemmer for removing common prefixes and suffixes
 */
export const stemArabicWord = (word: string): string => {
  if (word.length <= 3) return word;
  let s = word;

  // Suffixes
  const suffixes = ['ات', 'ان', 'ين', 'ون', 'ية', 'يه', 'ها', 'هم', 'هن', 'كم', 'نا', 'ي', 'ك', 'ه'];
  for (const suf of suffixes) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) {
      s = s.slice(0, -suf.length);
      break;
    }
  }

  // Prefixes (e.g. 'و', 'ف', 'ب', 'ك', 'ل')
  const prefixes = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ك', 'ل'];
  for (const pre of prefixes) {
    if (s.startsWith(pre) && s.length - pre.length >= 3) {
      s = s.slice(pre.length);
      break;
    }
  }

  return s;
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
 * Jaro-Winkler Similarity (0.0 to 1.0)
 * Highly effective for short string comparisons, typo tolerance, and names.
 */
export const calculateJaroWinklerSimilarity = (s1: string, s2: string): number => {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3;

  // Winkler prefix scaling (max 4 prefix characters)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
};

/**
 * N-gram Character Embedding Similarity (FastText / Subword Word2Vec approximation)
 * Computes cosine-like overlap across 2-grams and 3-grams.
 */
export const calculateNgramCosineSimilarity = (s1: string, s2: string): number => {
  const getGrams = (text: string): Map<string, number> => {
    const map = new Map<string, number>();
    const padded = `_${text}_`;
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= padded.length - n; i++) {
        const gram = padded.slice(i, i + n);
        map.set(gram, (map.get(gram) || 0) + 1);
      }
    }
    return map;
  };

  const g1 = getGrams(s1);
  const g2 = getGrams(s2);

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  g1.forEach((val, key) => {
    mag1 += val * val;
    if (g2.has(key)) {
      dotProduct += val * (g2.get(key) || 0);
    }
  });

  g2.forEach((val) => {
    mag2 += val * val;
  });

  if (mag1 === 0 || mag2 === 0) return 0.0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

/**
 * Comprehensive Bilingual (Arabic <-> English) Semantic Concept Dictionary
 * Maps common Arabic answers and their English/Franco equivalents to a unified Canonical Concept Key.
 */
export const BILINGUAL_CONCEPTS: Record<string, string> = {
  // Burgers & Fast Food
  'برجر': 'BURGER', 'همبرجر': 'BURGER', 'هَمْبَرْجَرْ': 'BURGER', 'البرجر': 'BURGER', 'الهمبرجر': 'BURGER',
  'بورجر': 'BURGER', 'تشيز برجر': 'BURGER', 'تشيزبرجر': 'BURGER', 'ساندوتش برجر': 'BURGER',
  'burger': 'BURGER', 'hamburger': 'BURGER', 'hamburgers': 'BURGER', 'burgers': 'BURGER',
  'cheeseburger': 'BURGER', 'borger': 'BURGER', 'borgar': 'BURGER', 'hamborger': 'BURGER',

  // Pizza
  'بيتزا': 'PIZZA', 'بتزا': 'PIZZA', 'البيتزا': 'PIZZA', 'pizza': 'PIZZA', 'pizzas': 'PIZZA', 'piza': 'PIZZA',

  // Shawarma
  'شاورما': 'SHAWARMA', 'شاورمه': 'SHAWARMA', 'الشاورما': 'SHAWARMA', 'شورما': 'SHAWARMA',
  'shawarma': 'SHAWARMA', 'shawerma': 'SHAWARMA', 'shwrma': 'SHAWARMA',

  // Other Foods & Drinks
  'سوشي': 'SUSHI', 'sushi': 'SUSHI',
  'كشري': 'KOSHARY', 'الكشري': 'KOSHARY', 'koshary': 'KOSHARY', 'koshari': 'KOSHARY',
  'ملوخية': 'MOLOKHIA', 'ملوخيه': 'MOLOKHIA', 'molokhia': 'MOLOKHIA',
  'فراخ': 'CHICKEN', 'دجاج': 'CHICKEN', 'فراخ مقلية': 'CHICKEN', 'chicken': 'CHICKEN', 'kfc': 'CHICKEN', 'بروستد': 'CHICKEN',
  'لحمة': 'MEAT', 'لحم': 'MEAT', 'meat': 'MEAT', 'steak': 'MEAT', 'ستيك': 'MEAT',
  'سمك': 'FISH', 'fish': 'FISH',
  'جمبري': 'SHRIMP', 'روبيان': 'SHRIMP', 'shrimp': 'SHRIMP',
  'مكرونة': 'PASTA', 'مكرونه': 'PASTA', 'باستا': 'PASTA', 'pasta': 'PASTA', 'spaghetti': 'PASTA',
  'شاي': 'TEA', 'tea': 'TEA',
  'قهوة': 'COFFEE', 'قهوه': 'COFFEE', 'اسبريسو': 'COFFEE', 'coffee': 'COFFEE', 'espresso': 'COFFEE', 'latte': 'COFFEE', 'كافيه': 'COFFEE',
  'بيبسي': 'PEPSI', 'pepsi': 'PEPSI',
  'كولا': 'COCA_COLA', 'كوكاكولا': 'COCA_COLA', 'cola': 'COCA_COLA', 'coca cola': 'COCA_COLA', 'coke': 'COCA_COLA',
  'ماء': 'WATER', 'مية': 'WATER', 'ميه': 'WATER', 'water': 'WATER',
  'مانجو': 'MANGO', 'مانجه': 'MANGO', 'mango': 'MANGO',
  'فراولة': 'STRAWBERRY', 'فراوله': 'STRAWBERRY', 'strawberry': 'STRAWBERRY',
  'موز': 'BANANA', 'banana': 'BANANA',
  'تفاح': 'APPLE', 'apple': 'APPLE',
  'بطيخ': 'WATERMELON', 'watermelon': 'WATERMELON',
  'عنب': 'GRAPES', 'grapes': 'GRAPES',
  'ايس كريم': 'ICE_CREAM', 'جيلاتي': 'ICE_CREAM', 'ice cream': 'ICE_CREAM', 'icecream': 'ICE_CREAM',
  'شوكولاتة': 'CHOCOLATE', 'شوكولاته': 'CHOCOLATE', 'chocolate': 'CHOCOLATE', 'choclate': 'CHOCOLATE',
  'تشيز كيك': 'CHEESECAKE', 'cheesecake': 'CHEESECAKE',
  'دوناتس': 'DONUTS', 'دونات': 'DONUTS', 'donuts': 'DONUTS', 'donut': 'DONUTS',

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
  'ابل': 'APPLE_BRAND', 'ايفون': 'IPHONE', 'iphone': 'IPHONE',
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
  'رونالدو': 'RONALDO', 'كريستيانو': 'RONALDO', 'كريستيانو رونالدو': 'RONALDO', 'ronaldo': 'RONALDO', 'cr7': 'RONALDO', 'cristiano': 'RONALDO', 'cristiano ronaldo': 'RONALDO',
  'محمد صلاح': 'SALAH', 'صلاح': 'SALAH', 'salah': 'SALAH', 'mo salah': 'SALAH', 'ابو مكة': 'SALAH',
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
  'امريكا': 'USA', 'america': 'USA', 'usa': 'USA', 'الولايات المتحدة': 'USA',
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
  const fromNorm = BILINGUAL_CONCEPTS[normalized];
  if (fromNorm) return fromNorm;

  // Stemmed attempt
  const stemmed = stemArabicWord(normalized);
  return BILINGUAL_CONCEPTS[stemmed] ?? null;
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
 * Checks if one word is a significant substring or compound part of another
 * e.g. "برجر" is inside "همبرجر" or "burger" is inside "cheeseburger"
 */
const checkSubstringSimilarity = (a: string, b: string): number => {
  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  if (minLen < 3) return 0.0;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;

  if (longer.includes(shorter)) {
    // If shorter word is substantial (>= 4 chars or >= 50% length), high similarity
    if (shorter.length >= 4 || shorter.length / maxLen >= 0.5) {
      return 0.88;
    }
  }
  return 0.0;
};

/**
 * Calculates multi-metric similarity percentage (0.0 to 1.0) between two Arabic or mixed Arabic/English strings
 */
export const calculateSimilarity = (textA: string, textB: string): number => {
  const normA = normalizeArabicText(textA);
  const normB = normalizeArabicText(textB);

  if (normA === normB) return 1.0;
  if (!normA.length || !normB.length) return 0.0;

  // 1. Check Bilingual Concept Dictionary (e.g. "برجر" vs "hamburger", "جيتار" vs "guitar", "احمر" vs "red")
  const conceptA = getConceptKey(normA);
  const conceptB = getConceptKey(normB);
  if (conceptA && conceptB && conceptA === conceptB) {
    return 1.0;
  }

  // 2. Substring & Compound containment check (e.g. "برجر" vs "همبرجر", "burger" vs "hamburger")
  const subSim = checkSubstringSimilarity(normA, normB);
  if (subSim >= 0.85) {
    return subSim;
  }

  // 3. Stemmed check
  const stemA = stemArabicWord(normA);
  const stemB = stemArabicWord(normB);
  if (stemA === stemB && stemA.length >= 3) {
    return 0.95;
  }
  const stemSubSim = checkSubstringSimilarity(stemA, stemB);
  if (stemSubSim >= 0.85) {
    return stemSubSim;
  }

  // 4. Cross-lingual phonetic comparison (One Arabic, One English/Franco)
  const isAArabic = hasArabicScript(normA);
  const isBArabic = hasArabicScript(normB);
  const isALatin = hasLatinScript(normA);
  const isBLatin = hasLatinScript(normB);

  if ((isAArabic && isBLatin) || (isALatin && isBArabic)) {
    const latinFromAr = transliterateArabicToLatin(isAArabic ? normA : normB);
    const latinTarget = isAArabic ? normB : normA;

    if (latinFromAr === latinTarget) return 1.0;

    const crossSub = checkSubstringSimilarity(latinFromAr, latinTarget);
    if (crossSub >= 0.85) return crossSub;

    const jwSim = calculateJaroWinklerSimilarity(latinFromAr, latinTarget);
    const ngramSim = calculateNgramCosineSimilarity(latinFromAr, latinTarget);
    const crossScore = Math.max(jwSim, ngramSim);

    if (crossScore >= 0.70) {
      return parseFloat(crossScore.toFixed(2));
    }
  }

  // 5. Jaro-Winkler + N-gram Cosine + Levenshtein ensemble
  const jw = calculateJaroWinklerSimilarity(normA, normB);
  const ngram = calculateNgramCosineSimilarity(normA, normB);

  const levDist = calculateLevenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  const levSim = (maxLen - levDist) / maxLen;

  // Weighted ensemble emphasizing N-gram & Jaro-Winkler
  const composite = Math.max(jw * 0.9 + levSim * 0.1, ngram * 0.85 + jw * 0.15);

  return parseFloat(composite.toFixed(2));
};

/**
 * Determines if two answers are semantically/textually duplicate (>= threshold)
 */
export const isSemanticDuplicate = (
  answerA: string,
  answerB: string,
  threshold: number = 0.70
): boolean => {
  return calculateSimilarity(answerA, answerB) >= threshold;
};
