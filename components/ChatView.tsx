import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Ghost, MoreVertical, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchMatches, fetchMessages, sendMessage, ghostUser, MatchPreview, ChatMessage } from '../services/userService';
import DOMPurify from 'dompurify';

interface ChatViewProps {
    onBack?: () => void; // If used in a modal or navigation stack
}

export const ChatView: React.FC<ChatViewProps> = ({ onBack }) => {
    const [matches, setMatches] = useState<MatchPreview[]>([]);
    const [activeMatch, setActiveMatch] = useState<MatchPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
            await loadMatches();
        };
        init();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (activeMatch) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeMatch]);

    // Realtime subscription for messages
    useEffect(() => {
        if (!activeMatch) return;

        const channel = supabase
            .channel(`chat:${activeMatch.matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${activeMatch.matchId}`
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    setMessages(prev => [...prev, {
                        id: newMsg.id,
                        matchId: newMsg.match_id,
                        senderId: newMsg.sender_id,
                        content: newMsg.content,
                        createdAt: newMsg.created_at,
                        readAt: newMsg.read_at
                    }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeMatch]);

    const loadMatches = async () => {
        setLoadingMatches(true);
        const data = await fetchMatches();
        setMatches(data);
        setLoadingMatches(false);
    };

    const openChat = async (match: MatchPreview) => {
        setActiveMatch(match);
        setLoadingMessages(true);
        const msgs = await fetchMessages(match.matchId);
        setMessages(msgs);
        setLoadingMessages(false);
        setShowMenu(false);
    };

    const handleSend = async () => {
        if (!activeMatch || !inputText.trim() || sending) return;

        setSending(true);
        // Sanitize input
        const cleanText = DOMPurify.sanitize(inputText, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

        if (!cleanText) {
            setSending(false);
            return;
        }

        const newMsg = await sendMessage(activeMatch.matchId, cleanText);
        if (newMsg) {
            setMessages(prev => [...prev, newMsg]);
            setInputText('');
        }
        setSending(false);
    };

    const handleGhost = async () => {
        if (!activeMatch || !confirm('Opravdu chceš tohoto uživatele ignorovat? (Ghost Mode)\n\nUž nikdy neuvidíš jeho zprávy ani profil. Tato akce je nevratná.')) return;

        const success = await ghostUser(activeMatch.partnerId);
        if (success) {
            setActiveMatch(null);
            await loadMatches(); // Reload to remove ghosted user
        } else {
            alert('Chyba při aktivaci Ghost Mode.');
        }
    };

    // --- RENDER LIST ---
    if (!activeMatch) {
        return (
            <div className="flex flex-col h-full bg-slate-900">
                <div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10">
                    <h1 className="text-2xl font-black text-white">Zprávy</h1>
                </div>

                <div className="flex-grow overflow-y-auto p-4">
                    {loadingMatches ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-red-500" />
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <MessageCircle size={48} className="mb-4 opacity-50" />
                            <p>Zatím žádné zprávy.</p>
                            <p className="text-xs mt-2">Najdi si Match a začni chatovat!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {matches.map(match => (
                                <div
                                    key={match.matchId}
                                    onClick={() => openChat(match)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <img
                                        src={match.partnerAvatar}
                                        alt={match.partnerUsername}
                                        className="w-12 h-12 rounded-full object-cover border border-slate-600"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-white truncate">{match.partnerUsername}</h3>
                                            {match.lastMessageTime && (
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(match.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${match.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                                            {match.lastMessage || 'Začni konverzaci...'}
                                        </p>
                                    </div>
                                    {match.unreadCount > 0 && (
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold text-white">{match.unreadCount}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER DETAIL ---
    return (
        <div className="flex flex-col h-full bg-slate-950 fixed inset-0 z-[200]">
            {/* Header */}
            <div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-800 bg-slate-900 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveMatch(null)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img
                            src={activeMatch.partnerAvatar}
                            alt={activeMatch.partnerUsername}
                            className="w-8 h-8 rounded-full object-cover border border-slate-600"
                        />
                        <span className="font-bold text-white">{activeMatch.partnerUsername}</span>
                    </div>
                </div>
                <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-400 hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={handleGhost}
                                className="w-full px-4 py-3 text-left text-red-400 hover:bg-slate-700/50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Ghost size={16} /> Ghost Mode (Ignorovat)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-950">
                {loadingMessages ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-slate-600" />
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe
                                            ? 'bg-red-600 text-white rounded-tr-none'
                                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-slate-900 border-t border-slate-800">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Napiš zprávu..."
                        className="flex-grow bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || sending}
                        className="p-2 bg-red-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
                    >
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
