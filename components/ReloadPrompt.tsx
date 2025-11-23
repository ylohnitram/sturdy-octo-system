import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-center gap-4 max-w-md ml-auto">
                <div className="bg-red-600/10 p-2 rounded-lg text-red-500">
                    <RefreshCw size={20} className={needRefresh ? "animate-spin" : ""} />
                </div>

                <div className="flex-grow">
                    <h3 className="font-bold text-white text-sm">
                        {offlineReady ? 'Aplikace je připravena offline' : 'Nová verze k dispozici'}
                    </h3>
                    <p className="text-xs text-slate-400">
                        {offlineReady
                            ? 'Nyní můžeš aplikaci používat i bez internetu.'
                            : 'Klikni pro aktualizaci na nejnovější verzi.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                        >
                            Aktualizovat
                        </button>
                    )}
                    <button
                        onClick={close}
                        className="text-slate-500 hover:text-white p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
