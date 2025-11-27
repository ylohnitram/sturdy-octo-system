import React, { useState, useEffect } from 'react';
import { X, Target, Heart, XCircle, MessageCircle, MapPin, Zap } from 'lucide-react';
import { Hotspot, HotspotUser, UserTier } from '../types';
import { fetchHotspotUsers } from '../services/userService';

interface HotspotUsersModalProps {
    hotspot: Hotspot;
    onClose: () => void;
    onViewProfile?: (userId: string) => void;
}

export const HotspotUsersModal: React.FC<HotspotUsersModalProps> = ({ hotspot, onClose, onViewProfile }) => {
    const [users, setUsers] = useState<HotspotUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            const data = await fetchHotspotUsers(hotspot.id);
            setUsers(data);
            setLoading(false);
        };
        loadUsers();
    }, [hotspot.id]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'target':
                return <Target size={16} className="text-red-500" />;
            case 'liked':
                return <Heart size={16} className="text-pink-500" fill="currentColor" />;
            case 'dismissed':
                return <XCircle size={16} className="text-slate-500" />;
            case 'matched':
                return <MessageCircle size={16} className="text-green-500" />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'target':
                return 'Cíl';
            case 'liked':
                return 'Lajknutý';
            case 'dismissed':
                return 'Odmítnutý';
            case 'matched':
                return 'Match';
            default:
                return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'target':
                return 'bg-red-500/20 border-red-500/50 text-red-300';
            case 'liked':
                return 'bg-pink-500/20 border-pink-500/50 text-pink-300';
            case 'dismissed':
                return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
            case 'matched':
                return 'bg-green-500/20 border-green-500/50 text-green-300';
            default:
                return 'bg-slate-500/20 border-slate-500/50 text-slate-400';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-1">{hotspot.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin size={14} />
                                <span>{hotspot.distance.toFixed(1)} km</span>
                                <span>•</span>
                                <span className="capitalize">{hotspot.label}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-slate-300">
                                <span className="font-bold text-white">{hotspot.count}</span> aktivních
                            </span>
                        </div>
                        {hotspot.targetCount > 0 && (
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-red-500" />
                                <span className="text-sm text-slate-300">
                                    <span className="font-bold text-red-400">{hotspot.targetCount}</span> nových cílů
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400 animate-pulse">Načítám uživatele...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Target className="text-slate-600" size={32} />
                            </div>
                            <p className="text-slate-400">Nikdo tu momentálně není</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => onViewProfile?.(user.id)}
                                    className={`bg-slate-800/50 backdrop-blur rounded-xl border p-4 transition-all cursor-pointer hover:bg-slate-800 ${user.status === 'target'
                                            ? 'border-red-500/50 shadow-lg shadow-red-900/20'
                                            : 'border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={user.avatarUrl}
                                                alt={user.username}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-slate-700"
                                            />
                                            {user.status === 'target' && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                                                    <Target size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white truncate">
                                                    {user.username}, {user.age}
                                                </h3>
                                                {user.tier !== UserTier.FREE && (
                                                    <Zap size={12} className="text-yellow-400" fill="currentColor" />
                                                )}
                                            </div>
                                            {user.bio && (
                                                <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                                                    {user.bio}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">
                                                    Notch: <span className="text-red-400 font-bold">{user.bodyCount}</span>
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {user.distanceKm.toFixed(1)} km
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold ${getStatusColor(user.status)}`}>
                                            {getStatusIcon(user.status)}
                                            <span>{getStatusLabel(user.status)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
