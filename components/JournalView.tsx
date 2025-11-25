
import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Tag, X, Save, CheckCircle, Ghost, Trash2, Edit2, Image, MessageCircle, UserX, Skull, MoreHorizontal, Book } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchAllMatchedUsersForDiary, unghostUser } from '../services/userService';
import { JournalEntry, UserProfile } from '../types';
import { Button } from './Button';
import { PageHeader } from './PageHeader';

interface JournalViewProps {
    onOpenChat?: (partnerId: string) => void;
    onViewProfile?: (userId: string) => void;
}

interface ExtendedJournalEntry extends JournalEntry {
    profileStatus: 'active' | 'ghosted' | 'deleted';
}

export const JournalView: React.FC<JournalViewProps> = ({ onOpenChat, onViewProfile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState<ExtendedJournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Action Modal State
    const [selectedEntryForAction, setSelectedEntryForAction] = useState<ExtendedJournalEntry | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // ID if editing existing entry

    const fetchEntries = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Journal Entries
        const { data: journalData, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (journalData) {
            // 2. Collect Linked Profile IDs
            const linkedIds = journalData
                .map((e: any) => e.linked_profile_id)
                .filter((id: string) => id); // Remove nulls

            // 3. Fetch Profiles (to check existence)
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id')
                .in('id', linkedIds);

            const existingProfileIds = new Set((profilesData || []).map((p: any) => p.id));

            // 4. Fetch Ghost List
            const { data: ghostData } = await supabase.rpc('get_ghost_list');
            const ghostedIds = new Set((ghostData || []).map((g: any) => g.blocked_id));

            // 5. Map Entries with Status
            const mappedEntries: ExtendedJournalEntry[] = journalData.map((e: any) => {
                let status: 'active' | 'ghosted' | 'deleted' = 'active';

                if (e.linked_profile_id) {
                    if (!existingProfileIds.has(e.linked_profile_id)) {
                        status = 'deleted';
                    } else if (ghostedIds.has(e.linked_profile_id)) {
                        status = 'ghosted';
                    }
                }

                return {
                    id: e.id,
                    name: e.name,
                    date: e.date,
                    rating: e.rating,
                    partnerAge: e.partner_age,
                    partnerAgeAtMatch: e.partner_age_at_match,
                    tags: e.tags || [],
                    notes: e.notes,
                    avatarUrl: e.avatar_url || `https://ui-avatars.com/api/?name=${e.name}&background=random`,
                    linkedProfileId: e.linked_profile_id,
                    profileStatus: status
                };
            });
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

            let error;

            if (editingEntryId) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('journal_entries')
                    .update({
                        date: newDate,
                        rating: newRating,
                        tags: tagsArray,
                        notes: newNotes,
                        // Name, Age, LinkedProfile, Avatar are NOT updated to preserve history/integrity
                    })
                    .eq('id', editingEntryId);
                error = updateError;
            } else {
                // INSERT
                const { error: insertError } = await supabase.from('journal_entries').insert({
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
                error = insertError;
            }

            if (!error) {
                setIsAddModalOpen(false);
                resetForm();
                fetchEntries();
            } else {
                alert('Chyba při ukládání.');
                console.error(error);
            }
        }
        setSaving(false);
    };

    const resetForm = () => {
        setSelectedProfile(null);
        setNewDate(new Date().toISOString().split('T')[0]);
        setNewRating(3);
        setNewTags('');
        setNewNotes('');
        setEditingEntryId(null);
    };

    const handleEntryClick = (entry: ExtendedJournalEntry) => {
        setSelectedEntryForAction(entry);
        setShowActionModal(true);
    };

    // --- ACTIONS ---

    const handleDeleteClick = () => {
        setShowActionModal(false);
        setShowDeleteConfirm(true);
    };

    const performDelete = async () => {
        if (!selectedEntryForAction) return;

        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', selectedEntryForAction.id);

        if (!error) {
            setEntries(prev => prev.filter(e => e.id !== selectedEntryForAction.id));
            setShowDeleteConfirm(false);
        } else {
            alert('Chyba při mazání.');
        }
    };

    const handleEditEntry = () => {
        if (!selectedEntryForAction) return;

        // Pre-fill form
        setSelectedProfile({
            id: selectedEntryForAction.linkedProfileId || '',
            name: selectedEntryForAction.name,
            age: selectedEntryForAction.partnerAge,
            avatarUrl: selectedEntryForAction.avatarUrl,
            matchCreatedAt: '', // Not needed for edit
            isGhostedByMe: selectedEntryForAction.profileStatus === 'ghosted',
            ageAtMatch: selectedEntryForAction.partnerAgeAtMatch,
            bio: '', stats: {} as any, tier: 'FREE' as any, isOnline: false, distanceKm: 0
        });
        setNewDate(selectedEntryForAction.date);
        setNewRating(selectedEntryForAction.rating);
        setNewTags(selectedEntryForAction.tags.join(', '));
        setNewNotes(selectedEntryForAction.notes || '');
        setEditingEntryId(selectedEntryForAction.id);

        setShowActionModal(false);
        setIsAddModalOpen(true);
    };

    const handleViewGallery = () => {
        if (selectedEntryForAction?.linkedProfileId && onViewProfile) {
            onViewProfile(selectedEntryForAction.linkedProfileId);
            setShowActionModal(false);
        }
    };

    const handleSendMessage = () => {
        if (selectedEntryForAction?.linkedProfileId && onOpenChat) {
            onOpenChat(selectedEntryForAction.linkedProfileId);
            setShowActionModal(false);
        }
    };

    const handleUnghost = async () => {
        if (!selectedEntryForAction?.linkedProfileId) return;

        const success = await unghostUser(selectedEntryForAction.linkedProfileId);
        if (success) {
            // Update local state
            setEntries(prev => prev.map(e =>
                e.id === selectedEntryForAction.id ? { ...e, profileStatus: 'active' } : e
            ));
            // Update selected entry status to refresh modal buttons immediately
            setSelectedEntryForAction(prev => prev ? { ...prev, profileStatus: 'active' } : null);
            alert('Uživatel byl odghostnut.');
        } else {
            alert('Chyba při odghostování.');
        }
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
            <PageHeader
                title="Černá"
                highlight="Kniha"
                subtitle="Tvůj soukromý seznam úlovků"
                icon={<Book size={24} />}
                action={
                    <Button
                        size="sm"
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-full w-10 h-10 !p-0 flex items-center justify-center shadow-lg shadow-red-900/20"
                    >
                        <Plus size={24} />
                    </Button>
                }
            />

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
                    <div className="text-[10px] text-slate-500 uppercase">Zářezů</div>
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
                    <Button size="sm" variant="secondary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>+ Přidat první</Button>
                </div>
            )}

            {/* Entries List */}
            <div className="space-y-4 pb-20">
                {entries.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))).map((entry) => (
                    <div
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative group hover:border-red-500/50 transition-all cursor-pointer active:scale-[0.98]"
                    >

                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <img src={entry.avatarUrl} alt="" className={`w-12 h-12 rounded-full object-cover border-2 bg-slate-700 ${entry.profileStatus === 'ghosted' ? 'grayscale border-slate-600' : 'border-slate-600'}`} />
                                {entry.profileStatus === 'active' && entry.linkedProfileId && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-slate-800" title="Ověřený Notch uživatel">
                                        <CheckCircle size={10} className="text-white" />
                                    </div>
                                )}
                                {entry.profileStatus === 'ghosted' && (
                                    <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-0.5 border-2 border-slate-800" title="Ghostnutý uživatel">
                                        <Ghost size={10} className="text-slate-400" />
                                    </div>
                                )}
                                {entry.profileStatus === 'deleted' && (
                                    <div className="absolute -bottom-1 -right-1 bg-red-900 rounded-full p-0.5 border-2 border-slate-800" title="Smazaný profil">
                                        <Skull size={10} className="text-red-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start pr-2">
                                    <h3 className={`font-bold text-lg flex items-center gap-2 ${entry.profileStatus === 'deleted' ? 'text-slate-500 line-through' : 'text-white'}`}>
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

                            {/* More Icon Indicator */}
                            <div className="absolute top-4 right-4 text-slate-600 opacity-50 group-hover:opacity-100">
                                <MoreHorizontal size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ACTION MODAL */}
            {showActionModal && selectedEntryForAction && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowActionModal(false)}>
                    <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 text-center border-b border-slate-800 bg-slate-900/50">
                            <div className="relative inline-block mb-3">
                                <img
                                    src={selectedEntryForAction.avatarUrl}
                                    className={`w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-xl ${selectedEntryForAction.profileStatus === 'ghosted' ? 'grayscale' : ''}`}
                                    alt=""
                                />
                                {selectedEntryForAction.profileStatus === 'ghosted' && (
                                    <div className="absolute bottom-0 right-0 bg-slate-700 p-1.5 rounded-full border-4 border-slate-900">
                                        <Ghost size={16} className="text-slate-300" />
                                    </div>
                                )}
                                {selectedEntryForAction.profileStatus === 'deleted' && (
                                    <div className="absolute bottom-0 right-0 bg-red-900 p-1.5 rounded-full border-4 border-slate-900">
                                        <Skull size={16} className="text-red-300" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{selectedEntryForAction.name}</h3>
                            <div className="text-sm text-slate-500">
                                {selectedEntryForAction.profileStatus === 'active' && 'Aktivní profil'}
                                {selectedEntryForAction.profileStatus === 'ghosted' && 'Ghostnutý uživatel'}
                                {selectedEntryForAction.profileStatus === 'deleted' && 'Smazaný profil'}
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="p-4 grid gap-2">
                            {/* 1. DELETE (Always available) */}
                            <button
                                onClick={handleDeleteClick}
                                className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors border border-slate-700 hover:border-red-900/50"
                            >
                                <div className="bg-red-500/10 p-2 rounded-lg"><Trash2 size={20} /></div>
                                <div className="font-semibold">Smazat zářez</div>
                            </button>

                            {/* 2. EDIT (Always available) */}
                            <button
                                onClick={handleEditEntry}
                                className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                            >
                                <div className="bg-slate-700 p-2 rounded-lg"><Edit2 size={20} /></div>
                                <div className="font-semibold">Upravit zářez</div>
                            </button>

                            {/* 3. GALLERY (If not deleted) */}
                            {selectedEntryForAction.profileStatus !== 'deleted' && (
                                <button
                                    onClick={handleViewGallery}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                                >
                                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400"><Image size={20} /></div>
                                    <div className="font-semibold">Zobrazit galerii</div>
                                </button>
                            )}

                            {/* 4. MESSAGE (Only if active) */}
                            {selectedEntryForAction.profileStatus === 'active' && (
                                <button
                                    onClick={handleSendMessage}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                                >
                                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400"><MessageCircle size={20} /></div>
                                    <div className="font-semibold">Napsat zprávu</div>
                                </button>
                            )}

                            {/* 5. UNGHOST (Only if ghosted) */}
                            {selectedEntryForAction.profileStatus === 'ghosted' && (
                                <button
                                    onClick={handleUnghost}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                                >
                                    <div className="bg-green-500/10 p-2 rounded-lg text-green-400"><UserX size={20} /></div>
                                    <div className="font-semibold">Odghostnout</div>
                                </button>
                            )}
                        </div>

                        {/* Cancel */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="w-full py-3 text-slate-500 font-medium hover:text-white transition-colors"
                            >
                                Zrušit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && selectedEntryForAction && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-500" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-white text-center mb-2">
                            Smazat zářez?
                        </h3>

                        {/* Description */}
                        <p className="text-slate-400 text-center text-sm mb-6">
                            Opravdu chceš smazat zářez o <strong>{selectedEntryForAction.name}</strong>? Tato akce je nevratná.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={performDelete}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/20"
                            >
                                Smazat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD ENTRY MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:pb-4">
                    <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-white">{editingEntryId ? 'Upravit Zářez' : 'Nový Zářez'}</h3>
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
                                    <div className={`bg-slate-800 p-3 rounded-xl border border-blue-500/50 flex items-center justify-between ${editingEntryId ? 'opacity-75' : ''}`}>
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
                                        {!editingEntryId && (
                                            <button
                                                onClick={() => setSelectedProfile(null)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        {editingEntryId && (
                                            <span className="text-xs text-slate-500 italic px-2">Nelze změnit</span>
                                        )}
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
                                    {saving ? 'Ukládám...' : <><Save size={18} className="mr-2" /> {editingEntryId ? 'Uložit změny' : 'Přidat zářez'}</>}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
