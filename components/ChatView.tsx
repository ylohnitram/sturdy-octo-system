import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Send, Ghost, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { fetchMatches, fetchConversation, sendMessage, ghostUser, markConversationAsRead, MatchPreview, ChatMessage } from '../services/userService';
import DOMPurify from 'dompurify';

interface ChatViewProps {
    onBack?: () => void; // If used in a modal or navigation stack
    initialChatPartnerId?: string | null;
    onMessageRead?: () => void;
    onRefreshStats?: () => void;
    onViewProfile?: (userId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onBack, initialChatPartnerId, onMessageRead, onRefreshStats, onViewProfile }) => {
    const [matches, setMatches] = useState<MatchPreview[]>([]);
    const [activeMatch, setActiveMatch] = useState<MatchPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [showGhostConfirm, setShowGhostConfirm] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedIdRef = useRef<string | null>(null);

    // Initial load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
            await loadMatches();
        };
        init();
    }, []);

    // Handle deep linking to chat
    useEffect(() => {
        if (initialChatPartnerId && initialChatPartnerId !== lastProcessedIdRef.current && matches.length > 0) {
            const match = matches.find(m => m.partnerId === initialChatPartnerId);
            if (match) {
                openChat(match);
                lastProcessedIdRef.current = initialChatPartnerId;
            }
        }
    }, [initialChatPartnerId, matches]);

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

                    // Check if message already exists (prevent duplicates from optimistic update)
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === newMsg.id);
                        if (exists) return prev;

                        return [...prev, {
                            id: newMsg.id,
                            matchId: newMsg.match_id,
                            senderId: newMsg.sender_id,
                            content: newMsg.content,
                            createdAt: newMsg.created_at,
                            readAt: newMsg.read_at
                        }];
                    });

                    if (newMsg.sender_id === activeMatch.partnerId) {
                        markConversationAsRead(activeMatch.partnerId);
                        if (onMessageRead) onMessageRead();
                    }
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
        await markConversationAsRead(match.partnerId);
        if (match.unreadCount > 0 && onMessageRead) {
            onMessageRead();
        }
        const msgs = await fetchConversation(match.partnerId);
        setMessages(msgs);
        setLoadingMessages(false);
        loadMatches(); // Refresh list to clear badge
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
        } else {
            console.error('[ChatView] Failed to send message');
            alert('Nepodařilo se odeslat zprávu. Zkontroluj konzoli pro detaily.');
        }
        setSending(false);
    };

    const handleGhost = async () => {
        if (!activeMatch) return;
        setShowGhostConfirm(true);
    };

    const confirmGhost = async () => {
        if (!activeMatch) return;

        setShowGhostConfirm(false);
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
                <div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 max-w-md mx-auto w-full">
                    <h1 className="text-2xl font-black text-white">Zprávy</h1>
                </div>

                <div className="flex-grow overflow-y-auto p-4 max-w-md mx-auto w-full">
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
    // Use Portal to break out of the main app container and cover everything (Header, Nav)
    return createPortal(
        <div className="flex flex-col h-full bg-slate-950 fixed inset-0 z-[9999]">
            {/* Header */}
            <div className="p-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-800 bg-slate-900 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setActiveMatch(null); if (onRefreshStats) onRefreshStats(); }} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onViewProfile && onViewProfile(activeMatch.partnerId)}
                    >
                        <img
                            src={activeMatch.partnerAvatar}
                            alt={activeMatch.partnerUsername}
                            className="w-8 h-8 rounded-full object-cover border border-slate-600"
                        />
                        <span className="font-bold text-white">{activeMatch.partnerUsername}</span>
                    </div>
                </div>
                <button
                    onClick={handleGhost}
                    className="p-2 text-slate-400 hover:text-red-400 transition-colors group relative"
                    title="Ghost Mode - Ignorovat uživatele (lze vrátit v Ghost List)"
                >
                    <Ghost size={22} className="group-hover:scale-110 transition-transform" />
                    {/* Tooltip on hover */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-2 text-xs text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                        <div className="font-bold text-red-400 mb-1">Ghost Mode</div>
                        Ignorovat uživatele. Lze vrátit v Ghost List.
                    </div>
                </button>
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

            {/* Ghost Confirmation Modal */}
            {showGhostConfirm && activeMatch && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Ghost size={32} className="text-red-400" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-white text-center mb-2">
                            Ghostnout {activeMatch.partnerUsername}?
                        </h3>

                        {/* Description */}
                        <div className="space-y-2 mb-6">
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Už neuvidíš jeho zprávy</div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Zmizí ze seznamu chatů</div>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-slate-300">
                                <div className="text-green-400 mt-0.5">✓</div>
                                <div>Můžeš ho později odghostnout v <span className="font-bold text-white">Ghost List</span> (Profil → Ghost List)</div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGhostConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Zrušit
                            </button>
                            <button
                                onClick={confirmGhost}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30"
                            >
                                Ghostnout
                            </button>
                        </div>
                    </div>
                </div >
            )
            }
        </div >,
        document.body
    );
};
