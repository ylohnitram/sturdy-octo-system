
import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Tag, Calendar, MoreVertical, Lock, X, Save, Link as LinkIcon, User, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { searchUsers } from '../services/userService';
import { JournalEntry, UserProfile } from '../types';
import { Button } from './Button';

export const JournalView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form States
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newRating, setNewRating] = useState(3);
    const [newAge, setNewAge] = useState('');
    const [newTags, setNewTags] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Linking Logic
    const [linkQuery, setLinkQuery] = useState('');
    const [linkResults, setLinkResults] = useState<UserProfile[]>([]);
    const [linkedProfile, setLinkedProfile] = useState<UserProfile | null>(null);
    const [showLinkSearch, setShowLinkSearch] = useState(false);

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

    // User Search Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (linkQuery.length >= 2) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const results = await searchUsers(linkQuery, user.id);
                    setLinkResults(results);
                }
            } else {
                setLinkResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [linkQuery]);

    const handleSelectProfile = (profile: UserProfile) => {
        setLinkedProfile(profile);
        setNewName(profile.name); // Auto-fill name
        setLinkQuery('');
        setShowLinkSearch(false);
    };

    const handleSaveEntry = async () => {
        if (!newName) return;
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

            const { error } = await supabase.from('journal_entries').insert({
                user_id: user.id,
                name: newName,
                date: newDate,
                rating: newRating,
                partner_age: newAge ? parseInt(newAge) : null,
                tags: tagsArray,
                notes: newNotes,
                linked_profile_id: linkedProfile?.id || null,
                avatar_url: linkedProfile?.avatarUrl || null
            });

            if (!error) {
                setIsAddModalOpen(false);
                // Reset form
                setNewName('');
                setNewRating(3);
                setNewAge('');
                setNewTags('');
                setNewNotes('');
                setLinkedProfile(null);
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
                        Černá Kniha <Lock size={16} className="text-slate-500" />
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
                    <p className="text-slate-500 text-sm">Načítám deník...</p>
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
                                    {entry.partnerAge && <span className="text-xs text-slate-500 ml-2">• {entry.partnerAge} let</span>}
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
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
                    <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">Nový Zářez</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-grow min-h-0">

                            {/* NAME INPUT WITH LINKING */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex justify-between">
                                    <span>Jméno / Přezdívka</span>
                                    {!linkedProfile ? (
                                        <button onClick={() => setShowLinkSearch(!showLinkSearch)} className="text-red-500 flex items-center gap-1 hover:text-red-400">
                                            <LinkIcon size={10} /> Propojit s Notch profilem
                                        </button>
                                    ) : (
                                        <button onClick={() => { setLinkedProfile(null); setNewName(''); }} className="text-slate-400 flex items-center gap-1 hover:text-white">
                                            <X size={10} /> Odpojit {linkedProfile.name}
                                        </button>
                                    )}
                                </label>

                                {showLinkSearch && !linkedProfile ? (
                                    <div className="mb-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full bg-slate-800 border border-red-500/50 rounded-xl p-2 pl-9 text-sm text-white focus:outline-none"
                                                placeholder="Hledat uživatele Notch..."
                                                value={linkQuery}
                                                onChange={e => setLinkQuery(e.target.value)}
                                            />
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        {linkResults.length > 0 && (
                                            <div className="mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                                                {linkResults.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-2 p-2 hover:bg-slate-700 cursor-pointer"
                                                        onClick={() => handleSelectProfile(user)}
                                                    >
                                                        <img src={user.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                                        <span className="text-sm text-white">{user.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                <div className="relative">
                                    <input
                                        type="text"
                                        className={`w-full bg-slate-950 border rounded-xl p-3 text-white focus:outline-none ${linkedProfile ? 'border-blue-500 pl-10' : 'border-slate-700 focus:border-red-500'}`}
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="Např. Katka z baru"
                                        readOnly={!!linkedProfile}
                                    />
                                    {linkedProfile && (
                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Věk (volitelné)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-red-500 focus:outline-none"
                                        value={newAge}
                                        onChange={e => setNewAge(e.target.value)}
                                        placeholder="25"
                                    />
                                </div>
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
                        </div>

                        {/* FIXED FOOTER */}
                        <div className="p-4 border-t border-slate-800 bg-slate-900 flex-none">
                            <Button fullWidth onClick={handleSaveEntry} disabled={!newName || saving}>
                                {saving ? 'Ukládám...' : <><Save size={18} className="mr-2" /> Uložit do deníku</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
