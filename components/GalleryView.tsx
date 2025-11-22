
import React, { useState, useRef, useEffect } from 'react';
import { Image, Lock, Trash2, Plus, X, EyeOff, Shield } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../services/supabaseClient';
import { fetchUserGallery, uploadGalleryImage, deleteGalleryImage, GalleryImage } from '../services/userService';

export const GalleryView: React.FC = () => {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isPrivateUpload, setIsPrivateUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Fetch gallery on mount
    useEffect(() => {
        const getGallery = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const images = await fetchUserGallery(user.id);
                setGalleryImages(images);
            }
        };
        getGallery();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowUploadModal(true);
        }
    };

    const handleGalleryUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const newImage = await uploadGalleryImage(user.id, selectedFile, isPrivateUpload);
            if (newImage) {
                setGalleryImages([newImage, ...galleryImages]);
                setShowUploadModal(false);
                setSelectedFile(null);
                setIsPrivateUpload(false);
            } else {
                alert('Chyba při nahrávání fotky.');
            }
        }
        setUploading(false);
    };

    const handleDeleteImage = async (imageId: string) => {
        if (!confirm('Opravdu chceš smazat tuto fotku?')) return;

        const success = await deleteGalleryImage(imageId);
        if (success) {
            setGalleryImages(galleryImages.filter(img => img.id !== imageId));
        } else {
            alert('Chyba při mazání fotky.');
        }
    };

    return (
        <div className="flex flex-col h-full pb-20 pt-4 px-4 max-w-md mx-auto overflow-y-auto no-scrollbar min-h-0">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase tracking-tighter">
                    Galerie
                </h1>
                <p className="text-slate-400 text-sm">Tvoje fotky a vzpomínky</p>
            </div>

            {/* Upload Button */}
            <div className="mb-4">
                <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus size={20} /> Přidat fotku
                </button>
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Gallery Grid */}
            {galleryImages.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                    <Image size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500 mb-2">Zatím žádné fotky.</p>
                    <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="text-xs text-red-500 font-bold"
                    >
                        Nahrát první
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {galleryImages.map(img => (
                        <div key={img.id} className="aspect-square rounded-xl bg-slate-800 overflow-hidden relative group">
                            <img src={img.imageUrl} className="w-full h-full object-cover" alt="Gallery" />
                            {img.isPrivate && (
                                <div className="absolute top-1 right-1 bg-black/60 p-1 rounded-full backdrop-blur-sm">
                                    <Lock size={12} className="text-red-500" />
                                </div>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                className="absolute bottom-1 right-1 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1 justify-center">
                <Shield size={10} /> Fotky jsou uloženy bezpečně na Supabase Storage.
            </p>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button
                            onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-white mb-4">Nahrát fotku</h3>

                        <div className="aspect-square w-full bg-slate-800 rounded-xl overflow-hidden mb-4 relative">
                            {selectedFile && (
                                <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" alt="Preview" />
                            )}
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setIsPrivateUpload(false)}
                                className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${!isPrivateUpload ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500'}`}
                            >
                                <EyeOff size={20} />
                                <span className="text-xs font-bold">Veřejná</span>
                            </button>
                            <button
                                onClick={() => setIsPrivateUpload(true)}
                                className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${isPrivateUpload ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-transparent border-slate-800 text-slate-500'}`}
                            >
                                <Lock size={20} />
                                <span className="text-xs font-bold">Soukromá</span>
                            </button>
                        </div>

                        <Button fullWidth onClick={handleGalleryUpload} disabled={uploading}>
                            {uploading ? 'Nahrávám...' : 'Uložit do galerie'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
