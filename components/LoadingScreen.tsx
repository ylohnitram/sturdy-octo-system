import React from 'react';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
            {/* Main content - centered red dot + Notch text */}
            <div className="relative flex items-center gap-4">
                {/* Animated red dot with pulse/blink effect */}
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-red-600 rounded-full blur-xl animate-pulse opacity-50"></div>

                    {/* Pulsing red dot */}
                    <div
                        className="relative w-8 h-8 bg-red-600 rounded-full"
                        style={{
                            animation: 'blink 1.5s ease-in-out infinite'
                        }}
                    ></div>
                </div>

                {/* "Notch" text */}
                <h1 className="text-5xl font-bold text-white tracking-tight">
                    Notch
                </h1>
            </div>

            {/* CSS animation for blinking */}
            <style>{`
                @keyframes blink {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.3;
                        transform: scale(0.9);
                    }
                }
            `}</style>

            {/* Version in corner */}
            <div className="absolute bottom-4 text-xs text-slate-700 font-mono">
                v{import.meta.env.PACKAGE_VERSION}
            </div>
        </div>
    );
};
