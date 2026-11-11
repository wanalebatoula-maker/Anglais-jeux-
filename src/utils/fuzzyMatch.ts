import { VocabWord, PracticeDirection } from '../types/vocab';

/**
 * Normalizes string: trims, lowercases, standardizes quotes and apostrophes
 */
export function normalizeString(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');
}

/**
 * Strip leading 'to ' for English verbs
 */
export function stripEnglishInfinitive(str: string): string {
  return normalizeString(str).replace(/^to\s+/, '');
}

/**
 * Remove French accents for soft matching
 */
export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compute Levenshtein distance
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export interface MatchEvaluation {
  isCorrect: boolean;
  isExact: boolean;
  isClose: boolean;
  note?: string;
  expected: string;
}

export function evaluateAnswer(
  rawInput: string,
  word: VocabWord,
  direction: PracticeDirection
): MatchEvaluation {
  const input = normalizeString(rawInput);
  if (!input) {
    return {
      isCorrect: false,
      isExact: false,
      isClose: false,
      expected: direction === 'fr-to-en' ? word.en : word.fr,
    };
  }

  if (direction === 'fr-to-en') {
    const targetClean = stripEnglishInfinitive(word.en);
    const targetFull = normalizeString(word.en);
    const userClean = stripEnglishInfinitive(input);

    // List of acceptable forms
    const acceptableForms = [
      targetClean,
      targetFull,
      ...(word.synonymsEn || []).map(s => stripEnglishInfinitive(s)),
      ...(word.synonymsEn || []).map(s => normalizeString(s)),
    ];

    // Check exact or infinitive match
    if (acceptableForms.includes(userClean) || acceptableForms.includes(input)) {
      return {
        isCorrect: true,
        isExact: true,
        isClose: false,
        expected: word.en,
      };
    }

    // Check typo tolerance (distance of 1 for words length >= 4)
    for (const form of acceptableForms) {
      if (form.length >= 4 && levenshtein(userClean, form) === 1) {
        return {
          isCorrect: true,
          isExact: false,
          isClose: true,
          note: `Presque parfait ! Attention à la petite faute : "${form}"`,
          expected: word.en,
        };
      }
    }

    return {
      isCorrect: false,
      isExact: false,
      isClose: false,
      expected: word.en,
    };
  } else {
    // en-to-fr
    const target = normalizeString(word.fr);
    const targetNoAccents = stripAccents(target);
    const inputNoAccents = stripAccents(input);

    if (input === target) {
      return {
        isCorrect: true,
        isExact: true,
        isClose: false,
        expected: word.fr,
      };
    }

    if (inputNoAccents === targetNoAccents) {
      return {
        isCorrect: true,
        isExact: false,
        isClose: true,
        note: `Accent manquant : pensez à "${word.fr}" !`,
        expected: word.fr,
      };
    }

    if (target.length >= 4 && levenshtein(inputNoAccents, targetNoAccents) === 1) {
      return {
        isCorrect: true,
        isExact: false,
        isClose: true,
        note: `Faute de frappe légère, la bonne graphie est "${word.fr}"`,
        expected: word.fr,
      };
    }

    return {
      isCorrect: false,
      isExact: false,
      isClose: false,
      expected: word.fr,
    };
  }
}
