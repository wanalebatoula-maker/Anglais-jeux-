import React from 'react';
import { BookOpen, RotateCcw, ListFilter } from 'lucide-react';

interface HeaderProps {
  onOpenDeckList: () => void;
  onResetProgress: () => void;
  masteredCount: number;
  totalWords: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDeckList,
  onResetProgress,
  masteredCount,
  totalWords,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Vocabulaire FR · EN</span>
        </a>

        {/* Zone 2: Clean single-line links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={onOpenDeckList}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span>Listes & Thèmes</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap shrink-0">
            {masteredCount} / {totalWords} maîtrisés
          </span>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetProgress}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            title="Réinitialiser la progression de la liste"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Recommencer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
