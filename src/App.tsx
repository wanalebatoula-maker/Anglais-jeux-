/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRightLeft,
  Keyboard,
  ListOrdered,
  Flame,
  BookOpen,
  Zap,
} from 'lucide-react';
import { VocabWord, PracticeDirection, PracticeMode } from './types/vocab';
import { INITIAL_VOCABULARY, CATEGORIES } from './data/defaultVocab';
import { Header } from './components/Header';
import { VocabCard } from './components/VocabCard';
import { DeckCompleted } from './components/DeckCompleted';
import { WordListModal } from './components/WordListModal';
import { AddWordModal } from './components/AddWordModal';

const STORAGE_KEY = 'vocab_fr_en_data_v1';

export default function App() {
  // Vocabulary state with localStorage persistence and automatic merge of new phrasal verbs
  const [vocabulary, setVocabulary] = useState<VocabWord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: VocabWord[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(w => w.id));
        const missingWords = INITIAL_VOCABULARY.filter(w => !existingIds.has(w.id));
        // Enrich existing words with updated phrasal verb attributes & notes
        const enriched = parsed.map(w => {
          const initialMatch = INITIAL_VOCABULARY.find(iv => iv.id === w.id);
          if (initialMatch) {
            return {
              ...w,
              isPhrasalVerb: initialMatch.isPhrasalVerb ?? w.isPhrasalVerb,
              particles: initialMatch.particles ?? w.particles,
              notes: initialMatch.notes ?? w.notes,
              synonymsEn: initialMatch.synonymsEn ?? w.synonymsEn,
            };
          }
          return w;
        });
        return [...enriched, ...missingWords];
      }
    } catch {
      // Fallback
    }
    return INITIAL_VOCABULARY;
  });

  // Default to phrasal verbs priority category
  const [selectedCategory, setSelectedCategory] = useState<string>('phrasal');
  const [direction, setDirection] = useState<PracticeDirection>('fr-to-en');
  const [mode, setMode] = useState<PracticeMode>('type');
  const [prioritizePhrasalVerbs, setPrioritizePhrasalVerbs] = useState<boolean>(true);
  const [onlyPhrasalVerbs, setOnlyPhrasalVerbs] = useState<boolean>(false);

  // Modals state
  const [isWordListOpen, setIsWordListOpen] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);

  // Active word index tracking
  const [currentWordId, setCurrentWordId] = useState<string | null>(null);

  // Streak counter
  const [streak, setStreak] = useState(0);

  // Feedback state
  const [feedbackState, setFeedbackState] = useState<{
    status: 'idle' | 'success' | 'mastered' | 'error';
    message: string;
    expectedAnswer?: string;
  }>({
    status: 'idle',
    message: '',
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabulary));
    } catch {
      // Storage unavailable
    }
  }, [vocabulary]);

  // Current deck words (filtered optionally by onlyPhrasalVerbs)
  const categoryWords = useMemo(() => {
    let base =
      selectedCategory === 'all'
        ? vocabulary
        : vocabulary.filter(w => w.category === selectedCategory);
    if (onlyPhrasalVerbs) {
      base = base.filter(w => w.isPhrasalVerb);
    }
    return base;
  }, [vocabulary, selectedCategory, onlyPhrasalVerbs]);

  // Unmastered words (count < 3)
  const activeWords = useMemo(() => {
    return categoryWords.filter(w => w.count < 3);
  }, [categoryWords]);

  // Mastered words count in current category
  const masteredCount = useMemo(() => {
    return categoryWords.filter(w => w.count >= 3).length;
  }, [categoryWords]);

  // Current active word
  const currentWord = useMemo(() => {
    if (!currentWordId) return null;
    return categoryWords.find(w => w.id === currentWordId) || null;
  }, [categoryWords, currentWordId]);

  // Load next word helper with high frequency weighting for phrasal verbs and unmastered words
  const pickNextWord = useCallback(
    (excludeId?: string) => {
      setFeedbackState({ status: 'idle', message: '' });

      const candidates =
        activeWords.length > 1 && excludeId
          ? activeWords.filter(w => w.id !== excludeId)
          : activeWords;

      if (candidates.length === 0) {
        setCurrentWordId(null);
        return;
      }

      // Adaptive high-frequency distribution:
      // 1. Phrasal verbs get strong multiplier (x4.5 when priority is active)
      // 2. Unmastered stages: count 0 has weight 15, count 1 has 8, count 2 has 3
      // 3. Mistakes boost: +10 weight per mistake so missed words reappear rapidly
      const scoredCandidates = candidates.map(word => {
        let weight = word.count === 0 ? 15 : word.count === 1 ? 8 : 3;

        if ((word.mistakeCount || 0) > 0) {
          weight += (word.mistakeCount || 0) * 10;
        }

        if (word.isPhrasalVerb) {
          weight *= prioritizePhrasalVerbs ? 4.5 : 2.0;
        }

        return { word, weight };
      });

      const totalWeight = scoredCandidates.reduce((sum, item) => sum + item.weight, 0);
      let rand = Math.random() * totalWeight;
      let selected = scoredCandidates[0].word;

      for (const item of scoredCandidates) {
        if (rand < item.weight) {
          selected = item.word;
          break;
        }
        rand -= item.weight;
      }

      setCurrentWordId(selected.id);
    },
    [activeWords, prioritizePhrasalVerbs]
  );

  // Ensure an active word is loaded
  useEffect(() => {
    if (activeWords.length > 0) {
      if (!currentWordId || !activeWords.some(w => w.id === currentWordId)) {
        pickNextWord();
      }
    } else {
      setCurrentWordId(null);
    }
  }, [activeWords, currentWordId, pickNextWord]);

  // Handle Answer
  const handleAnswer = (isCorrect: boolean, isMastered: boolean) => {
    if (!currentWord) return;

    if (isCorrect) {
      setStreak(prev => prev + 1);
      const newCount = currentWord.count + 1;

      // Update vocabulary: increment mastery count and reduce mistake penalty
      setVocabulary(prev =>
        prev.map(w =>
          w.id === currentWord.id
            ? {
                ...w,
                count: newCount,
                mistakeCount: Math.max(0, (w.mistakeCount || 0) - 1),
                lastReviewed: Date.now(),
              }
            : w
        )
      );

      if (newCount >= 3 || isMastered) {
        // Word mastered celebration!
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {
          // ignore
        }

        setFeedbackState({
          status: 'mastered',
          message: 'Brillant ! Mot maîtrisé (3/3) 🎉',
        });
      } else {
        setFeedbackState({
          status: 'success',
          message: `Correct ! (${newCount}/3)`,
        });
      }

      // Next word timer (1500ms)
      setTimeout(() => {
        pickNextWord(currentWord.id);
      }, 1500);
    } else {
      setStreak(0);
      const expected = direction === 'fr-to-en' ? currentWord.en : currentWord.fr;

      // Increase mistake count so word appears with high frequency for reinforcement
      setVocabulary(prev =>
        prev.map(w =>
          w.id === currentWord.id
            ? {
                ...w,
                mistakeCount: (w.mistakeCount || 0) + 1,
                lastReviewed: Date.now(),
              }
            : w
        )
      );

      setFeedbackState({
        status: 'error',
        message: 'Presque ! La bonne réponse était :',
        expectedAnswer: expected,
      });

      // Next word timer (2500ms)
      setTimeout(() => {
        pickNextWord(currentWord.id);
      }, 2500);
    }
  };

  // Handle Skip
  const handleSkip = () => {
    if (currentWord) {
      pickNextWord(currentWord.id);
    }
  };

  // Reset progress for current category
  const handleResetProgress = () => {
    const shouldReset = window.confirm(
      'Voulez-vous réinitialiser votre progression pour cette liste de mots ?'
    );
    if (!shouldReset) return;

    setVocabulary(prev =>
      prev.map(w => {
        if (selectedCategory === 'all' || w.category === selectedCategory) {
          return { ...w, count: 0 };
        }
        return w;
      })
    );
    setStreak(0);
    setFeedbackState({ status: 'idle', message: '' });
  };

  // Reset single word
  const handleResetWord = (wordId: string) => {
    setVocabulary(prev =>
      prev.map(w => (w.id === wordId ? { ...w, count: 0 } : w))
    );
  };

  // Toggle single word mastery
  const handleToggleMastery = (wordId: string) => {
    setVocabulary(prev =>
      prev.map(w =>
        w.id === wordId ? { ...w, count: w.count >= 3 ? 0 : 3 } : w
      )
    );
  };

  // Add custom word
  const handleAddWord = (newWordData: Omit<VocabWord, 'id' | 'count'>) => {
    const newWord: VocabWord = {
      ...newWordData,
      id: `custom-${Date.now()}`,
      count: 0,
    };
    setVocabulary(prev => [newWord, ...prev]);
  };

  const currentCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory) || {
    id: 'all',
    title: 'Tous les mots',
    description: 'Ensemble de votre bibliothèque de vocabulaire',
    iconName: 'BookOpen',
  };

  // Calculate percentage of mastery
  const progressPercent =
    categoryWords.length > 0
      ? Math.round((masteredCount / categoryWords.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar Header */}
      <Header
        onOpenDeckList={() => setIsWordListOpen(true)}
        onResetProgress={handleResetProgress}
        masteredCount={masteredCount}
        totalWords={categoryWords.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {/* Top Control Bar & Category Info */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{currentCategoryInfo.title}</span>
              <span aria-hidden="true">·</span>
              <span>{categoryWords.length} mots au total</span>
              {streak > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Série de {streak}</span>
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Jeu de Vocabulaire
            </h1>
          </div>

          {/* Interactive controls: Phrasal priority, Direction & Input mode */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Phrasal Verb Priority Toggle */}
            <button
              onClick={() => setPrioritizePhrasalVerbs(p => !p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                prioritizePhrasalVerbs
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={
                prioritizePhrasalVerbs
                  ? 'Surpondération active : les phrasal verbs apparaissent très fréquemment'
                  : 'Pondération normale'
              }
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  prioritizePhrasalVerbs ? 'text-amber-600 fill-amber-500' : 'text-slate-400'
                }`}
              />
              <span>Phrasal Verbs : {prioritizePhrasalVerbs ? 'Fréquence Max (x4.5)' : 'Standard'}</span>
            </button>

            {/* Phrasal Verbs Only Filter */}
            <button
              onClick={() => setOnlyPhrasalVerbs(o => !o)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                onlyPhrasalVerbs
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Filtrer pour ne s'entraîner que sur les phrasal verbs"
            >
              <span>100% Phrasal</span>
            </button>

            {/* Direction switcher */}
            <button
              onClick={() =>
                setDirection(d => (d === 'fr-to-en' ? 'en-to-fr' : 'fr-to-en'))
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Inverser le sens de traduction"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>{direction === 'fr-to-en' ? 'FR ➔ EN' : 'EN ➔ FR'}</span>
            </button>

            {/* Mode switcher (Type vs Multiple choice) */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setMode('type')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer font-medium ${
                  mode === 'type'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode saisie au clavier"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Saisie</span>
              </button>

              <button
                onClick={() => setMode('choice')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer font-medium ${
                  mode === 'choice'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode choix multiple"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QCM</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Progress Bar with Frequency Info */}
        <div className="mb-6 bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <span>
                Mots maîtrisés : <span className="font-bold text-slate-900">{masteredCount}</span> / {categoryWords.length}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 hidden sm:inline">
                Fréquence d'apparition : <span className="font-medium text-slate-700">Répétition rapprochée des erreurs</span>
              </span>
            </span>
            <span className="font-mono tabular-nums text-slate-500">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Learning Card OR Deck Completed */}
        {activeWords.length === 0 ? (
          <DeckCompleted
            words={categoryWords}
            categoryTitle={currentCategoryInfo.title}
            onReset={() => {
              setVocabulary(prev =>
                prev.map(w => {
                  if (selectedCategory === 'all' || w.category === selectedCategory) {
                    return { ...w, count: 0 };
                  }
                  return w;
                })
              );
              setStreak(0);
            }}
            onOpenDeckList={() => setIsWordListOpen(true)}
          />
        ) : currentWord ? (
          <VocabCard
            key={currentWord.id}
            word={currentWord}
            allWords={categoryWords}
            direction={direction}
            mode={mode}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
            feedbackState={feedbackState}
          />
        ) : null}

        {/* Helpful keyboard shortcuts hint */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <span>
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Entrée</kbd> pour valider
          </span>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => setIsWordListOpen(true)}
            className="text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
          >
            Voir tous les mots ({vocabulary.length})
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 bg-white text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apprentissage interactif du vocabulaire français-anglais</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddWordOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              + Ajouter un mot
            </button>
            <span className="text-slate-300">·</span>
            <span>Répétition espacée à 3 validations</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WordListModal
        isOpen={isWordListOpen}
        onClose={() => setIsWordListOpen(false)}
        categories={CATEGORIES}
        selectedCategoryId={selectedCategory}
        onSelectCategory={catId => {
          setSelectedCategory(catId);
          setIsWordListOpen(false);
        }}
        words={vocabulary}
        onToggleMastery={handleToggleMastery}
        onResetWord={handleResetWord}
        onOpenAddModal={() => setIsAddWordOpen(true)}
      />

      <AddWordModal
        isOpen={isAddWordOpen}
        onClose={() => setIsAddWordOpen(false)}
        categories={CATEGORIES}
        onAddWord={handleAddWord}
      />
    </div>
  );
}
