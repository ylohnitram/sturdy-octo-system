import React, { useState, useEffect } from 'react';
import { Ghost, UserX, Loader2 } from 'lucide-react';
import { fetchGhostList, unghostUser, GhostedUser } from '../services/userService';

export const GhostListView: React.FC = () => {
    const [ghostedUsers, setGhostedUsers] = useState<GhostedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [unghosting, setUnghosting] = useState<string | null>(null);
    const [showUnghostConfirm, setShowUnghostConfirm] = useState(false);
    const [userToUnghost, setUserToUnghost] = useState<{ id: string, username: string } | null>(null);

    useEffect(() => {
        loadGhostList();
    }, []);

    const loadGhostList = async () => {
        setLoading(true);
        const users = await fetchGhostList();
        setGhostedUsers(users);
        setLoading(false);
    };

    const handleUnghost = (userId: string, username: string) => {
        setUserToUnghost({ id: userId, username });
        setShowUnghostConfirm(true);
    };

    const confirmUnghost = async () => {
        if (!userToUnghost) return;

        const userId = userToUnghost.id;
        setUnghosting(userId);
        setShowUnghostConfirm(false);

        const success = await unghostUser(userId);
        if (success) {
            setGhostedUsers(prev => prev.filter(u => u.blockedId !== userId));
        } else {
            alert('Nepodařilo se odghostnout uživatele.');
        }
        setUnghosting(null);
        setUserToUnghost(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Dnes';
        if (diffDays === 1) return 'Včera';
        if (diffDays < 7) return `Před ${diffDays} dny`;
        return date.toLocaleDateString('cs-CZ');
    };

    return (
        <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0 bg-slate-900">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
                        <Ghost size={24} className="text-red-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Ghost List</h1>
                </div>
                <p className="text-sm text-slate-400">
                    Uživatelé, které jsi ghostnul. Můžeš je odghostnout a obnovit komunikaci.
                </p>
            </div>

            {/* Ghost List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            ) : ghostedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <Ghost size={40} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Žádní ghostnutí uživatelé</h3>
                    <p className="text-sm text-slate-500">
                        Zatím jsi nikoho neghostnul.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {ghostedUsers.map(user => (
                        <div
                            key={user.blockedId}
                            className="relative group p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-red-500/30 transition-all duration-300"
                        >
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm"></div>

                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="relative">
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.username}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-600 opacity-60"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border-2 border-red-500/50">
                                        <Ghost size={12} className="text-red-400" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-white truncate">{user.username}</h3>
                                    <p className="text-xs text-slate-500">
                                        Ghostnuto: {formatDate(user.blockedAt)}
                                    </p>
                                </div>

                                {/* Unghost Button */}
                                <button
                                    onClick={() => handleUnghost(user.blockedId, user.username)}
                                    disabled={unghosting === user.blockedId}
                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-bold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/20"
                                >
                                    {unghosting === user.blockedId ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <UserX size={16} />
                                    )}
                                    Odghostnout
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Unghost Confirmation Modal */}
            {showUnghostConfirm && userToUnghost && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <UserX size={32} className="text-green-400" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-white text-center mb-2">
                            Odghostnout {userToUnghost.username}?
                        </h3>

                        {/* Description */}
                        <div className="space-y-2 mb-6">
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Obnoví se možnost komunikace</div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Uživatel se znovu objeví v chatu</div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Budete se navzájem vidět v Lovu</div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnghostConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={confirmUnghost}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
                            >
                                Odghostnout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
