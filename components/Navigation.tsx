
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
      <div className="w-full text-center py-1 bg-slate-950/50 border-b border-white/5">\n        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono tracking-wider">
        <span className="font-black text-slate-500">NOTCH</span>
        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
        <span>v{import.meta.env.PACKAGE_VERSION}</span>
      </div>
      </div>

      <div className="flex justify-between items-center h-16 max-w-md mx-auto px-2 w-full">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 group ${isActive ? 'scale-105' : 'hover:scale-105'
                }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <div className="absolute inset-0 mx-auto w-14 bg-gradient-to-b from-red-500/20 to-transparent rounded-2xl blur-lg animate-pulse"></div>
              )}

              {/* Icon container */}
              <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${isActive
                ? 'bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-500/30'
                : 'bg-transparent group-hover:bg-slate-800/50'
                }`}>
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}
                />
              </div>

              {/* Label */}
              <span className={`text-[9px] mt-0.5 font-medium transition-colors duration-300 ${isActive ? 'text-red-400 font-bold' : 'text-slate-600 group-hover:text-slate-400'
                }`}>
                {item.label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-1 h-1 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
