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
        console.log('[NotificationsPanel] Marking as read:', notificationId);
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) {
            console.error('[NotificationsPanel] Error marking as read:', error);
            return;
        }

        console.log('[NotificationsPanel] Successfully marked as read');
        setNotifications(prev => {
            const updated = prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n);
            const unreadCount = updated.filter(n => !n.read_at).length;
            console.log('[NotificationsPanel] New unread count:', unreadCount);
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

    const handleNotificationClick = async (notif: any) => {
        if (!notif.read_at) await markAsRead(notif.id);

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
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 shadow-2xl animate-in slide-in-from-right pt-[env(safe-area-inset-top)]"
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
                                className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${notif.read_at
                                    ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/40'
                                    : 'bg-gradient-to-r from-slate-800 to-slate-800/80 border-blue-500/30 hover:border-blue-400/50 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20'
                                    }`}
                            >
                                {/* Glow effect for unread */}
                                {!notif.read_at && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-sm -z-10"></div>
                                )}

                                <div className="flex items-center gap-3">
                                    {/* Avatar or Icon */}
                                    {notif.related_user ? (
                                        <div className="relative">
                                            <img
                                                src={notif.related_user.avatar_url || 'https://picsum.photos/50'}
                                                alt={notif.related_user.username}
                                                className={`w-12 h-12 rounded-full object-cover transition-all ${notif.read_at
                                                    ? 'border-2 border-slate-600 opacity-70'
                                                    : 'border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                                                    }`}
                                            />
                                            <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${notif.read_at ? 'bg-slate-800' : 'bg-slate-900 ring-2 ring-blue-400/30'
                                                }`}>
                                                {getIcon(notif.type)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${notif.read_at
                                            ? 'bg-slate-800 border-2 border-slate-700'
                                            : 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-blue-400/30'
                                            }`}>
                                            {getIcon(notif.type)}
                                        </div>
                                    )}

                                    <div className="flex-grow min-w-0">
                                        <p className={`text-sm truncate transition-all ${notif.read_at
                                            ? 'text-slate-400 font-normal'
                                            : 'text-white font-semibold tracking-tight'
                                            }`}>
                                            {notif.related_user ? (
                                                <span className={notif.read_at ? 'text-slate-500' : 'text-blue-300 font-bold'}>
                                                    {notif.related_user.username}{' '}
                                                </span>
                                            ) : null}
                                            {notif.content}
                                        </p>
                                        <p className={`text-xs mt-1 ${notif.read_at ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {formatTime(notif.created_at)}
                                        </p>
                                    </div>

                                    {!notif.read_at && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                                        </div>
                                    )}
                                    {notif.related_user_id && (
                                        <ChevronRight
                                            size={18}
                                            className={`transition-all ${notif.read_at
                                                ? 'text-slate-700'
                                                : 'text-blue-400 group-hover:translate-x-1'
                                                }`}
                                        />
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
