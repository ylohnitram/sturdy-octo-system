import React, { useState, useEffect } from 'react';
import { Trophy, UserPlus, Check, X as XIcon } from 'lucide-react';
import { UserStats, LeaderboardEntry, RivalRequest } from '../types';
import { fetchLeaderboard, fetchRivalsLeaderboard, sendRivalRequest, fetchPendingRivalRequests, respondToRivalRequest } from '../services/userService';

interface LeaderboardViewProps {
  userStats: UserStats;
  onOpenPremium: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ userStats, onOpenPremium }) => {
  const [filter, setFilter] = useState<'global' | 'weekly' | 'rivals'>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Rivals State
  const [showAddRival, setShowAddRival] = useState(false);
  const [rivalUsername, setRivalUsername] = useState('');
  const [rivalRequests, setRivalRequests] = useState<RivalRequest[]>([]);
  const [requestMessage, setRequestMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    if (filter === 'rivals') {
      const data = await fetchRivalsLeaderboard();
      setLeaderboardData(data);
      const requests = await fetchPendingRivalRequests();
      setRivalRequests(requests);
    } else {
      const data = await fetchLeaderboard();
      setLeaderboardData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleSendRequest = async () => {
    if (!rivalUsername.trim()) return;
    const result = await sendRivalRequest(rivalUsername);
    setRequestMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    if (result.success) setRivalUsername('');
    setTimeout(() => setRequestMessage(null), 3000);
  };

  const handleRespond = async (id: string, accept: boolean) => {
    await respondToRivalRequest(id, accept);
    loadData();
  };

  return (
    <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Žebříček <span className="text-yellow-500">Lovců</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Porovnej své skóre s ostatními</p>
        </div>
        <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Trophy className="text-yellow-500" size={24} />
        </div>
      </div>

      <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 backdrop-blur-sm border border-slate-700/50">
        {(['global', 'weekly', 'rivals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${filter === t
              ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
          >
            {t === 'global' && 'Globální'}
            {t === 'weekly' && 'Tento Týden'}
            {t === 'rivals' && 'Rivalové'}
          </button>
        ))}
      </div>

      {filter === 'rivals' && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddRival(!showAddRival)}
            className="w-full py-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors mb-4"
          >
            <UserPlus size={18} /> {showAddRival ? 'Zavřít' : 'Vyzvat Rivala'}
          </button>

          {showAddRival && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
              <h3 className="text-white font-bold mb-2 text-sm">Najít Rivala</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Zadej username..."
                  value={rivalUsername}
                  onChange={(e) => setRivalUsername(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleSendRequest}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700"
                >
                  Vyzvat
                </button>
              </div>
              {requestMessage && (
                <p className={`text-xs mt-2 ${requestMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {requestMessage.text}
                </p>
              )}
            </div>
          )}

          {rivalRequests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Čekající výzvy</h3>
              <div className="space-y-2">
                {rivalRequests.map(req => (
                  <div key={req.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={req.requester.avatarUrl || 'https://picsum.photos/200'} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-white font-bold text-sm">{req.requester.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(req.id, true)} className="p-1.5 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30"><Check size={16} /></button>
                      <button onClick={() => handleRespond(req.id, false)} className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30"><XIcon size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Načítání...</div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            {filter === 'rivals' ? 'Zatím nemáš žádné rivaly. Vyzvi někoho!' : 'Zatím žádná data.'}
          </div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div key={entry.id} className="flex items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="w-8 text-center font-bold text-slate-500">#{index + 1}</div>
              <img src={entry.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover mx-3" />
              <div className="flex-grow">
                <div className="font-bold text-slate-200">{entry.name}</div>
              </div>
              <div className="text-lg font-black text-red-500">{entry.score}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
