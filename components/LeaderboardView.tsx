import React, { useState, useEffect } from 'react';
import { Trophy, UserPlus, Check, X as XIcon } from 'lucide-react';
import { UserStats, LeaderboardEntry, RivalRequest } from '../types';
import { fetchLeaderboard, fetchRivalsLeaderboard, sendRivalRequest, fetchPendingRivalRequests, respondToRivalRequest } from '../services/userService';
import { PageHeader } from './PageHeader';

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
    <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0">
      <PageHeader
        title="Žebříček"
        highlight="Lovců"
        subtitle="Porovnej své skóre s ostatními"
        icon={<Trophy size={24} />}
      />

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

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Načítání...</div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            {filter === 'rivals' ? 'Zatím nemáš žádné rivaly. Vyzvi někoho!' : 'Zatím žádná data.'}
          </div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div
              key={entry.id}
              className="relative group p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-yellow-500/30 hover:bg-slate-800/80 transition-all duration-300 overflow-hidden"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                {/* Rank Badge */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 shadow-lg shadow-yellow-500/30' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 shadow-lg shadow-slate-400/20' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-slate-900 shadow-lg shadow-orange-500/20' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                  #{index + 1}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatarUrl}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-yellow-500/50 transition-colors"
                />

                {/* Name */}
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-white text-lg truncate group-hover:text-yellow-400 transition-colors">
                    {entry.name}
                  </div>
                </div>

                {/* Score */}
                <div className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent shrink-0">
                  {entry.score}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
