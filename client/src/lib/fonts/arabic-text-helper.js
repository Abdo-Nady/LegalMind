/**
 * Arabic Text Helper for PDF Export
 * 
 * Handles Arabic text reshaping and RTL rendering for jsPDF.
 * Arabic text needs special handling because:
 * 1. It's right-to-left (RTL)
 * 2. Characters change shape based on position (initial, medial, final, isolated)
 * 3. Some characters connect, others don't
 */

// Arabic character forms mapping (isolated, final, medial, initial)
const arabicForms = {
  // Alef variants
  '\u0627': ['\u0627', '\uFE8E', '\uFE8E', '\u0627'], // Alef
  '\u0623': ['\u0623', '\uFE84', '\uFE84', '\u0623'], // Alef with Hamza above
  '\u0625': ['\u0625', '\uFE88', '\uFE88', '\u0625'], // Alef with Hamza below
  '\u0622': ['\u0622', '\uFE82', '\uFE82', '\u0622'], // Alef with Madda
  
  // Ba-like characters
  '\u0628': ['\uFE8F', '\uFE90', '\uFE92', '\uFE91'], // Ba
  '\u062A': ['\uFE95', '\uFE96', '\uFE98', '\uFE97'], // Ta
  '\u062B': ['\uFE99', '\uFE9A', '\uFE9C', '\uFE9B'], // Tha
  '\u0646': ['\uFEE5', '\uFEE6', '\uFEE8', '\uFEE7'], // Nun
  '\u064A': ['\uFEF1', '\uFEF2', '\uFEF4', '\uFEF3'], // Ya
  
  // Jim-like characters
  '\u062C': ['\uFE9D', '\uFE9E', '\uFEA0', '\uFE9F'], // Jim
  '\u062D': ['\uFEA1', '\uFEA2', '\uFEA4', '\uFEA3'], // Ha
  '\u062E': ['\uFEA5', '\uFEA6', '\uFEA8', '\uFEA7'], // Kha
  
  // Dal-like characters (non-connecting)
  '\u062F': ['\uFEA9', '\uFEAA', '\uFEAA', '\uFEA9'], // Dal
  '\u0630': ['\uFEAB', '\uFEAC', '\uFEAC', '\uFEAB'], // Thal
  
  // Ra-like characters (non-connecting)
  '\u0631': ['\uFEAD', '\uFEAE', '\uFEAE', '\uFEAD'], // Ra
  '\u0632': ['\uFEAF', '\uFEB0', '\uFEB0', '\uFEAF'], // Zain
  
  // Sin-like characters
  '\u0633': ['\uFEB1', '\uFEB2', '\uFEB4', '\uFEB3'], // Sin
  '\u0634': ['\uFEB5', '\uFEB6', '\uFEB8', '\uFEB7'], // Shin
  
  // Sad-like characters
  '\u0635': ['\uFEB9', '\uFEBA', '\uFEBC', '\uFEBB'], // Sad
  '\u0636': ['\uFEBD', '\uFEBE', '\uFEC0', '\uFEBF'], // Dad
  
  // Ta-like characters
  '\u0637': ['\uFEC1', '\uFEC2', '\uFEC4', '\uFEC3'], // Ta
  '\u0638': ['\uFEC5', '\uFEC6', '\uFEC8', '\uFEC7'], // Za
  
  // Ain-like characters
  '\u0639': ['\uFEC9', '\uFECA', '\uFECC', '\uFECB'], // Ain
  '\u063A': ['\uFECD', '\uFECE', '\uFED0', '\uFECF'], // Ghain
  
  // Fa-like characters
  '\u0641': ['\uFED1', '\uFED2', '\uFED4', '\uFED3'], // Fa
  '\u0642': ['\uFED5', '\uFED6', '\uFED8', '\uFED7'], // Qaf
  
  // Kaf-like characters
  '\u0643': ['\uFED9', '\uFEDA', '\uFEDC', '\uFEDB'], // Kaf
  
  // Lam
  '\u0644': ['\uFEDD', '\uFEDE', '\uFEE0', '\uFEDF'], // Lam
  
  // Mim
  '\u0645': ['\uFEE1', '\uFEE2', '\uFEE4', '\uFEE3'], // Mim
  
  // Ha (end)
  '\u0647': ['\uFEE9', '\uFEEA', '\uFEEC', '\uFEEB'], // Ha
  
  // Waw (non-connecting)
  '\u0648': ['\uFEED', '\uFEEE', '\uFEEE', '\uFEED'], // Waw
  
  // Alef Maqsura (non-connecting from right)
  '\u0649': ['\uFEEF', '\uFEF0', '\uFEF0', '\uFEEF'], // Alef Maqsura
  
  // Ta Marbuta (non-connecting)
  '\u0629': ['\uFE93', '\uFE94', '\uFE94', '\uFE93'], // Ta Marbuta
  
  // Hamza
  '\u0621': ['\uFE80', '\uFE80', '\uFE80', '\uFE80'], // Hamza
  
  // Lam-Alef ligatures are handled separately
};

// Characters that don't connect to the next character
const nonConnectingChars = new Set([
  '\u0627', '\u0623', '\u0625', '\u0622', // Alef variants
  '\u062F', '\u0630', // Dal, Thal
  '\u0631', '\u0632', // Ra, Zain
  '\u0648', // Waw
  '\u0629', // Ta Marbuta
  '\u0649', // Alef Maqsura
  '\u0621', // Hamza
]);

/**
 * Check if a character is Arabic
 */
export function isArabicChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) || // Arabic
         (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
         (code >= 0xFE70 && code <= 0xFEFF);   // Arabic Presentation Forms-B
}

/**
 * Check if text contains Arabic characters
 */
export function containsArabic(text) {
  for (let char of text) {
    if (isArabicChar(char)) return true;
  }
  return false;
}

/**
 * Reshape Arabic text for proper rendering
 * This handles the contextual forms of Arabic characters
 */
export function reshapeArabic(text) {
  if (!containsArabic(text)) return text;
  
  let result = '';
  const chars = Array.from(text);
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const prevChar = i > 0 ? chars[i - 1] : null;
    const nextChar = i < chars.length - 1 ? chars[i + 1] : null;
    
    // Check if this is an Arabic character with forms
    if (arabicForms[char]) {
      const prevConnects = prevChar && isArabicChar(prevChar) && !nonConnectingChars.has(prevChar);
      const nextConnects = nextChar && isArabicChar(nextChar);
      
      let formIndex;
      if (prevConnects && nextConnects) {
        formIndex = 2; // Medial
      } else if (prevConnects) {
        formIndex = 1; // Final
      } else if (nextConnects) {
        formIndex = 3; // Initial
      } else {
        formIndex = 0; // Isolated
      }
      
      result += arabicForms[char][formIndex];
    } else {
      result += char;
    }
  }
  
  return result;
}

/**
 * Reverse text for RTL rendering
 * Keeps numbers and Latin text in correct order
 */
export function reverseForRTL(text) {
  if (!containsArabic(text)) return text;
  
  // Split into segments of Arabic and non-Arabic
  const segments = [];
  let currentSegment = '';
  let isCurrentArabic = false;
  
  for (const char of text) {
    const charIsArabic = isArabicChar(char);
    
    if (currentSegment === '') {
      isCurrentArabic = charIsArabic;
      currentSegment = char;
    } else if (charIsArabic === isCurrentArabic || char === ' ') {
      currentSegment += char;
    } else {
      segments.push({ text: currentSegment, isArabic: isCurrentArabic });
      currentSegment = char;
      isCurrentArabic = charIsArabic;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isArabic: isCurrentArabic });
  }
  
  // Reverse the order of segments and reverse Arabic segments
  const reversedSegments = segments.reverse().map(seg => {
    if (seg.isArabic) {
      return Array.from(seg.text).reverse().join('');
    }
    return seg.text;
  });
  
  return reversedSegments.join('');
}

/**
 * Process Arabic text for PDF rendering
 * Combines reshaping and RTL handling
 */
export function processArabicText(text) {
  const reshaped = reshapeArabic(text);
  return reverseForRTL(reshaped);
}

/**
 * Split mixed Arabic/English text into lines respecting word boundaries
 */
export function splitArabicText(text, maxWidth, measureFn) {
  const words = text.split(/(\s+)/);
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + word;
    const width = measureFn(testLine);
    
    if (width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}
