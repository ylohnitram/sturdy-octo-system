import React from 'react';
import { UserStats } from '../types';
import { Coins, Plus, Bell } from 'lucide-react';

interface HeaderProps {
    userStats: UserStats;
    avatarUrl?: string;
    onOpenStore: () => void;
    onNavigateProfile: () => void;
    onOpenNotifications?: () => void;
    notificationsEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    userStats,
    avatarUrl,
    onOpenStore,
    onNavigateProfile,
    onOpenNotifications
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between max-w-md mx-auto">
            {/* Left: Profile */}
            <div
                onClick={onNavigateProfile}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
                <div className="relative">
                    <img
                        src={avatarUrl || 'https://picsum.photos/200'}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                        <div className={`w-2.5 h-2.5 rounded-full ${userStats.isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white leading-none">{userStats.username || 'Lovce'}</span>
                        {userStats.tier === 'PREMIUM' && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded font-bold">GOLD</span>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                        {userStats.tier === 'PREMIUM' ? 'Premium Member' : 'Free Plan'}
                    </div>
                </div>
            </div>

            {/* Right: Notifications & Coins */}
            <div className="flex items-center gap-2">
                <Coins size={14} className="text-yellow-500" />
                <span className="text-xs font-bold text-white">{userStats.coins}</span>
                <div className="bg-slate-700 rounded-full p-0.5">
                    <Plus size={10} className="text-slate-400" />
                </div>
            </button>
        </div>
        </div >
    );
};
