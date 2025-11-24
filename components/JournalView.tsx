
import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Tag, X, Save, CheckCircle, Ghost } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchAllMatchedUsersForDiary } from '../services/userService';
import { JournalEntry, UserProfile } from '../types';
import { Button } from './Button';


export const JournalView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Available matched users for selection
    const [availableUsers, setAvailableUsers] = useState<Array<UserProfile & { matchCreatedAt: string; isGhostedByMe: boolean; ageAtMatch?: number }>>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form States
    const [selectedProfile, setSelectedProfile] = useState<(UserProfile & { matchCreatedAt: string; isGhostedByMe: boolean; ageAtMatch?: number }) | null>(null);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newRating, setNewRating] = useState(3);
    const [newTags, setNewTags] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchEntries = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (data) {
            const mappedEntries: JournalEntry[] = data.map((e: any) => ({
                id: e.id,
                name: e.name,
                date: e.date,
                rating: e.rating,
                partnerAge: e.partner_age,
                partnerAgeAtMatch: e.partner_age_at_match,
                tags: e.tags || [],
                notes: e.notes,
                avatarUrl: e.avatar_url || `https://ui-avatars.com/api/?name=${e.name}&background=random`,
                linkedProfileId: e.linked_profile_id
            }));
            setEntries(mappedEntries);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    // Load available users when modal opens
    useEffect(() => {
        if (isAddModalOpen) {
            loadAvailableUsers();
        }
    }, [isAddModalOpen]);

    const loadAvailableUsers = async () => {
        setLoadingUsers(true);
        const users = await fetchAllMatchedUsersForDiary();
        setAvailableUsers(users);
        setLoadingUsers(false);
    };

    const handleSelectUser = (user: typeof availableUsers[0]) => {
        setSelectedProfile(user);
    };

    const handleSaveEntry = async () => {
        if (!selectedProfile) return;
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

            const { error } = await supabase.from('journal_entries').insert({
                user_id: user.id,
                name: selectedProfile.name,
                date: newDate,
                rating: newRating,
                partner_age: selectedProfile.age,
                partner_age_at_match: selectedProfile.ageAtMatch || null,
                tags: tagsArray,
                notes: newNotes,
                linked_profile_id: selectedProfile.id,
                avatar_url: selectedProfile.avatarUrl
            });

            if (!error) {
                setIsAddModalOpen(false);
                // Reset form
                setSelectedProfile(null);
                setNewDate(new Date().toISOString().split('T')[0]);
                setNewRating(3);
                setNewTags('');
                setNewNotes('');
                // Refresh list
                fetchEntries();
            } else {
                alert('Chyba při ukládání.');
                console.error(error);
            }
        }
        setSaving(false);
    };

    // Stats Calculation
    const totalEntries = entries.length;
    const avgRating = totalEntries > 0
        ? (entries.reduce((acc, curr) => acc + curr.rating, 0) / totalEntries).toFixed(1)
        : '-';

    const daysSinceLast = entries.length > 0
        ? Math.floor((new Date().getTime() - new Date(entries[0].date).getTime()) / (1000 * 3600 * 24)) + 'd'
        : '-';

    return (
        <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        Černá Kniha 📕
                    </h1>
                    <p className="text-slate-400 text-sm">Tvůj soukromý seznam úlovků</p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-full w-10 h-10 !p-0 flex items-center justify-center shadow-lg shadow-red-900/20"
                >
                    <Plus size={24} />
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Hledat podle jména nebo tagu..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                    <div className="text-2xl font-black text-white">{totalEntries}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Záznamů</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                    <div className="text-2xl font-black text-yellow-500">{avgRating}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Prům. Hodnocení</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                    <div className="text-2xl font-black text-red-500">{daysSinceLast}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Od posledního</div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-10">
                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Načítám Černou Knihu...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && entries.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-2xl">
                    <p className="text-slate-500 font-bold mb-2">Zatím prázdno.</p>
                    <p className="text-xs text-slate-600 mb-4">Ulov někoho a přidej první zářez.</p>
                    <Button size="sm" variant="secondary" onClick={() => setIsAddModalOpen(true)}>+ Přidat první</Button>
                </div>
            )}

            {/* Entries List */}
            <div className="space-y-4 pb-20">
                {entries.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))).map((entry) => (
                    <div key={entry.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative group hover:border-red-500/50 transition-colors">

                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <img src={entry.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 bg-slate-700" />
                                {entry.linkedProfileId && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-slate-800" title="Ověřený Notch uživatel">
                                        <CheckCircle size={10} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start pr-2">
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        {entry.name}
                                    </h3>
                                    <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                                </div>

                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < entry.rating ? 'currentColor' : 'none'}
                                            className={`${i < entry.rating ? 'text-yellow-500' : 'text-slate-600'}`}
                                        />
                                    ))}
                                    {entry.partnerAgeAtMatch && <span className="text-xs text-slate-500 ml-2">• {entry.partnerAgeAtMatch} let</span>}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {entry.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1 border border-slate-600">
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                </div>

                                {entry.notes && (
                                    <div className="bg-slate-900/50 p-3 rounded-lg text-xs text-slate-400 italic border border-slate-800">
                                        "{entry.notes}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ADD ENTRY MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:pb-4">
                    <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">Nový Zářez</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-grow min-h-0 overscroll-contain">

                            {/* USER SELECTION */}
                            {!selectedProfile ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                                        Vyber osobu (seřazeno podle data matche)
                                    </label>

                                    {loadingUsers ? (
                                        <div className="text-center py-8">
                                            <div className="w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-xs text-slate-500">Načítám seznam...</p>
                                        </div>
                                    ) : availableUsers.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            Nemáš zatím žádné matche s výměnou zpráv.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {availableUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer border border-slate-700 hover:border-red-500/50 transition-all"
                                                >
                                                    <div className="relative">
                                                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                                                        {user.isGhostedByMe && (
                                                            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700">
                                                                <Ghost size={12} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="font-semibold text-white">{user.name}</div>
                                                        <div className="text-xs text-slate-500">{user.ageAtMatch} let (v době matche)</div>
                                                    </div>
                                                    <div className="text-xs text-slate-600">
                                                        {new Date(user.matchCreatedAt).toLocaleDateString('cs-CZ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* SELECTED USER DISPLAY */}
                                    <div className="bg-slate-800 p-3 rounded-xl border border-blue-500/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={selectedProfile.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                                                {selectedProfile.isGhostedByMe && (
                                                    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700">
                                                        <Ghost size={12} className="text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{selectedProfile.name}</div>
                                                <div className="text-xs text-slate-500">{selectedProfile.ageAtMatch} let</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedProfile(null)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Datum</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none"
                                            value={newDate}
                                            onChange={e => setNewDate(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Hodnocení</label>
                                        <div className="flex gap-2 justify-center bg-slate-950 p-3 rounded-xl border border-slate-700">
                                            {[1, 2, 3, 4, 5].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setNewRating(r)}
                                                    className={`p-2 rounded-full transition-all ${r <= newRating ? 'text-yellow-500 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                                                >
                                                    <Star size={28} fill={r <= newRating ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tagy (odděl čárkou)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none"
                                            value={newTags}
                                            onChange={e => setNewTags(e.target.value)}
                                            placeholder="Blondýna, U mě, Rychlovka..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Poznámky</label>
                                        <textarea
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none h-24 resize-none"
                                            value={newNotes}
                                            onChange={e => setNewNotes(e.target.value)}
                                            placeholder="Detaily, co si chceš pamatovat..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* FIXED FOOTER */}
                        {selectedProfile && (
                            <div className="p-4 border-t border-slate-800 bg-slate-900 flex-none rounded-b-3xl">
                                <Button fullWidth onClick={handleSaveEntry} disabled={!selectedProfile || saving}>
                                    {saving ? 'Ukládám...' : <><Save size={18} className="mr-2" /> Uložit do Černé Knihy</>}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
