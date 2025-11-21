
import React from 'react';
import { Flame, Trophy, PieChart, User, BookLock, ImageIcon } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { view: AppView.DISCOVERY, icon: Flame, label: 'Lov' },
    { view: AppView.LEADERBOARD, icon: Trophy, label: 'Žebříček' },
    { view: AppView.JOURNAL, icon: BookLock, label: 'Deník' },
    { view: AppView.GALLERY, icon: ImageIcon, label: 'Galerie' },
    { view: AppView.ANALYTICS, icon: PieChart, label: 'Statistika' },
    { view: AppView.PROFILE, icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe z-40 flex flex-col">
      {/* Footer Info - Integrated into Navigation */}
      <div className="w-full text-center py-1 bg-slate-950/50 border-b border-white/5">
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono tracking-wider">
          <span className="font-black text-slate-500">NOTCH</span>
          <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
          <span>v{import.meta.env.PACKAGE_VERSION}</span>
        </div>
      </div>

      <div className="flex justify-between items-center h-16 max-w-md mx-auto px-4 w-full">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center w-12 transition-all duration-200 ${isActive ? 'text-red-500 scale-110' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
