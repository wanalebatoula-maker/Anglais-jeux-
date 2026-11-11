import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Languages,
  ChevronRight,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';
import { VocabWord, PracticeDirection, PracticeMode } from '../types/vocab';
import { evaluateAnswer } from '../utils/fuzzyMatch';
import { speakWord } from '../utils/audio';

interface VocabCardProps {
  word: VocabWord;
  allWords: VocabWord[];
  direction: PracticeDirection;
  mode: PracticeMode;
  onAnswer: (isCorrect: boolean, isMastered: boolean) => void;
  onSkip: () => void;
  feedbackState: {
    status: 'idle' | 'success' | 'mastered' | 'error';
    message: string;
    expectedAnswer?: string;
  };
}

export const VocabCard: React.FC<VocabCardProps> = ({
  word,
  allWords,
  direction,
  mode,
  onAnswer,
  onSkip,
  feedbackState,
}) => {
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showExampleTranslation, setShowExampleTranslation] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Multiple choice options if mode === 'choice'
  const [choices, setChoices] = useState<string[]>([]);

  // Reset local state when word changes
  useEffect(() => {
    setUserInput('');
    setShowHint(false);
    setShowExampleTranslation(false);
    setSelectedChoice(null);

    if (mode === 'choice') {
      const correct = direction === 'fr-to-en' ? word.en : word.fr;
      const otherWords = allWords.filter(w => w.id !== word.id);
      // Pick 3 distractors
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
      const distractorAnswers = shuffledOthers.map(w =>
        direction === 'fr-to-en' ? w.en : w.fr
      );
      const pool = [correct, ...distractorAnswers].sort(() => Math.random() - 0.5);
      setChoices(pool);
    }

    // Auto-focus input
    if (mode === 'type') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [word.id, direction, mode]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedbackState.status !== 'idle') return;

    const evaluation = evaluateAnswer(userInput, word, direction);
    const newCount = evaluation.isCorrect ? word.count + 1 : word.count;
    const isMastered = newCount >= 3;

    onAnswer(evaluation.isCorrect, isMastered);
  };

  const handleChoiceSelect = (choice: string) => {
    if (feedbackState.status !== 'idle') return;
    setSelectedChoice(choice);
    const evaluation = evaluateAnswer(choice, word, direction);
    const newCount = evaluation.isCorrect ? word.count + 1 : word.count;
    const isMastered = newCount >= 3;
    onAnswer(evaluation.isCorrect, isMastered);
  };

  // Target word to display based on direction
  const displayWord = direction === 'fr-to-en' ? word.fr : word.en;
  const promptLabel =
    direction === 'fr-to-en'
      ? 'Entrez la traduction en anglais...'
      : 'Entrez la traduction en français...';

  // Hint generator (first letter and length dots)
  const targetAnswer = direction === 'fr-to-en' ? word.en : word.fr;
  const generateHint = () => {
    const clean = targetAnswer.replace(/^to\s+/, '');
    if (clean.length <= 2) return `Commence par "${clean[0]}"`;
    return `Commence par "${clean[0]}", contient ${clean.length} lettres`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 max-w-xl mx-auto transition-all">
      {/* Top Card Bar: Mastery progress pips (0/3 to 3/3) & Direction */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">Maîtrise du mot :</span>
          <div className="flex items-center gap-1.5" aria-label={`Maîtrise ${word.count} sur 3`}>
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-6 h-2 rounded-full transition-colors ${
                  word.count >= step ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="font-mono tabular-nums text-slate-600">({word.count}/3)</span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>{direction === 'fr-to-en' ? 'FR ➔ EN' : 'EN ➔ FR'}</span>
        </div>
      </div>

      {/* Main Word Display */}
      <div className="my-6">
        {/* Phrasal Verb High-Frequency Indicator */}
        {word.isPhrasalVerb && (
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/90 px-2.5 py-1 rounded-lg mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
            <span className="font-semibold">Phrasal Verb (Haute fréquence)</span>
            {word.particles && word.particles.length > 0 && (
              <>
                <span className="text-amber-400">·</span>
                <span className="font-mono text-[11px] text-amber-900">
                  Particule{word.particles.length > 1 ? 's' : ''} : {word.particles.join(' + ')}
                </span>
              </>
            )}
          </div>
        )}

        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {displayWord}
          </h2>

          <button
            type="button"
            onClick={() => speakWord(displayWord, direction === 'fr-to-en' ? 'fr' : 'en')}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            title="Écouter la prononciation"
            aria-label="Écouter la prononciation"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Example Sentence Container */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-left">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Exemple en contexte
          </div>
          <p className="text-slate-700 italic text-base leading-relaxed">
            "{word.exampleFr}"
          </p>

          {/* Usage Note for phrasal verbs */}
          {word.notes && (
            <div className="mt-2 text-xs text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/50">
              💡 <span className="font-medium text-slate-700">Conseil d'usage :</span> {word.notes}
            </div>
          )}

          {/* Toggleable English Translation of example */}
          {word.exampleEn && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setShowExampleTranslation(!showExampleTranslation)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                {showExampleTranslation ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Masquer la traduction</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Traduire l'exemple</span>
                  </>
                )}
              </button>

              <AnimatePresence>
                {showExampleTranslation && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-slate-600 mt-1 italic"
                  >
                    "{word.exampleEn}"
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Interaction Mode: Type Input OR Multiple Choice */}
      {mode === 'type' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              disabled={feedbackState.status !== 'idle'}
              placeholder={promptLabel}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              className={`w-full px-4 py-3.5 text-base sm:text-lg rounded-xl border transition-all outline-none bg-white ${
                feedbackState.status === 'idle'
                  ? 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100'
                  : feedbackState.status === 'error'
                  ? 'border-rose-300 bg-rose-50/30'
                  : 'border-emerald-300 bg-emerald-50/30'
              }`}
            />

            {/* Hint reveal trigger */}
            {feedbackState.status === 'idle' && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                title="Besoin d'un indice ?"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Indice</span>
              </button>
            )}
          </div>

          {showHint && feedbackState.status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{generateHint()}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={feedbackState.status !== 'idle' || !userInput.trim()}
              className="flex-1 py-3 px-5 text-sm sm:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Valider</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={feedbackState.status !== 'idle'}
              className="py-3 px-5 text-sm sm:text-base font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer"
            >
              Passer
            </button>
          </div>
        </form>
      ) : (
        /* Multiple Choice Grid */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {choices.map((choice, idx) => {
              const isSelected = selectedChoice === choice;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={feedbackState.status !== 'idle'}
                  onClick={() => handleChoiceSelect(choice)}
                  className={`p-3.5 text-left rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? feedbackState.status === 'error'
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-400 font-mono mr-2">{idx + 1}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onSkip}
              disabled={feedbackState.status !== 'idle'}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Passer cette question ➔
            </button>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedbackState.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-left ${
              feedbackState.status === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : feedbackState.status === 'mastered'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {feedbackState.status === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="font-semibold text-sm">
                {feedbackState.message}
              </div>

              {feedbackState.status === 'error' && feedbackState.expectedAnswer && (
                <div className="mt-1 text-xs text-rose-800 flex items-center gap-1">
                  <span>Réponse attendue :</span>
                  <span className="font-bold underline decoration-rose-400 underline-offset-2">
                    {feedbackState.expectedAnswer}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speakWord(
                        feedbackState.expectedAnswer!,
                        direction === 'fr-to-en' ? 'en' : 'fr'
                      )
                    }
                    className="p-1 hover:text-rose-950 rounded transition-colors"
                    title="Écouter la bonne réponse"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-medium underline text-slate-600 hover:text-slate-900 shrink-0 flex items-center gap-0.5 self-center"
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
