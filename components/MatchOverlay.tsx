import React, { useEffect, useState } from 'react';
import { MessageCircle, X, Heart } from 'lucide-react';
import { Button } from './Button';

interface MatchOverlayProps {
    myAvatarUrl: string;
    partnerAvatarUrl: string;
    partnerName: string;
    onChat: () => void;
    onClose: () => void;
}

export const MatchOverlay: React.FC<MatchOverlayProps> = ({
    myAvatarUrl,
    partnerAvatarUrl,
    partnerName,
    onChat,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entry animation
        setIsVisible(true);
    }, []);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className={`relative w-full max-w-md p-8 flex flex-col items-center text-center transition-all duration-700 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>

                {/* Title */}
                <div className="mb-12 relative">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 italic transform -rotate-6 animate-[bounce_1s_infinite]">
                        IT'S A MATCH!
                    </h1>
                    <div className="absolute -top-6 -right-6 text-4xl animate-bounce delay-100">🔥</div>
                    <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce delay-300">💘</div>
                </div>

                {/* Avatars */}
                <div className="relative flex items-center justify-center w-full h-40 mb-12">
                    {/* My Avatar */}
                    <div className="absolute left-4 w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden transform -translate-x-4 animate-[slideInLeft_0.8s_ease-out_forwards]">
                        <img src={myAvatarUrl} alt="Me" className="w-full h-full object-cover" />
                    </div>

                    {/* Heart Icon in middle */}
                    <div className="absolute z-10 bg-white rounded-full p-2 shadow-xl animate-[zoomIn_0.5s_ease-out_delay-500_forwards] opacity-0 scale-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                        <Heart className="text-red-600 fill-red-600" size={32} />
                    </div>

                    {/* Partner Avatar */}
                    <div className="absolute right-4 w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden transform translate-x-4 animate-[slideInRight_0.8s_ease-out_forwards]">
                        <img src={partnerAvatarUrl} alt={partnerName} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Message */}
                <p className="text-white text-lg font-medium mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500">
                    Ty a <span className="font-bold text-red-400">{partnerName}</span> se sobě líbíte!
                </p>

                {/* Buttons */}
                <div className="w-full space-y-3 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-700">
                    <Button
                        fullWidth
                        onClick={onChat}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 text-lg shadow-lg shadow-red-900/30"
                    >
                        <MessageCircle className="mr-2" /> Napsat zprávu
                    </Button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-slate-400 font-semibold hover:text-white transition-colors"
                    >
                        Hledat dál
                    </button>
                </div>

            </div>
        </div>
    );
};
