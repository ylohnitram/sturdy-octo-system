
import React, { useState } from 'react';
import { X, Crown, Eye, Globe, Zap, Check } from 'lucide-react';
import { Button } from './Button';
import { createCheckoutSession } from '../services/paymentService';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Stripe Price ID - This should be set in environment variables in production
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID || 'price_notch_gold_monthly';

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const features = [
        { icon: Globe, title: 'Globální Žebříčky', desc: 'Vidíš víc než jen top 10 ve svém městě.' },
        { icon: Eye, title: 'Ghost Mode', desc: 'Prohlížej profily, aniž by o tom věděli.' },
        { icon: Zap, title: 'Kdo tě viděl', desc: 'Seznam lidí, kteří si prohlíželi tvůj profil.' },
        { icon: Crown, title: 'Zlatý Odznak', desc: 'Exkluzivní ikona u jména a priorita v chatu.' },
    ];

    const handleActivateGold = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { url } = await createCheckoutSession(STRIPE_PRICE_ID);

            // Redirect to Stripe Checkout
            window.location.href = url;
        } catch (err) {
            console.error('Error creating checkout session:', err);
            setError(err instanceof Error ? err.message : 'Nepodařilo se vytvořit platební session. Zkus to prosím znovu.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden border-t border-slate-700 shadow-2xl transform transition-transform duration-300 animate-in slide-in-from-bottom">

                {/* Header Image/Gradient */}
                <div className="h-32 bg-gradient-to-br from-yellow-600 via-orange-500 to-red-600 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <Crown size={64} className="text-white drop-shadow-lg animate-pulse" fill="currentColor" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Notch <span className="text-yellow-400">GOLD</span></h2>
                        <p className="text-slate-400 text-sm">Staň se elitním lovcem s nespravedlivou výhodou.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 mt-1">
                                    <feat.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-200">{feat.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300 font-bold">Měsíční předplatné</span>
                            <div className="text-right">
                                <span className="block text-2xl font-black text-white">199 Kč</span>
                                <span className="text-[10px] text-slate-500 line-through">299 Kč</span>
                            </div>
                        </div>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <Check size={12} /> Prvních 7 dní zdarma
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <Button
                        fullWidth
                        size="lg"
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-slate-900 font-black shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleActivateGold}
                        disabled={isLoading}
                    >
                        {isLoading ? 'NAČÍTÁNÍ...' : 'AKTIVOVAT GOLD'}
                    </Button>
                    <div className="text-center mt-4">
                        <button
                            onClick={onClose}
                            className="text-xs text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            Možná později
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

