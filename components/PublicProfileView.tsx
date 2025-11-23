import React, { useEffect, useState } from 'react';
import { X, Heart, MapPin, Zap, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { UserProfile, UserTier, UserStats } from '../types';
import { fetchUserData, sendLike } from '../services/userService';
import { supabase } from '../services/supabaseClient';
import { PublicGalleryModal } from './PublicGalleryModal';

interface PublicProfileViewProps {
    targetUserId: string;
    onBack: () => void;
    onConsumeCoins: (amount: number) => boolean;
    userStats: UserStats;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ targetUserId, onBack, onConsumeCoins, userStats }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingLike, setSendingLike] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setHasLiked(false); // Reset like state for new profile
            const { profile } = await fetchUserData(targetUserId);
            setProfile(profile);
            setLoading(false);
        };
        loadProfile();
    }, [targetUserId]);

    const handleLike = async () => {
        if (!profile || sendingLike || hasLiked) return;

        setSendingLike(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const result = await sendLike(user.id, profile.id);
            if (result.success) {
                setHasLiked(true);
                if (result.isMatch) {
                    // Dispatch match event for NotificationManager to show toast
                    window.dispatchEvent(new CustomEvent('notch_match_found', {
                        detail: { name: profile.name }
                    }));
                }
            }
        }
        setSendingLike(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-slate-400">Načítám profil...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <h2 className="text-xl font-bold text-white mb-2">Profil nenalezen</h2>
                <p className="text-slate-400 mb-6">Uživatel možná neexistuje nebo byl smazán.</p>
                <button onClick={onBack} className="px-6 py-2 bg-slate-800 rounded-lg text-white">Zpět</button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col max-w-md mx-auto pt-4 pb-20 px-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center mb-4">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <span className="ml-4 font-bold text-lg text-white">Profil uživatele</span>
            </div>

            <div className="relative flex-grow rounded-3xl overflow-hidden shadow-2xl bg-slate-800 border border-slate-700 animate-in zoom-in duration-300">
                {/* Image */}
                <div className="absolute inset-0">
                    <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                </div>

                {/* Tier Badge */}
                {profile.tier !== UserTier.FREE && (
                    <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Zap size={12} fill="currentColor" /> {profile.tier}
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                {profile.name}, {profile.age}
                                {profile.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>}
                            </h1>
                            <div className="flex items-center gap-1 text-slate-300 text-sm mt-1">
                                <MapPin size={14} />
                                <span>{profile.distanceKm || '?'} km daleko</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Notch Skóre</div>
                            <div className="text-3xl font-black text-red-500">{profile.stats.bodyCount}</div>
                        </div>
                    </div>

                    <p className="text-slate-200 text-sm line-clamp-3 mb-6 font-light leading-relaxed">
                        "{profile.bio}"
                    </p>

                    {/* Actions */}
                    <div className="space-y-3 mt-2">
                        {/* Gallery Button */}
                        <button
                            onClick={() => setShowGallery(true)}
                            className="w-full h-12 rounded-2xl bg-slate-800/80 backdrop-blur border border-slate-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
                        >
                            <ImageIcon size={20} />
                            <span>Galerie</span>
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onBack}
                                className="col-span-1 h-14 rounded-2xl border-2 border-slate-600 text-slate-300 font-bold flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all"
                            >
                                <X size={24} className="mr-2" /> Ignorovat
                            </button>

                            <button
                                onClick={handleLike}
                                disabled={sendingLike || hasLiked}
                                className={`col-span-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${hasLiked
                                    ? 'bg-green-600 text-white cursor-default'
                                    : 'bg-gradient-to-br from-red-600 to-orange-600 text-white hover:scale-105 shadow-red-900/50'
                                    }`}
                            >
                                {sendingLike ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : hasLiked ? (
                                    <>Odesláno</>
                                ) : (
                                    <>
                                        <Heart size={24} fill="currentColor" /> Like
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showGallery && profile && (
                <PublicGalleryModal
                    targetUserId={profile.id}
                    targetUserName={profile.name}
                    onClose={() => setShowGallery(false)}
                    onConsumeCoins={onConsumeCoins}
                    userIsPremium={userStats.tier === UserTier.PREMIUM}
                />
            )}
        </div>
    );
};
