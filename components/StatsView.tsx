
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyzeProfileInsight } from '../services/geminiService';
import { fetchJournalStats } from '../services/userService';
import { supabase } from '../services/supabaseClient';
import { Zap, Calendar, Activity, Lock, Eye } from 'lucide-react';
import { Button } from './Button';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
        <p className="text-slate-300 mb-1">{label}</p>
        <p className="text-red-500 font-bold">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

import { UserStats } from '../types';

interface StatsViewProps {
  userStats: UserStats;
  onOpenPremium: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ userStats, onOpenPremium }) => {
  const [insight, setInsight] = useState<string>("Načítám...");
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await fetchJournalStats(user.id);
        setStatsData(data);

        if (data) {
          analyzeProfileInsight(data.activityData).then(setInsight);
        } else {
          setInsight("Zatím málo dat pro analýzu.");
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-red-600 rounded-full animate-spin border-t-transparent"></div></div>;
  }

  // Fallback if no data
  const ageData = statsData?.ageDistribution || [{ range: '18-20', count: 0 }, { range: '21-23', count: 0 }];
  const activityData = statsData?.activityData || [];
  const totalCount = statsData?.totalCount || 0;
  const avgAge = statsData?.avgAge || '0';

  return (
    <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tvoje Statistiky</h1>
        <p className="text-slate-400 text-sm">Analýza tvého lovu (z Černé Knihy)</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-red-500/10 w-24 h-24 rounded-full group-hover:bg-red-500/20 transition-all"></div>
          <div className="relative z-10">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap size={12} /> Celkem
            </div>
            <div className="text-4xl font-black text-white">{totalCount}</div>
            <div className="text-xs text-green-500 mt-1 font-bold">Záznamů</div>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 bg-orange-500/10 w-24 h-24 rounded-full"></div>
          <div className="relative z-10">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={12} /> Prům. Věk
            </div>
            <div className="text-4xl font-black text-white">{avgAge}</div>
            <div className="text-xs text-slate-500 mt-1 font-bold">Let</div>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg mt-1">
            <Activity size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-sm mb-1">Taktický Rozbor</h3>
            <p className="text-slate-200 text-sm italic">"{insight}"</p>
          </div>
        </div>
      </div>

      {/* Chart 1: Age Distribution */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
        <h3 className="text-slate-300 font-bold text-sm mb-4 ml-1">Věkové rozložení partnerů</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="count" fill="#EA580C" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Activity Over Time - Locked for free users */}
      {userStats.tier !== 'PREMIUM' ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 mb-6 relative overflow-hidden">
          {/* Blur Overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-slate-900/60 z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-3 bg-yellow-500/20 rounded-full mb-3">
              <Lock size={24} className="text-yellow-500" />
            </div>
            <h3 className="text-white font-bold mb-1">Výkon v čase</h3>
            <p className="text-slate-400 text-xs mb-4">Detailní historie skóre je dostupná pouze pro Premium členy.</p>
            <Button
              size="sm"
              className="bg-yellow-500 text-black hover:bg-yellow-400"
              onClick={onOpenPremium}
            >
              Odemknout Statistiky
            </Button>
          </div>

          <div className="p-4 opacity-30 pointer-events-none">
            <h3 className="text-slate-300 font-bold text-sm mb-4 ml-1">Výkon v čase (Body Score)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData.length > 0 ? activityData : [{ month: 'Jan', score: 0 }]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 'auto']} hide />
                  <Area type="monotone" dataKey="score" stroke="#EA580C" strokeWidth={3} fill="#EA580C" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
          <h3 className="text-slate-300 font-bold text-sm mb-4 ml-1">Výkon v čase (Body Score)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData.length > 0 ? activityData : [{ month: 'Jan', score: 0 }]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 'auto']} hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Area type="monotone" dataKey="score" stroke="#EA580C" strokeWidth={3} fill="url(#colorScore)" />
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
