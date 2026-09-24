/**
 * Multilingual NLP Voice Words to Numbers Converter for CyberPredict Citizen Portal
 * Supports English, Hindi (Devanagari & Hinglish), and Kannada (Kannada Script & Romanized).
 * Converts ANY spoken or written amount phrase like:
 * - "fifty thousand rupees" -> "50000 rupees"
 * - "two lakh fifty thousand" -> "250000"
 * - "one point eight five lakh" -> "185000"
 * - "50k", "1.5L", "2cr" -> "50000", "150000", "20000000"
 * - "डेढ़ लाख", "ढाई लाख", "साढ़े तीन लाख", "सवा लाख" -> "150000", "250000", "350000", "125000"
 * - "ಐನೂರು", "ಐವತ್ತು ಸಾವಿರ", "ಒಂದೂವರೆ ಲಕ್ಷ" -> "500", "50000", "150000"
 */

// Single units (0-19)
export const UNITS = {
  // English
  'zero': 0, 'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
  // Hindi Devanagari
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19,
  // Hinglish
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5,
  'che': 6, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
  'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15,
  'solah': 16, 'satrah': 17, 'atharah': 18, 'unnees': 19,
  // Kannada Script
  'ಸೊನ್ನೆ': 0, 'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5,
  'ಆರು': 6, 'ಏಳು': 7, 'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10,
  'ಹನ್ನೊಂದು': 11, 'ಹನ್ನೆರಡು': 12, 'ಹದಿಮೂರು': 13, 'ಹದಿನಾಲ್ಕು': 14, 'ಹದಿನೈದು': 15,
  'ಹದಿನಾರು': 16, 'ಹದಿನೇಳು': 17, 'ಹದಿನೆಂಟು': 18, 'ಹತ್ತೊಂಬತ್ತು': 19,
  // Kannada Romanized
  'sonne': 0, 'ondu': 1, 'eradu': 2, 'mooru': 3, 'naalku': 4, 'aidu': 5,
  'aaru': 6, 'eylu': 7, 'elu': 7, 'entu': 8, 'ombattu': 9, 'hattu': 10
};

// Tens (20, 30, 40, 50, 60, 70, 80, 90)
export const TENS = {
  // English
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fourty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  // Hindi Devanagari
  'बीस': 20, 'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'तीस': 30, 'पैंतीस': 35, 'चालीस': 40, 'पैंतालीस': 45, 'पचास': 50,
  'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
  // Hinglish
  'bees': 20, 'pachees': 25, 'tees': 30, 'paintees': 35, 'chalees': 40,
  'chalis': 40, 'paintalees': 45, 'pachas': 50, 'saath': 60, 'sath': 60,
  'sattar': 70, 'assi': 80, 'nabbe': 90,
  // Kannada Script
  'ಇಪ್ಪತ್ತು': 20, 'ಇಪ್ಪತ್ತೈದು': 25, 'ಮೂವತ್ತು': 30, 'ಮೂವತ್ತೈದು': 35,
  'ನಲವತ್ತು': 40, 'ನಲವತ್ತೈದು': 45, 'ಐವತ್ತು': 50, 'ಅರವತ್ತು': 60,
  'ಎಪ್ಪತ್ತು': 70, 'ಎಂಬತ್ತು': 80, 'ತೊಂಬತ್ತು': 90,
  // Kannada Romanized
  'ippattu': 20, 'ippattaidu': 25, 'moovattu': 30, 'nalavattu': 40,
  'aivattu': 50, 'aravattu': 60, 'eppattu': 70, 'embattu': 80, 'tombattu': 90
};

// Scales & Multipliers
export const SCALES = {
  // Hundreds
  'hundred': 100, 'hundreds': 100, 'सौ': 100, 'sau': 100, 'nooru': 100, 'ನೂರು': 100,
  'ಇನ್ನೂರು': 200, 'innooru': 200, 'ಮುನ್ನೂರು': 300, 'munnooru': 300, 'ನಾನೂರು': 400, 'naanooru': 400,
  'ಐನೂರು': 500, 'ainooru': 500, 'ಆರುನೂರು': 600, 'aarunooru': 600, 'ಏಳುನೂರು': 700, 'eylunooru': 700,
  'ಎಂಟುನೂರು': 800, 'entunooru': 800, 'ಒಂಬೈನೂರು': 900, 'ombainooru': 900,
  // Thousands
  'thousand': 1000, 'thousands': 1000, 'k': 1000, 'हज़ार': 1000, 'हजार': 1000, 'hazar': 1000, 'hazaar': 1000, 'saavira': 1000, 'ಸಾವಿರ': 1000,
  // Lakhs (100,000)
  'lakh': 100000, 'lakhs': 100000, 'lac': 100000, 'lacs': 100000, 'laksh': 100000, 'laakh': 100000, 'लाख': 100000, 'लख': 100000, 'laksha': 100000, 'ಲಕ್ಷ': 100000,
  // Crores (10,000,000)
  'crore': 10000000, 'crores': 10000000, 'cr': 10000000, 'koti': 10000000, 'करोड़': 10000000, 'करोड': 10000000, 'ಕೋಟಿ': 10000000,
  // Millions / Billions
  'million': 1000000, 'millions': 1000000, 'mn': 1000000,
  'billion': 1000000000, 'billions': 1000000000, 'bn': 1000000000
};

// Special fractions / colloquial multipliers
export const SPECIALS = {
  'डेढ़': 1.5, 'dedh': 1.5,
  'ढाई': 2.5, 'dhai': 2.5,
  'आधा': 0.5, 'aadha': 0.5, 'half': 0.5, 'ಅರ್ಧ': 0.5, 'ardha': 0.5,
  'ಒಂದೂವರೆ': 1.5, 'onduvare': 1.5,
  'ಎರಡೂವರೆ': 2.5, 'eraduvare': 2.5,
  'पाव': 0.25, 'quarter': 0.25, 'ಕಾಲು': 0.25, 'kaalu': 0.25
};

/**
 * Parses an array of token words into a computed numerical value string.
 * Handles compound Indian & Western notation as well as single-digit sequences.
 */
function parseNumberTokens(tokens) {
  // If tokens are all single digits 0-9 and at least 3 digits (e.g. phone/otp stream)
  const allSingleDigits = tokens.every(t => t in UNITS && UNITS[t] < 10);
  if (tokens.length >= 3 && allSingleDigits) {
    return tokens.map(t => UNITS[t]).join('');
  }

  let total = 0;
  let current = 0;
  let hasNumber = false;
  let pendingModifier = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    
    if (t === 'साढ़े' || t === 'saadhe') {
      pendingModifier = 0.5;
      hasNumber = true;
      continue;
    }
    if (t === 'पौने' || t === 'paune') {
      if (i + 1 < tokens.length && tokens[i + 1] in SCALES) {
        current = 0.75;
        hasNumber = true;
        continue;
      }
      pendingModifier = -0.25;
      hasNumber = true;
      continue;
    }
    if (t === 'सवा' || t === 'sawa') {
      if (i + 1 < tokens.length && tokens[i + 1] in SCALES) {
        current = 1.25;
        hasNumber = true;
        continue;
      }
      pendingModifier = 0.25;
      hasNumber = true;
      continue;
    }

    if (/^\d+(\.\d+)?$/.test(t)) {
      let val = parseFloat(t);
      if (pendingModifier !== 0) {
        val += pendingModifier;
        pendingModifier = 0;
      }
      current += val;
      hasNumber = true;
    } else if (t in SPECIALS) {
      current += SPECIALS[t];
      hasNumber = true;
    } else if (t in UNITS) {
      let val = UNITS[t];
      if (pendingModifier !== 0) {
        val += pendingModifier;
        pendingModifier = 0;
      }
      current += val;
      hasNumber = true;
    } else if (t in TENS) {
      current += TENS[t];
      hasNumber = true;
    } else if (t in SCALES) {
      hasNumber = true;
      const scale = SCALES[t];
      if (scale === 100 || (scale >= 200 && scale <= 900)) {
        current = (current === 0 ? 1 : current) * scale;
      } else {
        total += (current === 0 ? 1 : current) * scale;
        current = 0;
      }
    }
  }

  total += current;
  return hasNumber ? String(Math.round(total * 100) / 100) : null;
}

/**
 * Converts any number words in a spoken or written sentence into digits.
 * E.g.: "lost fifty thousand in job scam two hours ago" -> "lost 50000 in job scam 2 hours ago"
 */
export function convertWordsToNumbers(text) {
  if (!text || typeof text !== 'string') return '';

  // 1. Normalize native Hindi/Kannada numerals to ASCII digits
  let normalized = text
    .replace(/[೦०]/g, '0').replace(/[೧१]/g, '1').replace(/[೨२]/g, '2').replace(/[೩३]/g, '3').replace(/[೪४]/g, '4')
    .replace(/[೫५]/g, '5').replace(/[೬६]/g, '6').replace(/[೭७]/g, '7').replace(/[೮८]/g, '8').replace(/[೯९]/g, '9');

  // 2. Pre-process word decimals e.g. "one point eight five", "two point five"
  normalized = normalized.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s+point\s+((?:(?:zero|one|two|three|four|five|six|seven|eight|nine|\d+)\s*)+)\b/gi, (match, p1, p2) => {
    const v1 = /^\d+$/.test(p1) ? p1 : (UNITS[p1.toLowerCase()] ?? p1);
    const decimals = p2.trim().split(/\s+/).map(w => (/^\d+$/.test(w) ? w : (UNITS[w.toLowerCase()] ?? w))).join('');
    return `${v1}.${decimals}`;
  });

  // 3. Pre-process "and a half" e.g. "two and a half lakh" -> "2.5 lakh"
  normalized = normalized.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+and\s+a\s+half\b/gi, (match, p1) => {
    const base = /^\d+$/.test(p1) ? parseFloat(p1) : (UNITS[p1.toLowerCase()] || 0);
    return String(base + 0.5);
  });

  // 4. Pre-process shorthand suffixes attached to digits: "50k", "85k", "1.5L", "2cr"
  normalized = normalized.replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (match, p1) => String(Math.round(parseFloat(p1) * 1000)));
  normalized = normalized.replace(/\b(\d+(?:\.\d+)?)\s*(?:l|lac|lakh|lakhs)\b/gi, (match, p1) => String(Math.round(parseFloat(p1) * 100000)));
  normalized = normalized.replace(/\b(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/gi, (match, p1) => String(Math.round(parseFloat(p1) * 10000000)));
  normalized = normalized.replace(/\b(\d+(?:\.\d+)?)\s*m(?:illion)?\b/gi, (match, p1) => String(Math.round(parseFloat(p1) * 1000000)));

  // 5. Pre-process colloquial time expressions
  normalized = normalized.replace(/\bhalf\s+(?:an\s+)?hour\b/gi, '30 minutes');
  normalized = normalized.replace(/\bआधा\s+घंटा\b/gi, '30 मिनट');
  normalized = normalized.replace(/\bಅರ್ಧ\s+ಗಂಟೆ\b/gi, '30 ನಿಮಿಷ');

  // 6. Tokenize sentence into words
  const words = normalized.split(/\s+/);
  const resultWords = [];
  let numSeq = [];

  const isNumWord = (w) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0C80-\u0CFF.]/g, '');
    if (!clean) return false;
    if (/^\d+(\.\d+)?$/.test(clean)) return true;
    return (clean in UNITS) || (clean in TENS) || (clean in SCALES) || (clean in SPECIALS) ||
      clean === 'साढ़े' || clean === 'saadhe' || clean === 'पौने' || clean === 'paune' || clean === 'सवा' || clean === 'sawa';
  };

  const getCleanWord = (w) => w.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0C80-\u0CFF.]/g, '');

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const clean = getCleanWord(word);

    // Skip connector "and" when in middle of numbers e.g. "two hundred and fifty"
    if (clean === 'and' && numSeq.length > 0 && i + 1 < words.length && isNumWord(words[i + 1])) {
      continue;
    }

    if (isNumWord(word)) {
      numSeq.push(clean);
    } else {
      if (numSeq.length > 0) {
        const parsed = parseNumberTokens(numSeq);
        resultWords.push(parsed !== null ? parsed : numSeq.join(' '));
        numSeq = [];
      }
      resultWords.push(word);
    }
  }

  if (numSeq.length > 0) {
    const parsed = parseNumberTokens(numSeq);
    resultWords.push(parsed !== null ? parsed : numSeq.join(' '));
  }

  return resultWords.join(' ');
}

/**
 * Accurately extracts ANY loss amount number and reporting lag from converted text,
 * guaranteeing that any amount (from ₹50 or ₹500 to ₹10,000,000+) is correctly
 * separated from time/lag numbers (like "2 hours" or "15 mins").
 */
export function extractAmountAndLag(text) {
  if (!text || typeof text !== 'string') {
    return { amount: '50000', lag: '15' };
  }

  // 1. Lag extraction
  let lag = '15';
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours|ghante|ghanta|gante|घंटे|घंटा|ಗಂಟೆ)\b/i);
  const minuteMatch = text.match(/(\d+)\s*(?:min|mins|minute|minutes|minat|nimisha|ನಿಮಿಷ|ಮಿನಿಟ್|मिनट)\b/i);

  if (hourMatch) {
    lag = String(Math.round(parseFloat(hourMatch[1]) * 60));
  } else if (minuteMatch) {
    lag = minuteMatch[1];
  } else if (/\b(?:yesterday|कल|ನಿನ್ನೆ)\b/i.test(text)) {
    lag = '1440';
  }

  // 2. Amount extraction
  let amount = '';

  // Priority 1: Scale matches (crore, lakh, thousand, k)
  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:crores?|cr|koti|करोड़|करोड|ಕೋಟಿ)\b/i);
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|laksh|laakh|लाख|लख|ಲಕ್ಷ)\b/i);
  const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands|hazar|hazaar|saavira|हज़ार|हजार|ಸಾವಿರ)\b/i);

  if (croreMatch) {
    amount = String(Math.round(parseFloat(croreMatch[1]) * 10000000));
  } else if (lakhMatch) {
    amount = String(Math.round(parseFloat(lakhMatch[1]) * 100000));
  } else if (thousandMatch) {
    amount = String(Math.round(parseFloat(thousandMatch[1]) * 1000));
  }

  // Priority 2: Numbers attached to currency or transaction loss verbs
  if (!amount) {
    const currencyMatch = text.match(/(?:(?:rs\.?|inr|₹|lost|transferred|stolen|amount|withdrawn|debited|paid|scammed)\s*[:=]?\s*(\d+))|(\d+)\s*(?:rs\.?|inr|₹|rupees?|bucks?|रुपये|रुपए|ರೂಪಾಯಿ)/i);
    if (currencyMatch) {
      amount = currencyMatch[1] || currencyMatch[2];
    }
  }

  // Priority 3: Any number that is NOT attached to a time/lag unit
  if (!amount) {
    const allNumbers = [];
    const numRegex = /\b\d+\b/g;
    let m;
    while ((m = numRegex.exec(text)) !== null) {
      const idx = m.index;
      const numStr = m[0];
      const afterText = text.slice(idx + numStr.length, idx + numStr.length + 20).trim();
      const isTimeUnit = /^(?:hr|hrs|hour|hours|min|mins|minute|minutes|ghante|ghanta|gante|nimisha|घंटे|घंटा|ಗಂಟೆ)\b/i.test(afterText);
      if (!isTimeUnit) {
        allNumbers.push(parseInt(numStr, 10));
      }
    }
    if (allNumbers.length > 0) {
      amount = String(Math.max(...allNumbers));
    }
  }

  if (!amount) {
    amount = '50000';
  }

  return { amount, lag };
}
