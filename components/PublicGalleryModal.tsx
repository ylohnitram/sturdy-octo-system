import React, { useState, useEffect } from 'react';
import { X, Lock, Image as ImageIcon, Loader2, Unlock, Zap } from 'lucide-react';
import { fetchPublicGallery, GalleryImage } from '../services/userService';
import { supabase } from '../services/supabaseClient';

interface PublicGalleryModalProps {
    targetUserId: string;
    targetUserName: string;
    onClose: () => void;
    onConsumeCoins: (amount: number) => boolean;
    userIsPremium: boolean;
}

export const PublicGalleryModal: React.FC<PublicGalleryModalProps> = ({
    targetUserId,
    targetUserName,
    onClose,
    onConsumeCoins,
    userIsPremium
}) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [galleryUnlocked, setGalleryUnlocked] = useState(userIsPremium);
    const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
    const [isSubscription, setIsSubscription] = useState(false);

    useEffect(() => {
        loadGallery();
    }, [targetUserId]);

    const loadGallery = async () => {
        setLoading(true);
        const data = await fetchPublicGallery(targetUserId);
        setImages(data);

        const privateCount = data.filter(img => img.isPrivate).length;
        setIsSubscription(privateCount > 5);

        setLoading(false);
    };

    const privateImageCount = images.filter(img => img.isPrivate).length;
    const hasPrivateImages = privateImageCount > 0;

    const handleImageClick = (image: GalleryImage) => {
        if (!image.isPrivate || galleryUnlocked) {
            setSelectedImage(image);
        } else {
            setShowUnlockPrompt(true);
        }
    };

    const unlockGallery = async () => {
        if (unlocking) return;

        const GALLERY_UNLOCK_COST = 10;

        if (userIsPremium) {
            setGalleryUnlocked(true);
            setShowUnlockPrompt(false);
            return;
        }

        if (onConsumeCoins(GALLERY_UNLOCK_COST)) {
            setUnlocking(true);
            setShowUnlockPrompt(false);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase.rpc('unlock_user_gallery_v2', {
                    p_viewer_id: user.id,
                    p_owner_id: targetUserId,
                    p_cost: GALLERY_UNLOCK_COST
                });

                if (!error && data) {
                    setGalleryUnlocked(true);
                    await loadGallery();
                }
            }

            setUnlocking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md animate-in fade-in flex flex-col">
            <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-slate-900/50 border-b border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-white">Galerie</h2>
                    <p className="text-xs text-slate-400">
                        {targetUserName}
                        {hasPrivateImages && !galleryUnlocked && (
                            <span className="ml-2 text-yellow-500">• {privateImageCount} privátní</span>
                        )}
                    </p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
                        <p className="text-slate-500">Načítám fotky...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <ImageIcon size={48} className="mb-4 opacity-50" />
                        <p>Uživatel nemá žádné fotky.</p>
                    </div>
                ) : (
                    <>
                        {hasPrivateImages && !galleryUnlocked && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-white mb-1">
                                            🔒 {privateImageCount} privátní {privateImageCount === 1 ? 'fotka' : privateImageCount < 5 ? 'fotky' : 'fotek'}
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            {userIsPremium ? 'Klikni na fotku pro zobrazení' : 'Odemkni celou galerii za 10 kreditů'}
                                        </p>
                                    </div>
                                    {!userIsPremium && (
                                        <button
                                            onClick={() => setShowUnlockPrompt(true)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Unlock size={14} /> Odemknout
                                        </button>
                                    )}
                                    {userIsPremium && (
                                        <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full flex items-center gap-1">
                                            <Zap size={12} className="text-yellow-400" fill="currentColor" />
                                            <span className="text-xs font-bold text-yellow-300">Premium</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map(img => {
                                const isLocked = img.isPrivate && !galleryUnlocked;

                                return (
                                    <div
                                        key={img.id}
                                        className="aspect-square rounded-xl overflow-hidden relative group bg-slate-800 border border-slate-700 cursor-pointer"
                                        onClick={() => handleImageClick(img)}
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt="Gallery"
                                            className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'blur-xl scale-110 opacity-50' : 'group-hover:scale-105'
                                                }`}
                                        />

                                        {isLocked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-2 text-center pointer-events-none">
                                                <div className="w-10 h-10 bg-slate-900/80 rounded-full flex items-center justify-center mb-2 border border-red-500/50 shadow-lg shadow-red-900/20">
                                                    <Lock size={20} className="text-red-500" />
                                                </div>
                                                <span className="text-xs font-bold text-white drop-shadow-md">Soukromá</span>
                                            </div>
                                        )}

                                        {img.isPrivate && galleryUnlocked && (
                                            <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur border border-green-500/50 p-1 rounded-full">
                                                <Unlock size={12} className="text-green-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {showUnlockPrompt && (
                <div className="fixed inset-0 z-[1200] bg-black/80 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowUnlockPrompt(false)}>
                    <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700 animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {isSubscription ? 'Předplatné galerie' : 'Odemknout galerii'}
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                            {isSubscription ? (
                                <>
                                    Odemkne se <span className="font-bold text-white">všech {privateImageCount} privátních {privateImageCount === 1 ? 'fotka' : privateImageCount < 5 ? 'fotky' : 'fotek'}</span> na <span className="font-bold text-white">30 dní</span>.
                                    <br /><br />
                                    Po expiraci zůstanou <span className="font-bold text-green-400">prvních 5 fotek navždy</span>, zbytek se zamkne.
                                </>
                            ) : (
                                <>
                                    Odemkne se <span className="font-bold text-white">{privateImageCount === 1 ? '1 privátní fotka' : `všechny ${privateImageCount} privátní fotky`}</span> <span className="font-bold text-green-400">navždy</span> za jednorázovou platbu.
                                </>
                            )}
                        </p>

                        {isSubscription && (
                            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold">Subscription</span>
                                </div>
                                <p className="text-xs text-slate-300">
                                    • Platnost 30 dní<br />
                                    • Obnovení: 5 kreditů<br />
                                    • Prvních 5 zůstane navždy
                                </p>
                            </div>
                        )}

                        <div className="bg-slate-800 rounded-lg p-3 mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Cena:</span>
                                <span className="font-bold text-white">10 kreditů</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Vlastník dostane:</span>
                                <span className="text-green-400">5 kreditů (50%)</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnlockPrompt(false)}
                                className="flex-1 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors font-semibold"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={unlockGallery}
                                disabled={unlocking}
                                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors font-bold flex items-center justify-center gap-2"
                            >
                                {unlocking ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <Unlock size={16} /> {isSubscription ? 'Předplatit' : 'Odemknout'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-[1100] bg-black flex items-center justify-center p-4 animate-in zoom-in duration-200" onClick={() => setSelectedImage(null)}>
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white z-50 hover:bg-black/70 transition-colors"
                        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage.imageUrl}
                        alt="Full view"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
