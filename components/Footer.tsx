import React from 'react';

export const Footer: React.FC = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center pb-2">
            <div className="bg-slate-950/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-bold text-slate-400">NOTCH</span>
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                <span>v{import.meta.env.PACKAGE_VERSION}</span>
            </div>
        </div>
    );
};
