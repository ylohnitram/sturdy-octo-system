import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Send, Ghost, Loader2, MessageCircle, Smile, Sparkles, Image as ImageIcon, Mic } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { PageHeader } from './PageHeader';
import { AudioRecorder } from './AudioRecorder';
import { AudioPlayer } from './AudioPlayer';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ImageLightbox } from './ImageLightbox';
import { supabase } from '../services/supabaseClient';
import { fetchMatches, fetchConversation, sendMessage, ghostUser, markConversationAsRead, MatchPreview, ChatMessage } from '../services/userService';
import { generateChatAssist } from '../services/geminiService';
import { compressImage, blobToFile, validateImageFile, validateAudioFile } from '../services/mediaUtils';
import DOMPurify from 'dompurify';

interface ChatViewProps {
    onBack?: () => void; // If used in a modal or navigation stack
    initialChatPartnerId?: string | null;
    onMessageRead?: () => void;
    onRefreshStats?: () => void;
    onViewProfile?: (userId: string) => void;
    userStats?: { username?: string; bio?: string; coins?: number };
    onConsumeCoins?: (amount: number) => boolean;
    isVisible?: boolean; // Hide chat portal when viewing profile
}

export const ChatView: React.FC<ChatViewProps> = ({ onBack, initialChatPartnerId, onMessageRead, onRefreshStats, onViewProfile, userStats, onConsumeCoins, isVisible = true }) => {
    const [matches, setMatches] = useState<MatchPreview[]>([]);
    const [activeMatch, setActiveMatch] = useState<MatchPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [showGhostConfirm, setShowGhostConfirm] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Multimedia states
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File; url: string } | null>(null);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedIdRef = useRef<string | null>(null);
    const aiAbortControllerRef = useRef<AbortController | null>(null);

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
        const checkAndOpen = async () => {
            if (initialChatPartnerId && initialChatPartnerId !== lastProcessedIdRef.current) {
                // Try to find match in current list
                let match = matches.find(m => m.partnerId === initialChatPartnerId);

                // If not found and not currently loading, try force reload
                if (!match && !loadingMatches) {
                    console.log('Partner not found in cache, reloading matches...', initialChatPartnerId);
                    const updatedMatches = await loadMatches();
                    match = updatedMatches.find(m => m.partnerId === initialChatPartnerId);
                }

                if (match) {
                    openChat(match);
                    lastProcessedIdRef.current = initialChatPartnerId;
                } else if (!loadingMatches) {
                    // Still not found after reload? Maybe create a temporary match object if we know they are matched?
                    // For now, just log warning.
                    console.warn('Chat partner not found even after reload:', initialChatPartnerId);
                }
            }
        };
        checkAndOpen();
    }, [initialChatPartnerId, matches, loadingMatches]);

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
                            content: newMsg.content || '',
                            type: newMsg.type || 'text',
                            mediaUrl: newMsg.media_url,
                            metadata: newMsg.metadata || {},
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
        return data;
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

    const handleEmojiSelect = (emoji: string) => {
        setInputText(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleAIAssist = async () => {
        if (!onConsumeCoins || !activeMatch) return;

        // Check & consume 5 coins
        const success = onConsumeCoins(5);
        if (!success) return; // Will show store modal automatically

        setGeneratingAI(true);
        setShowAIModal(true);

        try {
            const isIcebreaker = messages.length === 0;

            const conversationHistory = messages.map(msg => ({
                sender: (msg.senderId === currentUserId ? 'me' : 'them') as 'me' | 'them',
                message: msg.content
            }));

            const suggestion = await generateChatAssist({
                myProfile: {
                    username: userStats?.username || 'Anonym',
                    bio: userStats?.bio
                },
                theirProfile: {
                    username: activeMatch.partnerUsername,
                    bio: activeMatch.partnerBio
                },
                conversationHistory,
                isIcebreaker
            });

            setAiSuggestion(suggestion);
        } catch (error) {
            console.error('AI Assist error:', error);
            setAiSuggestion('Něco se pokazilo. Zkus to znovu.');
        } finally {
            setGeneratingAI(false);
        }
    };

    const acceptAISuggestion = () => {
        setInputText(aiSuggestion);
        setShowAIModal(false);
        setAiSuggestion('');
    };

    const regenerateAI = () => {
        setAiSuggestion('');
        handleAIAssist();
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

    // --- MULTIMEDIA HANDLERS ---

    const handleImageSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate image
        const validation = validateImageFile(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        // Create preview URL
        const url = URL.createObjectURL(file);
        setSelectedImage({ file, url });
        setShowImagePreview(true);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendImage = async (caption: string) => {
        if (!activeMatch || !selectedImage) return;

        setSending(true);

        try {
            // Compress image
            const compressedBlob = await compressImage(selectedImage.file);
            const compressedFile = blobToFile(compressedBlob, `image_${Date.now()}.jpg`);

            // Get image dimensions
            const img = new Image();
            img.src = selectedImage.url;
            await new Promise((resolve) => { img.onload = resolve; });

            const metadata = {
                width: img.width,
                height: img.height
            };

            // Send message with image
            const newMsg = await sendMessage(
                activeMatch.matchId,
                caption,
                compressedFile,
                'image',
                metadata
            );

            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
                setShowImagePreview(false);
                setSelectedImage(null);
                URL.revokeObjectURL(selectedImage.url);
            } else {
                alert('Nepodařilo se odeslat obrázek.');
            }
        } catch (error) {
            console.error('Error sending image:', error);
            alert('Chyba při odesílání obrázku.');
        } finally {
            setSending(false);
        }
    };

    const handleCancelImage = () => {
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage.url);
            setSelectedImage(null);
        }
        setShowImagePreview(false);
    };

    const handleAudioRecord = () => {
        setShowAudioRecorder(true);
    };

    const handleAudioRecordComplete = async (audioBlob: Blob, duration: number) => {
        if (!activeMatch) return;

        setSending(true);
        setShowAudioRecorder(false);

        try {
            // Convert blob to file
            const audioFile = blobToFile(audioBlob, `audio_${Date.now()}.webm`);

            // Validate audio
            const validation = validateAudioFile(audioFile);
            if (!validation.valid) {
                alert(validation.error);
                setSending(false);
                return;
            }

            const metadata = {
                duration: Math.round(duration)
            };

            // Send message with audio
            const newMsg = await sendMessage(
                activeMatch.matchId,
                '', // No text content for audio
                audioFile,
                'audio',
                metadata
            );

            if (newMsg) {
                setMessages(prev => [...prev, newMsg]);
            } else {
                alert('Nepodařilo se odeslat hlasovou zprávu.');
            }
        } catch (error) {
            console.error('Error sending audio:', error);
            alert('Chyba při odesílání hlasové zprávy.');
        } finally {
            setSending(false);
        }
    };

    const handleCancelAudio = () => {
        setShowAudioRecorder(false);
    };

    const handleImageClick = (imageUrl: string) => {
        // Get all image messages for gallery
        const imageMessages = messages.filter(m => m.type === 'image' && m.mediaUrl);
        const currentIndex = imageMessages.findIndex(m => m.mediaUrl === imageUrl);

        setLightboxImage(imageUrl);
        setLightboxImages(imageMessages.map(m => m.mediaUrl!));
        setLightboxIndex(currentIndex);
    };

    const handleCloseLightbox = () => {
        setLightboxImage(null);
        setLightboxImages([]);
        setLightboxIndex(0);
    };

    const handleNextImage = () => {
        if (lightboxImages.length > 0) {
            const nextIndex = (lightboxIndex + 1) % lightboxImages.length;
            setLightboxIndex(nextIndex);
            setLightboxImage(lightboxImages[nextIndex]);
        }
    };

    const handlePrevImage = () => {
        if (lightboxImages.length > 0) {
            const prevIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            setLightboxIndex(prevIndex);
            setLightboxImage(lightboxImages[prevIndex]);
        }
    };

    // --- RENDER LIST ---
    if (!activeMatch) {
        return (
            <div className="flex flex-col h-full bg-slate-900">
                <div className="p-4 pt-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 max-w-md mx-auto w-full">
                    <PageHeader
                        title="Moje"
                        highlight="Zprávy"
                        subtitle="Chatuj se svými úlovky"
                        icon={<MessageCircle size={24} />}
                    />
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
                        <div className="space-y-3">
                            {matches.map(match => (
                                <div
                                    key={match.matchId}
                                    onClick={() => openChat(match)}
                                    className="relative group p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-red-500/30 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer overflow-hidden"
                                >
                                    {/* Hover Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="relative">
                                            <img
                                                src={match.partnerAvatar}
                                                alt={match.partnerUsername}
                                                className="w-14 h-14 rounded-full object-cover border-2 border-slate-700 group-hover:border-red-500/50 transition-colors"
                                            />
                                            {match.unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center shadow-lg shadow-red-900/40 border border-slate-900">
                                                    <span className="text-[10px] font-bold text-white">{match.unreadCount}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-lg font-bold text-white truncate group-hover:text-red-400 transition-colors">{match.partnerUsername}</h3>
                                                {match.lastMessageTime && (
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {new Date(match.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate ${match.unreadCount > 0 ? 'text-slate-200 font-medium' : 'text-slate-400'} group-hover:text-slate-300 transition-colors`}>
                                                {match.lastMessage || 'Začni konverzaci...'}
                                            </p>
                                        </div>

                                        {/* Chevron for affordance */}
                                        <div className="text-slate-600 group-hover:text-red-500/50 transition-colors">
                                            <ArrowLeft size={16} className="rotate-180" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER DETAIL ---
    // Don't render portal if chat should be hidden (e.g. when viewing profile)
    if (!isVisible && activeMatch) {
        return null;
    }

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
                        onClick={() => {
                            if (onViewProfile) {
                                onViewProfile(activeMatch.partnerId);
                                // Keep chat open in background - it will be hidden by profile overlay
                            }
                        }}
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
                        const messageType = msg.type || 'text';

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] ${messageType === 'text' ? 'px-4 py-2' : 'p-1'} rounded-2xl text-sm ${isMe
                                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-red-500/50 text-white rounded-tr-none shadow-[0_0_10px_rgba(220,38,38,0.1)]'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                        }`}
                                >
                                    {messageType === 'text' && msg.content}

                                    {messageType === 'image' && msg.mediaUrl && (
                                        <div className="space-y-2">
                                            <img
                                                src={msg.mediaUrl}
                                                alt="Shared image"
                                                className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                                                onClick={() => handleImageClick(msg.mediaUrl!)}
                                            />
                                            {msg.content && (
                                                <p className="px-3 py-1 text-sm">{msg.content}</p>
                                            )}
                                        </div>
                                    )}

                                    {messageType === 'audio' && msg.mediaUrl && (
                                        <AudioPlayer
                                            audioUrl={msg.mediaUrl}
                                            duration={msg.metadata?.duration}
                                            isOwnMessage={isMe}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-slate-900 border-t border-slate-800">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative"
                >
                    {showEmojiPicker && (
                        <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                    <div className="flex gap-2">
                        {/* Image button - left side */}
                        <button
                            type="button"
                            onClick={handleImageSelect}
                            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                            title="Odeslat fotku"
                        >
                            <ImageIcon size={20} />
                        </button>

                        {/* Audio button - only show when not recording */}
                        {!showAudioRecorder && (
                            <button
                                type="button"
                                onClick={handleAudioRecord}
                                disabled={sending}
                                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
                                title="Nahrát hlasovou zprávu"
                            >
                                <Mic size={20} />
                            </button>
                        )}

                        {/* Audio recorder component */}
                        {showAudioRecorder && (
                            <AudioRecorder
                                onRecordComplete={handleAudioRecordComplete}
                                onCancel={handleCancelAudio}
                            />
                        )}

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Napiš zprávu... (Shift+Enter pro nový řádek)"
                            className="flex-grow bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors resize-none max-h-32 min-h-[40px]"
                            rows={1}
                            style={{
                                height: 'auto',
                                overflowY: inputText.split('\n').length > 3 ? 'auto' : 'hidden'
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full transition-all ${showEmojiPicker
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <Smile size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={handleAIAssist}
                            disabled={!onConsumeCoins}
                            className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="AI Wingman (5 kreditů)"
                        >
                            <Sparkles size={20} />
                        </button>

                        {/* Send button - always visible */}
                        <button
                            type="submit"
                            disabled={!inputText.trim() || sending}
                            className="p-2 bg-red-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
                        >
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Wingman Modal */}
            {showAIModal && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[10001]">
                    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl border border-purple-500/30 p-6 max-w-md w-full shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 fade-in duration-200 backdrop-blur-xl">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={32} className="text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-white text-center mb-2">
                            AI Wingman {messages.length === 0 ? '✨' : '💬'}
                        </h3>
                        <p className="text-xs text-purple-300 text-center mb-4">
                            {messages.length === 0 ? 'Pomůžeme ti napsat první zprávu' : 'Pomůžeme ti pokračovat v konverzaci'}
                        </p>

                        {/* Suggestion */}
                        <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-purple-500/20 min-h-[80px] flex items-center justify-center">
                            {generatingAI ? (
                                <div className="text-center">
                                    <Loader2 className="animate-spin text-purple-400 mx-auto mb-2" size={24} />
                                    <p className="text-sm text-slate-400">Generuji...</p>
                                </div>
                            ) : (
                                <p className="text-white text-center">{aiSuggestion}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    // Abort ongoing AI request
                                    if (aiAbortControllerRef.current) {
                                        aiAbortControllerRef.current.abort();
                                        aiAbortControllerRef.current = null;
                                    }
                                    setShowAIModal(false);
                                    setAiSuggestion('');
                                    setGeneratingAI(false);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Zrušit
                            </button>
                            {!generatingAI && aiSuggestion && (
                                <>
                                    <button
                                        onClick={regenerateAI}
                                        className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                                    >
                                        🔄
                                    </button>
                                    <button
                                        onClick={acceptAISuggestion}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/30"
                                    >
                                        Použít
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )
            }


            {/* Ghost Confirmation Modal */}
            {
                showGhostConfirm && activeMatch && (
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

            {/* Image Preview Modal */}
            {showImagePreview && selectedImage && (
                <ImagePreviewModal
                    imageFile={selectedImage.file}
                    imageUrl={selectedImage.url}
                    onSend={handleSendImage}
                    onCancel={handleCancelImage}
                    isSending={sending}
                />
            )}

            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox
                    imageUrl={lightboxImage}
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onClose={handleCloseLightbox}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                />
            )}
        </div >,
        document.body
    );
};
