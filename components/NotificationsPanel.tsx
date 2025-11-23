import React, { useEffect, useState } from 'react';
import { X, Heart, MapPin, Users, Check, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Notification } from '../types';

interface NotificationsPanelProps {
    userId: string;
    onClose: () => void;
    onNotificationCountChange: (count: number) => void;
    onViewProfile: (userId: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ userId, onClose, onNotificationCountChange, onViewProfile }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                related_user:related_user_id (
                    username,
                    avatar_url
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            const unreadCount = data.filter((n: any) => !n.read_at).length;
            onNotificationCountChange(unreadCount);
        }
        setLoading(false);
    };

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        setNotifications(prev => {
            const updated = prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n);
            const unreadCount = updated.filter(n => !n.read_at).length;
            onNotificationCountChange(unreadCount);
            return updated;
        });
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);

        setNotifications(prev =>
            prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
        onNotificationCountChange(0);
    };

    const handleNotificationClick = (notif: any) => {
        if (!notif.read_at) markAsRead(notif.id);

        if (notif.related_user_id) {
            onViewProfile(notif.related_user_id);
            onClose();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={20} className="text-red-500" />;
            case 'proximity': return <MapPin size={20} className="text-yellow-500" />;
            case 'rival': return <Users size={20} className="text-blue-500" />;
            case 'match': return <Heart size={20} className="text-purple-500" fill="currentColor" />;
            default: return <Heart size={20} className="text-slate-500" />;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Právě teď';
        if (diffMins < 60) return `Před ${diffMins} min`;
        if (diffHours < 24) return `Před ${diffHours}h`;
        if (diffDays < 7) return `Před ${diffDays} dny`;
        return date.toLocaleDateString('cs-CZ');
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 shadow-2xl animate-in slide-in-from-right"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Notifikace</h2>
                    <div className="flex items-center gap-2">
                        {notifications.filter(n => !n.read_at).length > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <Check size={14} /> Označit vše
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto h-[calc(100vh-80px)] p-4 space-y-2">
                    {loading ? (
                        <div className="text-center text-slate-500 py-10">Načítání...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">
                            <p>Žádné notifikace</p>
                        </div>
                    ) : (
                        notifications.map((notif: any) => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${notif.read_at
                                    ? 'bg-slate-800/50 border-slate-700'
                                    : 'bg-slate-800 border-slate-600 hover:bg-slate-750'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar or Icon */}
                                    {notif.related_user ? (
                                        <div className="relative">
                                            <img
                                                src={notif.related_user.avatar_url || 'https://picsum.photos/50'}
                                                alt={notif.related_user.username}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-600"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                                                {getIcon(notif.type)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                            {getIcon(notif.type)}
                                        </div>
                                    )}

                                    <div className="flex-grow min-w-0">
                                        <p className={`text-sm truncate ${notif.read_at ? 'text-slate-400' : 'text-white font-medium'}`}>
                                            {notif.related_user ? (
                                                <span className="font-bold text-slate-200">{notif.related_user.username} </span>
                                            ) : null}
                                            {notif.content}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">{formatTime(notif.created_at)}</p>
                                    </div>

                                    {!notif.read_at && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full shrink-0"></div>
                                    )}
                                    {notif.related_user_id && (
                                        <ChevronRight size={16} className="text-slate-600" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
