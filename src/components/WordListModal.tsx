import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Volume2,
  Plus,
  RotateCcw,
  Sparkles,
  Briefcase,
  Compass,
  MessageSquare,
  Search,
  Zap,
} from 'lucide-react';
import { VocabWord, Category } from '../types/vocab';
import { speakWord } from '../utils/audio';

interface WordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  words: VocabWord[];
  onToggleMastery: (wordId: string) => void;
  onResetWord: (wordId: string) => void;
  onOpenAddModal: () => void;
}

export const WordListModal: React.FC<WordListModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  words,
  onToggleMastery,
  onResetWord,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredWords = words.filter(w => {
    const matchesCategory =
      selectedCategoryId === 'all' || w.category === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      w.fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.exampleFr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'phrasal':
        return <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'starter':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'business':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'travel':
        return <Compass className="w-4 h-4 text-emerald-500" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Listes de vocabulaire & Progression
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sélectionnez une catégorie ou explorez vos mots enregistrés
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Tous les mots ({words.length})
            </button>
            {categories.map(cat => {
              const catCount = words.filter(w => w.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <span>{cat.title}</span>
                  <span className="opacity-75 text-[11px] font-mono">({catCount})</span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Add word CTA */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un mot (français ou anglais)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAddModal();
              }}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un mot</span>
            </button>
          </div>
        </div>

        {/* Word Table / List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Aucun mot trouvé dans cette catégorie.
            </div>
          ) : (
            filteredWords.map(word => {
              const isMastered = word.count >= 3;
              return (
                <div
                  key={word.id}
                  className="py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{word.fr}</span>
                      <button
                        onClick={() => speakWord(word.fr, 'fr')}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Prononcer en français"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-700 text-sm font-medium">{word.en}</span>
                      <button
                        onClick={() => speakWord(word.en, 'en')}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Prononcer en anglais"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      {word.isPhrasalVerb && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-1">
                          Phrasal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 italic truncate mt-0.5">
                      "{word.exampleFr}"
                    </p>
                  </div>

                  {/* Actions & Mastery Pip */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map(step => (
                        <div
                          key={step}
                          className={`w-3.5 h-1.5 rounded-full ${
                            word.count >= step ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-mono tabular-nums text-slate-500 ml-1">
                        {word.count}/3
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleMastery(word.id)}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isMastered
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={isMastered ? 'Marquer comme non maîtrisé' : 'Marquer comme maîtrisé'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    {word.count > 0 && (
                      <button
                        onClick={() => onResetWord(word.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Réinitialiser ce mot"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredWords.length} mots affichés</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
