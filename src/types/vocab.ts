export interface VocabWord {
  id: string;
  fr: string;
  en: string;
  exampleFr: string;
  exampleEn?: string;
  category: string;
  count: number; // 0 to 3 (mastery threshold)
  isPhrasalVerb?: boolean;
  particles?: string[]; // e.g. ["up"], ["forward", "to"]
  mistakeCount?: number;
  frequencyWeight?: number;
  lastReviewed?: number;
  synonymsEn?: string[];
  notes?: string;
}

export type PracticeDirection = 'fr-to-en' | 'en-to-fr';
export type PracticeMode = 'type' | 'choice' | 'flashcard';

export interface Category {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  isClose: boolean;
  userAnswer: string;
  targetAnswer: string;
  feedbackText: string;
  newCount: number;
}
