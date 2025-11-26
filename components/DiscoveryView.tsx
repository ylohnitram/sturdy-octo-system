import React, { useState, useEffect } from 'react';
import { Heart, X, MapPin, Zap, Target, Map, Users, Rocket, RefreshCw, Radar, Image as ImageIcon } from 'lucide-react';
import { UserProfile, UserTier, UserStats, Hotspot } from '../types';
import { Button } from './Button';
import { generateIcebreaker } from '../services/geminiService';
import { fetchDiscoveryCandidates, updateRadarRadius, fetchUserData, sendLike, recordDismiss, updateUserLocation, fetchActiveHotspots, getDailyLikeCount } from '../services/userService';
import { supabase } from '../services/supabaseClient';
import { PublicGalleryModal } from './PublicGalleryModal';
import { MatchOverlay } from './MatchOverlay';
import { PageHeader } from './PageHeader';

interface DiscoveryViewProps {
    userStats: UserStats;
    userAvatarUrl: string; // Added prop
    onConsumeAi: () => boolean;
    onConsumeCoins: (amount: number) => boolean;
    onOpenPremium: () => void;
    onOpenChat: (partnerId: string) => void; // Added prop
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ userStats, userAvatarUrl, onConsumeAi, onConsumeCoins, onOpenPremium, onOpenChat }) => {
    const [viewMode, setViewMode] = useState<'swipe' | 'radar'>('swipe');
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [aiIcebreaker, setAiIcebreaker] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [isBoostActive, setIsBoostActive] = useState(false);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number, long: number } | null>(null);
    const [dailyLikes, setDailyLikes] = useState(0);
    const [showGallery, setShowGallery] = useState(false);

    // Match Overlay State
    const [matchData, setMatchData] = useState<{ partnerId: string; partnerName: string; partnerAvatar: string } | null>(null);

    // Radius State
    const [radius, setRadius] = useState(10);

    const loadCandidates = async () => {
        setLoadingProfiles(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const candidates = await fetchDiscoveryCandidates(user.id);
            setProfiles(candidates);

            // Update radius from profile
            const { profile } = await fetchUserData(user.id);
            if (profile && profile.radarRadius) setRadius(profile.radarRadius);

            // Load daily likes count
            const likesCount = await getDailyLikeCount(user.id);
            setDailyLikes(likesCount);

            // Trigger Proximity Check Simulation (Simulates finding users near you)
            if (candidates.length > 0) {
                window.dispatchEvent(new CustomEvent('notch_proximity_check'));
            }
        }
        setLoadingProfiles(false);
    };

    const updateLocation = async () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, long: longitude });

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await updateUserLocation(user.id, latitude, longitude);
                    const activeHotspots = await fetchActiveHotspots(radius, latitude, longitude);
                    setHotspots(activeHotspots);
                }
            }, (error) => {
                console.error("Error getting location:", error);
            });
        }
    };

    useEffect(() => {
        loadCandidates();
        updateLocation();

        // Update location every 5 minutes
        const interval = setInterval(updateLocation, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [radius]); // Reload hotspots when radius changes

    const handleRadiusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setRadius(val);
    };

    const saveRadius = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await updateRadarRadius(user.id, radius);
            loadCandidates(); // Refresh list with new radius
            updateLocation(); // Refresh hotspots
        }
    };

    const currentProfile = profiles[currentIndex];

    const handleRefresh = () => {
        setCurrentIndex(0);
        loadCandidates();
    };

    const handleAiAssist = async () => {
        if (!currentProfile) return;

        if (onConsumeAi()) {
            setLoadingAi(true);
            const line = await generateIcebreaker(currentProfile.name, currentProfile.bio);
            setAiIcebreaker(line);
            setLoadingAi(false);
        }
    };

    const handleBoost = () => {
        if (isBoostActive) return;
        if (onConsumeCoins(50)) {
            setIsBoostActive(true);
            setTimeout(() => setIsBoostActive(false), 5000);
        }
    };

    const handleSwipe = async (direction: 'left' | 'right') => {
        const { data: { user } } = await supabase.auth.getUser();

        if (direction === 'right' && currentProfile && user) {
            // Send Like DB Logic
            const result = await sendLike(user.id, currentProfile.id);
            if (result.isMatch) {
                // SHOW MATCH OVERLAY
                setMatchData({
                    partnerId: currentProfile.id,
                    partnerName: currentProfile.name,
                    partnerAvatar: currentProfile.avatarUrl
                });
                // Also dispatch event for global listeners if needed
                window.dispatchEvent(new CustomEvent('notch_match_found', { detail: { name: currentProfile.name } }));
            }
        } else if (direction === 'left' && currentProfile && user) {
            // Record Dismiss (X button)
            await recordDismiss(user.id, currentProfile.id);
        }

        setAiIcebreaker(null);
        setCurrentIndex((prev) => prev + 1);
    };

    // ... (rest of the code)

    return (
        <div className="h-full flex flex-col max-w-md mx-auto pt-4 pb-20 px-4 overflow-hidden">
            {/* Match Overlay */}
            {matchData && (
                <MatchOverlay
                    myAvatarUrl={userAvatarUrl}
                    partnerAvatarUrl={matchData.partnerAvatar}
                    partnerName={matchData.partnerName}
                    onChat={() => {
                        setMatchData(null);
                        onOpenChat(matchData.partnerId);
                    }}
                    onClose={() => setMatchData(null)}
                />
            )}

            {/* Page Header - for Swipe Mode */}
            {viewMode === 'swipe' && (
                <PageHeader
                    title="Lov"
                    subtitle="Najdi svůj další úlovek"
                    icon={<Target size={24} />}
                />
            )}

            {/* Page Header - for Radar Mode */}
            {viewMode === 'radar' && (
                <PageHeader
                    title="Aktivní"
                    highlight="Místa"
                    subtitle="Uživatelé v okolí"
                    icon={<Radar size={24} />}
                />
            )}

            {/* Top Toggle */}
            <div className="flex justify-between items-center mb-4">
                <div className="bg-slate-800 p-1 rounded-xl flex">
                    <button
                        onClick={() => setViewMode('swipe')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'swipe' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        <Target size={16} /> Lov
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('radar');
                            updateLocation();
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'radar' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        <Map size={16} /> Radar
                    </button>
                </div>

                {/* Boost Button */}
                <button
                    onClick={handleBoost}
                    className={`p-2 rounded-full transition-all ${isBoostActive ? 'bg-green-500 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-800 text-red-500 hover:bg-slate-700'}`}
                    title="Boost Profile (50 Coins)"
                >
                    <Rocket size={20} />
                </button>
            </div>

            {viewMode === 'radar' ? (
                <div className="flex-grow bg-slate-800 rounded-3xl border border-slate-700 p-4 relative overflow-hidden flex flex-col">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* Animated Radar Effect */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <div className="w-[150%] aspect-square rounded-full border border-red-500/10 absolute"></div>
                        <div className="w-64 h-64 rounded-full border-2 border-red-500/30 animate-[ping_3s_linear_infinite] absolute"></div>
                        <div className="w-48 h-48 rounded-full border border-red-500/50 absolute"></div>
                        {/* Dynamic Circle based on Radius */}
                        <div style={{ width: `${Math.min(radius * 5, 280)}px`, height: `${Math.min(radius * 5, 280)}px` }} className="rounded-full bg-red-500/5 border border-red-500/20 absolute transition-all duration-500"></div>
                    </div>

                    <div className="relative z-10 flex-grow">
                        {!userLocation ? (
                            <div className="text-center text-slate-400 mt-10">
                                <p>Povolte prosím přístup k poloze pro zobrazení radaru.</p>
                            </div>
                        ) : hotspots.length === 0 ? (
                            <div className="text-center text-slate-400 mt-10">
                                <p>V okolí {radius}km zatím nikdo není.</p>
                                <p className="text-xs mt-2">Zkuste zvětšit rádius.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-4 overflow-y-auto max-h-[400px]">
                                {hotspots.map(spot => (
                                    <div key={spot.id} className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-white">{spot.name}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1">
                                                <MapPin size={12} /> {spot.distance.toFixed(1)}km
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-red-500 font-black text-lg flex items-center justify-end gap-1">
                                                <Users size={16} /> {spot.count}
                                            </div>
                                            <div className="text-[10px] text-green-400 font-bold uppercase">{spot.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Radius Slider */}
                    <div className="relative z-10 mt-4 bg-slate-900/90 p-4 rounded-xl border border-slate-600">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-300 uppercase">Radius Skenování</span>
                            <span className="text-lg font-black text-red-500">{radius} km</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={radius}
                            onChange={handleRadiusChange}
                            onMouseUp={saveRadius}
                            onTouchEnd={saveRadius}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>1km</span>
                            <span>50km</span>
                        </div>
                    </div>
                </div>
            ) : (
                loadingProfiles ? (
                    <div className="flex flex-col items-center justify-center h-[70vh]">
                        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Hledám cíle v okolí...</p>
                    </div>
                ) :
                    !currentProfile ? (
                        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Target className="text-slate-600" size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Žádné další cíle</h2>
                            <p className="text-slate-400 mb-6">V tomto rádiusu už nikdo není. Zkus ho rozšířit v Radaru.</p>
                            <Button onClick={handleRefresh} variant="secondary"><RefreshCw size={16} className="mr-2" /> Obnovit</Button>
                        </div>
                    ) : (
                        <div className="relative flex-grow rounded-3xl overflow-hidden shadow-2xl bg-slate-800 border border-slate-700 animate-in zoom-in duration-300">
                            {/* Image */}
                            <div className="absolute inset-0">
                                <img
                                    src={currentProfile.avatarUrl}
                                    alt={currentProfile.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                            </div>

                            {/* Tier Badge */}
                            {currentProfile.tier !== UserTier.FREE && (
                                <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Zap size={12} fill="currentColor" /> {currentProfile.tier}
                                </div>
                            )}

                            {/* Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                            {currentProfile.name}, {currentProfile.age}
                                            {currentProfile.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>}
                                        </h1>
                                        <div className="flex items-center gap-1 text-slate-300 text-sm mt-1">
                                            <MapPin size={14} />
                                            <span>{currentProfile.distanceKm} km daleko</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Notch Skóre</div>
                                        <div className="text-3xl font-black text-red-500">{currentProfile.stats.bodyCount}</div>
                                    </div>
                                </div>

                                <p className="text-slate-200 text-sm line-clamp-2 mb-4 font-light leading-relaxed">
                                    "{currentProfile.bio}"
                                </p>

                                {/* AI Assist Area */}
                                {aiIcebreaker && (
                                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm animate-in fade-in slide-in-from-bottom-2">
                                        <span className="font-bold text-red-400 text-xs uppercase block mb-1">AI Rada:</span>
                                        "{aiIcebreaker}"
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="grid grid-cols-4 gap-4 items-center mt-2">
                                    <button
                                        onClick={() => handleSwipe('left')}
                                        className="col-span-1 aspect-square rounded-full border-2 border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:border-slate-500 hover:text-white transition-all"
                                    >
                                        <X size={28} />
                                    </button>

                                    <button
                                        onClick={() => setShowGallery(true)}
                                        className="col-span-2 h-14 rounded-2xl bg-slate-800/80 backdrop-blur border border-slate-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all relative overflow-hidden"
                                    >
                                        <ImageIcon size={20} />
                                        <span>Galerie</span>
                                    </button>

                                    <button
                                        onClick={() => handleSwipe('right')}
                                        className="col-span-1 aspect-square rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg shadow-red-900/50 flex items-center justify-center hover:scale-105 transition-all"
                                    >
                                        <Heart size={28} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
            )}

            {showGallery && currentProfile && (
                <PublicGalleryModal
                    targetUserId={currentProfile.id}
                    targetUserName={currentProfile.name}
                    onClose={() => setShowGallery(false)}
                    onConsumeCoins={onConsumeCoins}
                    userIsPremium={userStats.tier === UserTier.PREMIUM}
                />
            )}
        </div>
    );
};
