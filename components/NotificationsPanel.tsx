import React, { useEffect, useState } from 'react';
import { X, Heart, MapPin, Users, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Notification {
    id: string;
    type: string;
    content: string;
    created_at: string;
    read_at: string | null;
}

interface NotificationsPanelProps {
    userId: string;
    onClose: () => void;
    onNotificationCountChange: (count: number) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ userId, onClose, onNotificationCountChange }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            const unreadCount = data.filter(n => !n.read_at).length;
            onNotificationCountChange(unreadCount);
        }
        setLoading(false);
    };

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
        );

        const unreadCount = notifications.filter(n => !n.read_at && n.id !== notificationId).length;
        onNotificationCountChange(unreadCount);
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

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={20} className="text-red-500" />;
            case 'proximity': return <MapPin size={20} className="text-yellow-500" />;
            case 'rival': return <Users size={20} className="text-blue-500" />;
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
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.read_at && markAsRead(notif.id)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all ${notif.read_at
                                        ? 'bg-slate-800/50 border-slate-700'
                                        : 'bg-slate-800 border-slate-600 hover:bg-slate-750'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{getIcon(notif.type)}</div>
                                    <div className="flex-grow">
                                        <p className={`text-sm ${notif.read_at ? 'text-slate-400' : 'text-white font-medium'}`}>
                                            {notif.content}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">{formatTime(notif.created_at)}</p>
                                    </div>
                                    {!notif.read_at && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
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
