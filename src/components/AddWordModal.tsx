import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Category, VocabWord } from '../types/vocab';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddWord: (word: Omit<VocabWord, 'id' | 'count'>) => void;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddWord,
}) => {
  const [fr, setFr] = useState('');
  const [en, setEn] = useState('');
  const [exampleFr, setExampleFr] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'phrasal');
  const [isPhrasalVerb, setIsPhrasalVerb] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fr.trim() || !en.trim()) {
      setError('Veuillez renseigner le mot français et la traduction en anglais.');
      return;
    }

    onAddWord({
      fr: fr.trim(),
      en: en.trim(),
      exampleFr:
        exampleFr.trim() ||
        `Exemple : ${fr.trim()} dans une phrase courante.`,
      exampleEn: exampleEn.trim() || undefined,
      category,
      isPhrasalVerb,
      synonymsEn: [en.trim().replace(/^to\s+/, '')],
    });

    // Reset
    setFr('');
    setEn('');
    setExampleFr('');
    setExampleEn('');
    setIsPhrasalVerb(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Ajouter un nouveau mot
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mot en français *
            </label>
            <input
              type="text"
              required
              value={fr}
              onChange={e => setFr(e.target.value)}
              placeholder="Ex: Entreprendre, Voyager, Rêver..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Traduction en anglais *
            </label>
            <input
              type="text"
              required
              value={en}
              onChange={e => setEn(e.target.value)}
              placeholder="Ex: to undertake, to travel, to dream..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phrase d'exemple (en français)
            </label>
            <textarea
              rows={2}
              value={exampleFr}
              onChange={e => setExampleFr(e.target.value)}
              placeholder="Une phrase complète pour situer le mot en contexte..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Traduction de l'exemple (en anglais)
            </label>
            <input
              type="text"
              value={exampleEn}
              onChange={e => setExampleEn(e.target.value)}
              placeholder="Optionnel : traduction anglaise de la phrase..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPhrasal"
              checked={isPhrasalVerb}
              onChange={e => setIsPhrasalVerb(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isPhrasal" className="text-xs text-slate-700 font-medium cursor-pointer">
              Ce mot est un <span className="font-semibold text-amber-800">Phrasal Verb</span> (aura une priorité d'apparition élevée)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer le mot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
