
import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Lock, Share2, Coins, Loader2 } from 'lucide-react';
import { LeaderboardEntry, UserTier, UserStats } from '../types';
import { fetchLeaderboard } from '../services/userService';

interface LeaderboardViewProps {
    userStats: UserStats;
    onOpenPremium: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userStats, onOpenPremium }) => {
  const [filter, setFilter] = useState<'global' | 'weekly' | 'friends'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadData = async () => {
          setLoading(true);
          const data = await fetchLeaderboard();
          setLeaderboardData(data);
          setLoading(false);
      };
      loadData();
  }, []);

  const handleShareLeaderboard = async () => {
     const shareData = {
      title: 'Notch Leaderboard',
      text: 'Podívej se na největší lovce ve městě na aplikaci Notch! 🏆',
      url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) {}
    } else {
        alert('Odkaz zkopírován!');
    }
  };

  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  if (loading) {
      return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase tracking-tighter">
            Top Lovci
            </h1>
            <p className="text-slate-400 text-sm">Notch Žebříček</p>
        </div>
        <div className="flex items-center gap-2">
             <div className="px-3 py-1 bg-slate-800 rounded-full text-yellow-500 font-bold text-xs flex items-center gap-1 border border-slate-700">
                <Coins size={12} /> {userStats.coins}
             </div>
            <button 
                onClick={handleShareLeaderboard}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
                <Share2 size={20} />
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 p-1 rounded-xl flex mb-6">
        {(['global', 'weekly', 'friends'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === t 
                ? 'bg-slate-700 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'global' ? 'Globální' : t === 'weekly' ? 'Týdenní' : 'Přátelé'}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {topThree.length > 0 ? (
      <div className="flex items-end justify-center gap-4 mb-8 px-4">
        {/* 2nd Place */}
        {topThree[1] && (
        <div className="flex flex-col items-center w-1/3">
          <div className="relative w-16 h-16 rounded-full border-4 border-slate-600 overflow-hidden mb-2 shadow-lg">
            <img src={topThree[1].user.avatarUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 bg-slate-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">2</div>
          </div>
          <div className="text-sm font-bold text-slate-300 truncate w-full text-center">{topThree[1].user.name}</div>
          <div className="text-xs font-black text-red-500">{topThree[1].score}</div>
          <div className="h-16 w-full bg-slate-800 rounded-t-lg mt-2 opacity-80"></div>
        </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
        <div className="flex flex-col items-center w-1/3 z-10 -mt-4">
          <Crown className="text-yellow-500 mb-1 animate-bounce" size={24} fill="currentColor" />
          <div className="relative w-20 h-20 rounded-full border-4 border-yellow-500 overflow-hidden mb-2 shadow-xl shadow-yellow-500/20">
            <img src={topThree[0].user.avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="text-base font-bold text-white truncate w-full text-center">{topThree[0].user.name}</div>
          <div className="text-sm font-black text-yellow-500">{topThree[0].score}</div>
          <div className="h-24 w-full bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg mt-2 relative overflow-hidden">
             <div className="absolute inset-0 bg-yellow-500/10"></div>
          </div>
        </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
        <div className="flex flex-col items-center w-1/3">
           <div className="relative w-16 h-16 rounded-full border-4 border-orange-700 overflow-hidden mb-2 shadow-lg">
            <img src={topThree[2].user.avatarUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 bg-orange-700 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">3</div>
          </div>
          <div className="text-sm font-bold text-slate-300 truncate w-full text-center">{topThree[2].user.name}</div>
          <div className="text-xs font-black text-red-500">{topThree[2].score}</div>
          <div className="h-12 w-full bg-slate-800 rounded-t-lg mt-2 opacity-80"></div>
        </div>
        )}
      </div>
      ) : (
          <div className="text-center text-slate-500 py-10">Zatím žádná data.</div>
      )}

      {/* List */}
      <div className="flex-grow overflow-y-auto no-scrollbar space-y-2">
        {rest.map((entry) => (
          <div key={entry.rank} className="flex items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="w-8 text-center font-bold text-slate-500">{entry.rank}</div>
            <img src={entry.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover mx-3" />
            <div className="flex-grow">
              <div className="font-bold text-slate-200">{entry.user.name}</div>
              <div className="text-xs text-slate-500">{entry.user.age} let • {entry.user.distanceKm}km</div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-lg font-black text-red-500">{entry.score}</div>
              <div className="flex items-center text-[10px] text-slate-400">
                {entry.trend === 'up' && <TrendingUp size={12} className="text-green-500 mr-1" />}
                {entry.trend === 'down' && <TrendingDown size={12} className="text-red-500 mr-1" />}
                {entry.trend === 'same' && <Minus size={12} className="text-slate-500 mr-1" />}
              </div>
            </div>
          </div>
        ))}

        {/* Locked Content Teaser */}
        <div 
            onClick={onOpenPremium}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/20 flex items-center justify-between cursor-pointer hover:bg-red-900/30 transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-full">
                    <Lock size={20} className="text-yellow-500" />
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-200">Odemkni TOP 100 regionu</div>
                    <div className="text-xs text-slate-500">Dostupné pouze pro Notch Gold</div>
                </div>
            </div>
            <button className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-900 text-xs font-bold rounded-lg shadow-lg">Přejít na Gold</button>
        </div>
      </div>
    </div>
  );
};
