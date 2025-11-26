import React, { useState } from 'react';
import { Search, X, Smile, Heart, Flame, Apple, Sparkles, Clock } from 'lucide-react';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = {
    recent: {
        name: 'Nedávné',
        icon: Clock,
        emojis: [] as string[], // Will be populated from localStorage
    },
    smileys: {
        name: 'Smajlíci',
        icon: Smile,
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
    },
    hearts: {
        name: 'Srdíčka',
        icon: Heart,
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '😻', '😍', '🥰', '😘', '💋', '👄', '💏', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩', '💌'],
    },
    activities: {
        name: 'Aktivita',
        icon: Flame,
        emojis: ['🔥', '💯', '💪', '👊', '✊', '🤘', '🤙', '👌', '👍', '👎', '✌️', '🤞', '🤝', '🙏', '👏', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '⛸️', '🥌'],
    },
    food: {
        name: 'Jídlo',
        icon: Apple,
        emojis: ['🍑', '🍆', '🍌', '🥒', '🌶️', '🍓', '🍒', '🍇', '🍉', '🍊', '🍋', '🍍', '🥭', '🍎', '🍏', '🥝', '🥥', '🍅', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🫑', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔'],
    },
    objects: {
        name: 'Ostatní',
        icon: Sparkles,
        emojis: ['💎', '💍', '👑', '🎩', '🎓', '👒', '🧢', '⛑️', '📿', '💄', '💅', '🎀', '🎁', '🌹', '🥀', '💐', '🌺', '🌸', '🏵️', '🌻', '🌼', '🌷', '⭐', '🌟', '✨', '💫', '💥', '🔥', '☀️', '⛅', '☁️', '🌙', '⭐', '🌠', '🌈', '☔', '❄️', '⛄', '💧', '💦', '🌊', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '🔶', '🔷'],
    },
};

const RECENT_EMOJIS_KEY = 'notch_recent_emojis';

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
    const [searchQuery, setSearchQuery] = useState('');
    const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);

        // Update recent emojis
        const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 24);
        setRecentEmojis(updated);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    };

    const categories = {
        ...EMOJI_CATEGORIES,
        recent: { ...EMOJI_CATEGORIES.recent, emojis: recentEmojis }
    };

    const filteredEmojis = searchQuery
        ? Object.values(categories).flatMap(cat => cat.emojis).filter(emoji => emoji.includes(searchQuery))
        : categories[activeCategory].emojis;

    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Hledat emoji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Category Tabs */}
            {!searchQuery && (
                <div className="flex gap-1 p-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
                    {Object.entries(categories).map(([key, cat]) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === key;
                        const hasEmojis = cat.emojis.length > 0;

                        if (key === 'recent' && !hasEmojis) return null;

                        return (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                        ? 'bg-red-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <Icon size={14} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="h-64 overflow-y-auto p-3">
                {filteredEmojis.length > 0 ? (
                    <div className="grid grid-cols-8 gap-1">
                        {filteredEmojis.map((emoji, idx) => (
                            <button
                                key={`${emoji}-${idx}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-2xl p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Search size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Žádné emoji nenalezeny</p>
                    </div>
                )}
            </div>
        </div>
    );
};
