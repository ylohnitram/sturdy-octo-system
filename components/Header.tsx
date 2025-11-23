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
    isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    userStats,
    avatarUrl,
    onOpenStore,
    onNavigateProfile,
    onOpenNotifications,
    isLoading = false
}) => {
    const hasNotifications = (userStats.notificationCount || 0) > 0;
    const showSkeleton = isLoading || !userStats.username;

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 flex items-center justify-between max-w-md mx-auto pt-safe py-3">
            {/* Left: Profile */}
            <div
                onClick={showSkeleton ? undefined : onNavigateProfile}
                className={`flex items-center gap-3 ${showSkeleton ? 'cursor-wait' : 'cursor-pointer hover:opacity-80'} transition-opacity`}
            >
                {showSkeleton ? (
                    // SKELETON LOADER
                    <>
                        <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse border border-slate-700"></div>
                        <div className="flex flex-col gap-1.5">
                            <div className="w-20 h-3.5 bg-slate-800 rounded animate-pulse"></div>
                            <div className="w-14 h-2.5 bg-slate-800 rounded animate-pulse"></div>
                        </div>
                    </>
                ) : (
                    // REAL CONTENT
                    <>
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
                                <span className="text-sm font-bold text-white leading-none">{userStats.username}</span>
                                {userStats.tier === 'PREMIUM' && (
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded font-bold">GOLD</span>
                                )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                                {userStats.tier === 'PREMIUM' ? 'Premium Member' : 'Free Plan'}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Notifications & Coins */}
            <div className="flex items-center gap-2">
                {/* Notifications Bell - Dim when no notifications, bright when there are */}
                <button
                    onClick={onOpenNotifications}
                    aria-label="Open notifications"
                    className="relative p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <Bell
                        size={20}
                        className={`transition-colors ${hasNotifications
                            ? 'text-yellow-500'
                            : 'text-slate-600'
                            }`}
                    />
                    {hasNotifications && (
                        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-[8px] font-bold text-white">{userStats.notificationCount}</span>
                        </div>
                    )}
                </button>

                {/* Coins Display */}
                <button
                    onClick={onOpenStore}
                    aria-label="Open store"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full pl-2 pr-1 py-1 transition-colors"
                >
                    <Coins size={14} className="text-yellow-500" />
                    <span className="text-xs font-bold text-white">{userStats.coins}</span>
                    <div className="bg-slate-700 rounded-full p-0.5">
                        <Plus size={10} className="text-slate-400" />
                    </div>
                </button>
            </div>
        </div>
    );
};
