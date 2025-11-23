import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 1. Check if already dismissed
        const isDismissed = localStorage.getItem('notch_pwa_prompt_dismissed');
        if (isDismissed) return;

        // 2. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);

        // 3. Detect Standalone (Installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

        // 4. Show only on iOS and NOT standalone
        if (isIOS && !isStandalone) {
            // Small delay to not annoy immediately
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('notch_pwa_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[9999] pb-6 pt-4 px-4 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700 animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <div className="max-w-md mx-auto relative">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute -top-2 right-0 p-2 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-white mb-4 text-center">Nainstalovat aplikaci</h3>

                <div className="space-y-4 text-sm text-slate-300">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-600">
                            {/* iOS Share Icon */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p>
                            Klikni na tlačítko <span className="font-bold text-white">Sdílet</span>
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-600">
                            {/* iOS Add to Home Icon */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                        </div>
                        <p>
                            Sjeď dolů a vyber <span className="font-bold text-white">Přidat na plochu</span>
                        </p>
                    </div>
                </div>

                {/* Bouncing Arrow */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white border-r-[10px] border-r-transparent"></div>
                </div>
            </div>
        </div>
    );
};
