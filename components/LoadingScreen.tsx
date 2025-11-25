import React from 'react';
import { Heart, Target, Zap } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center z-50">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-ping"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-6">
                {/* Logo with pulse */}
                <div className="relative">
                    <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full animate-pulse"></div>
                    <h1 className="relative text-6xl font-black tracking-tighter text-white">
                        NOTCH
                    </h1>
                </div>

                {/* Loading animation - 3 rotating icons */}
                <div className="relative w-32 h-32">
                    {/* Center glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full blur-2xl animate-pulse"></div>

                    {/* Rotating icons */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
                            <Heart size={20} fill="white" className="text-white" />
                        </div>
                    </div>

                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                            <Target size={20} className="text-white" />
                        </div>
                    </div>

                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-600 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                            <Zap size={20} fill="white" className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Witty loading messages */}
                <div className="text-center space-y-2">
                    <p className="text-white font-bold text-lg animate-pulse">
                        Načítám tvůj profil...
                    </p>
                    <p className="text-slate-400 text-sm max-w-xs">
                        {[
                            'Brousím lovecké schopnosti 🎯',
                            'Kalkuluji notch score 📊',
                            'Hledám kořist v okolí 🔍',
                            'Mixuji perfect rizz ✨',
                        ][Math.floor(Date.now() / 2000) % 4]}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600 animate-pulse"
                        style={{ width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                </div>
            </div>

            {/* Version in corner */}
            <div className="absolute bottom-4 text-xs text-slate-600 font-mono">
                v{import.meta.env.PACKAGE_VERSION}
            </div>
        </div>
    );
};
