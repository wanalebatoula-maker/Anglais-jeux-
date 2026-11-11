import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ListFilter, Volume2 } from 'lucide-react';
import { VocabWord } from '../types/vocab';
import { speakWord } from '../utils/audio';

interface DeckCompletedProps {
  words: VocabWord[];
  categoryTitle: string;
  onReset: () => void;
  onOpenDeckList: () => void;
}

export const DeckCompleted: React.FC<DeckCompletedProps> = ({
  words,
  categoryTitle,
  onReset,
  onOpenDeckList,
}) => {
  useEffect(() => {
    // Fire festive celebratory confetti
    try {
      const end = Date.now() + 1500;
      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // Ignore if canvas-confetti is not available
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 max-w-xl mx-auto text-center">
      <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl mx-auto flex items-center justify-center text-amber-500 mb-5">
        <Trophy className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Félicitations ! 🎉
      </h2>
      <p className="text-slate-600 text-base max-w-md mx-auto mb-6">
        Vous avez maîtrisé l’ensemble des {words.length} mots de la sélection{' '}
        <span className="font-semibold text-slate-900">« {categoryTitle} »</span>.
      </p>

      {/* Mini Summary Grid of Mastered Words */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left mb-6 max-h-56 overflow-y-auto divide-y divide-slate-100">
        {words.map(w => (
          <div key={w.id} className="py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{w.fr}</span>
              <span className="text-slate-400">➔</span>
              <span className="text-slate-700">{w.en}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => speakWord(w.fr, 'fr')}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Prononciation française"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => speakWord(w.en, 'en')}
                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Prononciation anglaise"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Recommencer cette liste</span>
        </button>

        <button
          onClick={onOpenDeckList}
          className="w-full sm:w-auto px-5 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ListFilter className="w-4 h-4" />
          <span>Changer de catégorie</span>
        </button>
      </div>
    </div>
  );
};
