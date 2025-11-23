import React, { useState, useEffect } from 'react';
import { X, Lock, Image as ImageIcon, Loader2, Unlock } from 'lucide-react';
import { fetchPublicGallery, GalleryImage, unlockGalleryImage } from '../services/userService';

interface PublicGalleryModalProps {
    targetUserId: string;
    targetUserName: string;
    onClose: () => void;
    onConsumeCoins: (amount: number) => boolean;
}

export const PublicGalleryModal: React.FC<PublicGalleryModalProps> = ({ targetUserId, targetUserName, onClose, onConsumeCoins }) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlockingId, setUnlockingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [confirmingUnlockId, setConfirmingUnlockId] = useState<string | null>(null);

    useEffect(() => {
        loadGallery();
    }, [targetUserId]);

    const loadGallery = async () => {
        setLoading(true);
        const data = await fetchPublicGallery(targetUserId);
        setImages(data);
        setLoading(false);
    };

    const handleUnlockClick = (image: GalleryImage) => {
        if (image.isUnlocked) {
            setSelectedImage(image);
        } else {
            setConfirmingUnlockId(image.id);
        }
    };

    const confirmUnlock = async (image: GalleryImage) => {
        if (unlockingId) return;

        if (onConsumeCoins(10)) {
            setUnlockingId(image.id);
            setConfirmingUnlockId(null);
            const success = await unlockGalleryImage(image.id);
            if (success) {
                setImages(prev => prev.map(img => img.id === image.id ? { ...img, isUnlocked: true } : img));
            }
            setUnlockingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md animate-in fade-in flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-slate-900/50 border-b border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-white">Galerie</h2>
                    <p className="text-xs text-slate-400">Uživatel {targetUserName}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-2" />
                        <p className="text-slate-500">Načítám fotky...</p>
                    </div>
                ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <ImageIcon size={48} className="mb-4 opacity-50" />
                        <p>Uživatel nemá žádné veřejné fotky.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map(img => (
                            <div
                                key={img.id}
                                className="aspect-square rounded-xl overflow-hidden relative group bg-slate-800 border border-slate-700 cursor-pointer"
                                onClick={() => handleUnlockClick(img)}
                            >
                                <img
                                    src={img.imageUrl}
                                    alt="Gallery"
                                    className={`w-full h-full object-cover transition-all duration-500 ${!img.isUnlocked ? 'blur-xl scale-110 opacity-50' : 'group-hover:scale-105'}`}
                                />

                                {!img.isUnlocked && confirmingUnlockId !== img.id && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-2 text-center pointer-events-none">
                                        <div className="w-10 h-10 bg-slate-900/80 rounded-full flex items-center justify-center mb-2 border border-red-500/50 shadow-lg shadow-red-900/20">
                                            {unlockingId === img.id ? (
                                                <Loader2 size={20} className="text-red-500 animate-spin" />
                                            ) : (
                                                <Lock size={20} className="text-red-500" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-white drop-shadow-md">Soukromá</span>
                                        <span className="text-[10px] text-yellow-500 font-bold mt-1">10 Kreditů</span>
                                    </div>
                                )}

                                {/* Confirmation Overlay */}
                                {confirmingUnlockId === img.id && (
                                    <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                        <p className="text-xs text-white font-bold mb-2 text-center">Odemknout za 10 kreditů?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setConfirmingUnlockId(null)}
                                                className="p-2 rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                            <button
                                                onClick={() => confirmUnlock(img)}
                                                className="px-4 py-2 rounded-full bg-red-600 text-white font-bold text-xs hover:bg-red-500 flex items-center gap-1 transition-colors"
                                            >
                                                <Unlock size={12} /> Odemknout
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {img.isUnlocked && img.isPrivate && (
                                    <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur border border-green-500/50 p-1 rounded-full">
                                        <Unlock size={12} className="text-green-400" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox for Selected Image */}
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
