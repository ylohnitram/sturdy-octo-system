import React, { useState, useEffect } from 'react';
import { Ghost, UserX, Loader2, X } from 'lucide-react';
import { fetchGhostList, unghostUser, GhostedUser } from '../services/userService';

interface GhostListModalProps {
    onClose: () => void;
}

export const GhostListModal: React.FC<GhostListModalProps> = ({ onClose }) => {
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md h-[80vh] rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                            <Ghost size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-tight italic">Ghost List</h2>
                            <p className="text-xs text-slate-400">Správa blokovaných uživatelů</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
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
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                                Zatím jsi nikoho neghostnul. Všichni jsou v bezpečí.
                            </p>
                        </div>
                    ) : (
                        ghostedUsers.map(user => (
                            <div
                                key={user.blockedId}
                                className="relative group p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-green-500/30 hover:bg-slate-800/80 transition-all duration-300 overflow-hidden"
                            >
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex items-center gap-4 relative z-10">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.username}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 opacity-60 grayscale group-hover:opacity-80 transition-all"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border-2 border-red-500/50">
                                            <Ghost size={10} className="text-red-400" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-bold text-base text-white truncate group-hover:text-green-400 transition-colors">{user.username}</h3>
                                        <p className="text-[10px] text-slate-500">
                                            {formatDate(user.blockedAt)}
                                        </p>
                                    </div>

                                    {/* Unghost Button */}
                                    <button
                                        onClick={() => handleUnghost(user.blockedId, user.username)}
                                        disabled={unghosting === user.blockedId}
                                        className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-green-500/20"
                                    >
                                        {unghosting === user.blockedId ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <UserX size={12} />
                                        )}
                                        Odghostnout
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Unghost Confirmation Overlay - Nested inside the modal container */}
                {showUnghostConfirm && userToUnghost && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
                        <div className="w-full max-w-xs text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                <UserX size={32} className="text-green-400" />
                            </div>

                            <h3 className="text-xl font-black text-white mb-2">
                                Odghostnout {userToUnghost.username}?
                            </h3>

                            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left space-y-2 border border-slate-700">
                                <div className="flex items-start gap-2 text-xs text-slate-300">
                                    <div className="text-green-400 mt-0.5">✓</div>
                                    <div>Obnoví se možnost komunikace</div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-slate-300">
                                    <div className="text-green-400 mt-0.5">✓</div>
                                    <div>Uživatel se znovu objeví v chatu</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUnghostConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Zrušit
                                </button>
                                <button
                                    onClick={confirmUnghost}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 text-sm"
                                >
                                    Odghostnout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
