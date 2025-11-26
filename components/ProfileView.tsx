
import React, { useState, useRef, useEffect } from 'react';
import { Settings, Edit, Shield, Star, Share2, LogOut, Plus, Lock, Award, EyeOff, Wand2, Coins, Copy, Camera, Ticket, KeyRound, Trash2, AlertTriangle, Cookie, Footprints, Info, X, Users, Bell, Sparkles, Ghost } from 'lucide-react';
import { Button } from './Button';
import { UserStats, TargetGender } from '../types';
import { generateUserBio } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { uploadAvatar, updateUserBio, scheduleAccountDeletion, updateUserPreferences, updateNotificationSettings } from '../services/userService';
import { PageHeader } from './PageHeader';
import { GhostListModal } from './GhostListModal';


interface ProfileViewProps {
    userStats: UserStats;
    onOpenStore: () => void;
    onOpenPremium: () => void;
    onConsumeAi: () => boolean;
    onConsumeCoins: (amount: number) => boolean;
    onNavigate?: (view: string) => void;
    onAvatarUpdate?: (newUrl: string) => void;
    avatarUrl?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
    userStats,
    onOpenStore,
    onOpenPremium,
    onConsumeAi,
    onConsumeCoins,
    onNavigate,
    onAvatarUpdate,
    avatarUrl: initialAvatarUrl
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [bio, setBio] = useState('');
    const [generatingBio, setGeneratingBio] = useState(false);
    const [unlockedGalleries, setUnlockedGalleries] = useState<number[]>([]);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || '');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showGhostList, setShowGhostList] = useState(false);

    const [showStatsInfo, setShowStatsInfo] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [targetGender, setTargetGender] = useState<TargetGender>('both');

    // Notification Settings
    const [notifyProximity, setNotifyProximity] = useState(true);
    const [notifyLikes, setNotifyLikes] = useState(true);
    const [notifyRivals, setNotifyRivals] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with prop if it changes
    useEffect(() => {
        if (initialAvatarUrl) {
            setAvatarUrl(initialAvatarUrl);
        }
    }, [initialAvatarUrl]);

    // Fetch profile data on mount
    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase.from('profiles').select('bio, avatar_url, target_gender, notify_proximity, notify_likes').eq('id', user.id).single();
                    if (data) {
                        if (data.bio) setBio(data.bio);
                        // Only set from DB if we don't have it from props/state yet, or to ensure freshness
                        if (data.avatar_url && !initialAvatarUrl) setAvatarUrl(data.avatar_url);
                        if (data.target_gender) setTargetGender(data.target_gender);
                        if (data.notify_proximity !== undefined) setNotifyProximity(data.notify_proximity);
                        if (data.notify_likes !== undefined) setNotifyLikes(data.notify_likes);
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        }
        getUser();
    }, [initialAvatarUrl]);

    const handleCopyInvite = () => {
        navigator.clipboard.writeText(userStats.inviteCode);
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Pozvánka do Notch',
            text: `Čau, mám volný vstup do Notch (ta nová appka). Použij můj VIP kód: ${userStats.inviteCode}. Platí to jen chvíli. 🤫`,
            url: `https://notch.cz?invite=${userStats.inviteCode}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopyInvite();
            alert('Kód a odkaz zkopírován do schránky! Pošli to kámošům.');
        }
    };

    const handleAiBio = async () => {
        console.log('[ProfileView] handleAiBio called, userStats:', userStats);
        const result = onConsumeAi();
        console.log('[ProfileView] onConsumeAi returned:', result);
        if (!result) {
            console.log('[ProfileView] AI credit check failed - opening premium modal');
            return;
        }

        setGeneratingBio(true);
        const newBio = await generateUserBio('Drzý', ['Party', 'Fitness', 'Cestování']);
        setBio(newBio);
        setGeneratingBio(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) updateUserBio(user.id, newBio);
    };

    const handleBioSave = async () => {
        setIsEditing(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) updateUserBio(user.id, bio);
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const publicUrl = await uploadAvatar(user.id, file);
                if (publicUrl) {
                    setAvatarUrl(publicUrl);
                    if (onAvatarUpdate) onAvatarUpdate(publicUrl);
                }
            }
        } catch (error) {
            alert('Error uploading avatar!');
            console.log(error);
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setPasswordMessage('Heslo musí mít alespoň 6 znaků.');
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordMessage('Heslo úspěšně změněno!');
            setNewPassword('');
            setTimeout(() => {
                setShowPasswordChange(false);
                setPasswordMessage('');
            }, 2000);
        } catch (e: any) {
            setPasswordMessage(e.message);
        }
    };

    const handleSavePreferences = async (newTarget: TargetGender) => {
        setTargetGender(newTarget);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('gender').eq('id', user.id).single();
            if (data) {
                await updateUserPreferences(user.id, data.gender, newTarget);
            }
        }
    };

    const toggleNotification = async (type: 'proximity' | 'likes' | 'rivals') => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (type === 'proximity') {
            const newVal = !notifyProximity;
            setNotifyProximity(newVal);
            await updateNotificationSettings(user.id, { notifyProximity: newVal });
        } else if (type === 'likes') {
            const newVal = !notifyLikes;
            setNotifyLikes(newVal);
            await updateNotificationSettings(user.id, { notifyLikes: newVal });
        } else if (type === 'rivals') {
            const newVal = !notifyRivals;
            setNotifyRivals(newVal);
            await updateNotificationSettings(user.id, { notifyRivals: newVal });
        }
    };

    const handleResetCookies = () => {
        localStorage.removeItem('notch_cookie_consent');
        // Místo tvrdého reloadu, který shazuje appku, pošleme event
        window.dispatchEvent(new Event('notch_reset_cookies'));
        alert('Nastavení cookies bylo resetováno.');
    };

    const handleDeleteAccount = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await scheduleAccountDeletion(user.id);
            await supabase.auth.signOut();
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('notch_verified');
        await supabase.auth.signOut();
    };

    return (
        <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0">
            {/* Page Header */}
            <PageHeader
                title="Můj"
                highlight="Profil"
                subtitle="Tvoje nastavení a statistiky"
                icon={<Users size={24} />}
            />

            {/* Profile Content */}
            <div className="flex flex-col items-center mb-6">
                {loading ? (
                    // Skeleton Loading State
                    <>
                        <div className="relative w-32 h-32 rounded-full p-1 bg-slate-800 mb-4 animate-pulse">
                            <div className="w-full h-full rounded-full bg-slate-700/50 backdrop-blur-sm"></div>
                        </div>
                        <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse mb-2"></div>
                        <div className="h-4 w-64 bg-slate-800/50 rounded-lg animate-pulse"></div>
                    </>
                ) : (
                    // Loaded Content
                    <>
                        <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-br from-red-500 to-orange-600 mb-4 group">
                            <img
                                src={avatarUrl || 'https://picsum.photos/200/200'}
                                alt="My Profile"
                                className="w-full h-full object-cover rounded-full border-4 border-slate-900"
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 bg-slate-800 p-2 rounded-full text-white border border-slate-600 shadow-lg hover:bg-slate-700 transition-colors"
                            >
                                {uploading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Camera size={16} />}
                            </button>
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2 h-8">
                            {userStats.username ? (
                                <>
                                    {userStats.username} <Shield size={24} className="text-blue-400" fill="currentColor" />
                                </>
                            ) : (
                                <div className="h-6 w-32 bg-slate-800 rounded animate-pulse"></div>
                            )}
                        </h1>

                        {/* Editable Bio */}
                        <div className="w-full mt-2 relative group">
                            {isEditing ? (
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-slate-800/50 rounded-xl p-2 text-center text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    onBlur={handleBioSave}
                                    autoFocus
                                />
                            ) : (
                                <p
                                    className="text-slate-400 text-center px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors italic"
                                    onClick={() => setIsEditing(true)}
                                >
                                    "{bio || 'Napiš něco o sobě...'}"
                                </p>
                            )}

                            {/* AI Magic Wand */}
                            <button
                                onClick={handleAiBio}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="AI Generate Bio (1 Credit)"
                            >
                                {generatingBio ? <div className="w-4 h-4 animate-spin border-2 border-white rounded-full border-t-transparent" /> : <Wand2 size={14} />}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Stats Summary Row */}
            <div className="flex justify-center gap-4 mb-8 relative">
                {/* Info Button Trigger */}
                <button
                    onClick={() => setShowStatsInfo(true)}
                    className="absolute -right-2 -top-2 p-2 text-slate-500 hover:text-white transition-colors"
                >
                    <Info size={18} />
                </button>

                <div className="text-center bg-slate-800 p-3 rounded-2xl w-1/3 border border-slate-700">
                    <div className="text-2xl font-black text-white">{userStats.bodyCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Zářezů</div>
                </div>
                <div className="text-center bg-slate-800 p-3 rounded-2xl w-1/3 border border-slate-700">
                    <div className="text-2xl font-black text-yellow-500">#{userStats.rank || '—'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rank</div>
                </div>
                <div className="text-center bg-slate-800 p-3 rounded-2xl w-1/3 border border-slate-700">
                    <div className="text-2xl font-black text-red-500">{userStats.heat || 0}%</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Heat</div>
                </div>
            </div>

            {/* STATS INFO MODAL */}
            {showStatsInfo && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button
                            onClick={() => setShowStatsInfo(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Info size={20} className="text-red-500" /> Vysvětlivky
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-800 p-3 rounded-xl">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Zářezů (Body Count)</div>
                                <p className="text-sm text-slate-200">Celkový počet úlovků, které jsi zapsal/a do své Černé Knihy.</p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl">
                                <div className="text-xs font-bold text-yellow-500 uppercase mb-1">Rank (Pořadí)</div>
                                <p className="text-sm text-slate-200">Tvoje aktuální umístění v regionálním žebříčku na základě aktivity a úspěšnosti.</p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl">
                                <div className="text-xs font-bold text-red-500 uppercase mb-1">Heat (Žhavost)</div>
                                <p className="text-sm text-slate-200">Index atraktivity profilu. Roste s počtem návštěv, lajků a interakcí od ostatních uživatelů.</p>
                            </div>
                        </div>
                        <Button fullWidth className="mt-6" onClick={() => setShowStatsInfo(false)}>Chápu to</Button>
                    </div>
                </div>
            )}

            {/* Invites Management */}
            <div className="mb-8 relative group">
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-900 rounded-full z-10"></div>
                <div className="absolute top-1/2 -right-2 w-4 h-4 bg-slate-900 rounded-full z-10"></div>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-0 border border-slate-700 overflow-hidden relative shadow-lg">
                    <div className="p-4 border-b border-slate-700 border-dashed relative">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-white flex items-center gap-2 uppercase tracking-wide">
                                <Ticket size={18} className="text-yellow-500" /> Golden Ticket
                            </h3>
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-bold border border-yellow-500/30">
                                {userStats.invitesAvailable} ks
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Rozdej přístup do Notch jen těm nejlepším.</p>
                    </div>

                    <div className="p-4 bg-slate-900/50">
                        <div className="bg-slate-950 rounded-lg p-3 flex items-center justify-between mb-4 border border-slate-800">
                            <code className="text-lg font-mono font-bold text-red-500 tracking-widest">{userStats.inviteCode}</code>
                            <button onClick={handleCopyInvite} className="text-slate-400 hover:text-white p-2 transition-colors">
                                <Copy size={18} />
                            </button>
                        </div>
                        <Button
                            fullWidth
                            disabled={userStats.invitesAvailable === 0}
                            onClick={handleShare}
                            size="md"
                            className="bg-white text-slate-900 hover:bg-slate-200 font-bold shadow-lg shadow-white/10"
                        >
                            <Share2 size={18} className="mr-2" /> Sdílet Pozvánku
                        </Button>
                    </div>
                </div>
            </div>

            {/* Trophies */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-200">Moje Trofeje</h3>
                    <span className="text-xs text-red-500 cursor-pointer">Všechny</span>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex flex-col items-center min-w-[70px]">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-slate-900 shadow-lg shadow-orange-500/20">
                            <Award size={24} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-2 text-center leading-tight">Víkendový<br />Král</span>
                    </div>
                    <div className="flex flex-col items-center min-w-[70px]">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-500">
                            <Award size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-2 text-center leading-tight">Hat-trick</span>
                    </div>
                    <div className="flex flex-col items-center min-w-[70px]">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-500">
                            <Award size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-2 text-center leading-tight">Maraton</span>
                    </div>
                </div>
            </div>

            {/* Settings Group */}
            <div className="space-y-3">
                <div
                    onClick={userStats.tier === 'PREMIUM' ? undefined : onOpenPremium}
                    className={`bg-slate-800 rounded-xl p-4 flex items-center gap-4 transition-colors ${userStats.tier === 'PREMIUM' ? 'opacity-100' : 'cursor-pointer hover:bg-slate-700'}`}
                >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${userStats.tier === 'PREMIUM' ? 'bg-yellow-500 text-slate-900' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        <Star size={20} fill={userStats.tier === 'PREMIUM' ? 'currentColor' : 'none'} />
                    </div>
                    <div className="flex-grow">
                        <div className="font-bold text-white flex items-center gap-2">
                            Notch Gold
                            {userStats.tier === 'PREMIUM' && <span className="text-[10px] bg-yellow-500 text-slate-900 px-2 py-0.5 rounded-full font-bold">AKTIVNÍ</span>}
                        </div>
                        <div className="text-xs text-slate-400">
                            {userStats.tier === 'PREMIUM' ? 'Máš aktivní Gold členství' : 'Získej neomezené swipy a přehledy'}
                        </div>
                    </div>
                </div>

                {/* Ghost List */}
                <button
                    onClick={() => setShowGhostList(true)}
                    className="bg-slate-800 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-700 transition-colors text-left w-full"
                >
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        <Ghost size={20} />
                    </div>
                    <div className="flex-grow">
                        <div className="font-bold text-white">Ghost List</div>
                        <div className="text-xs text-slate-400">Ghostnutí uživatelé</div>
                    </div>
                </button>

                {/* Preferences */}
                <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowPrefs(!showPrefs)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Nastavení Lovu</div>
                                <div className="text-xs text-slate-400">Koho chci potkávat</div>
                            </div>
                        </div>
                    </button>

                    {showPrefs && (
                        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex gap-2">
                            {(['women', 'both', 'men'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleSavePreferences(t)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${targetGender === t ? 'bg-red-600 text-white shadow' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                                >
                                    {t === 'women' ? 'Ženy' : t === 'men' ? 'Muže' : 'Vše'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications */}
                <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <Bell size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Notifikace</div>
                                <div className="text-xs text-slate-400">Srdíčka a Radar</div>
                            </div>
                        </div>
                    </button>

                    {showNotifs && (
                        <div className="p-4 bg-slate-900/50 border-t border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Upozornit na kořist (Radar)</span>
                                <div
                                    onClick={() => toggleNotification('proximity')}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifyProximity ? 'bg-red-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${notifyProximity ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Upozornit na srdíčka</span>
                                <div
                                    onClick={() => toggleNotification('likes')}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifyLikes ? 'bg-red-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${notifyLikes ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">Upozornit na výzvy rivalů</span>
                                <div
                                    onClick={() => toggleNotification('rivals')}
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${notifyRivals ? 'bg-red-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${notifyRivals ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Change */}
                <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Zabezpečení</div>
                                <div className="text-xs text-slate-400">Změnit heslo</div>
                            </div>
                        </div>
                    </button>

                    {showPasswordChange && (
                        <div className="p-4 bg-slate-900/50 border-t border-slate-700 space-y-3">
                            <input
                                type="password"
                                placeholder="Nové heslo (min. 6 znaků)"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-red-500 focus:outline-none"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <div className="flex items-center justify-between">
                                <span className={`text-xs ${passwordMessage.includes('úspěšně') ? 'text-green-500' : 'text-red-500'}`}>
                                    {passwordMessage}
                                </span>
                                <Button size="sm" onClick={handleChangePassword}>Uložit heslo</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cookie Reset */}
                <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <button
                        onClick={handleResetCookies}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                <Cookie size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-white">Nastavení Cookies</div>
                                <div className="text-xs text-slate-400">Resetovat souhlas</div>
                            </div>
                        </div>
                    </button>
                </div>

                <Button variant="ghost" onClick={handleLogout} className="w-full text-slate-500 hover:text-white gap-2 mt-4">
                    <LogOut size={16} /> Odhlásit se
                </Button>

                {/* Danger Zone */}
                <div className="pt-8 pb-4">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full text-xs text-red-900 hover:text-red-500 transition-colors flex items-center justify-center gap-1 font-bold"
                    >
                        <Trash2 size={12} /> Smazat účet
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal - Fixed Overlay */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-red-900/30 shadow-2xl animate-in zoom-in-95">
                        <div className="bg-red-900/10 p-6 text-center">
                            <div className="flex justify-center mb-3 text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                            <h4 className="text-red-500 font-bold text-lg mb-2">Opravdu odejít?</h4>
                            <p className="text-xs text-red-400/70 leading-relaxed">
                                Tvůj účet bude deaktivován a skryt. Definitivně se smaže po <strong>14 dnech</strong> neaktivity. Pokud se během té doby přihlásíš, smazání se zruší.
                            </p>
                        </div>
                        <div className="p-4 flex gap-2">
                            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                                Zrušit
                            </Button>
                            <Button
                                size="sm"
                                fullWidth
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteAccount}
                            >
                                Potvrdit smazání
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ghost List Modal */}
            {showGhostList && (
                <GhostListModal onClose={() => setShowGhostList(false)} />
            )}


        </div>
    );
};
