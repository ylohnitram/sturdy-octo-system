
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Bell, Heart, MapPin, X, MessageCircle } from 'lucide-react';
import { fetchUserData } from '../services/userService';

interface NotificationManagerProps {
    userId: string | null;
    onProximityCheck?: () => void;
    onNewNotification?: (notification: any) => void;
    currentView?: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ userId, onProximityCheck, onNewNotification, currentView }) => {
    const [notification, setNotification] = useState<{ type: string, text: string } | null>(null);
    const [settings, setSettings] = useState({ proximity: true, likes: true });

    // 1. Load Settings
    useEffect(() => {
        if (!userId) return;
        fetchUserData(userId).then(({ profile }) => {
            if (profile) {
                setSettings({
                    proximity: profile.notifyProximity ?? true,
                    likes: profile.notifyLikes ?? true
                });
            }
        });
    }, [userId]);

    // 2. Subscribe to Realtime Notifications (Likes)
    useEffect(() => {
        if (!userId || !settings.likes) return;

        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotif = payload.new;
                    if (newNotif.type === 'like') {
                        showToast('like', 'Někdo ti dal srdíčko! ❤️');
                    } else if (newNotif.type === 'match') {
                        showToast('match', 'Máte nový Match! ❤️‍🔥');
                    } else if (newNotif.type === 'message') {
                        // Don't show toast if user is currently in chat view
                        if (currentView !== 'CHAT') {
                            showToast('message', 'Nová zpráva! 💬');
                        }
                    }
                    // Increment badge count
                    if (onNewNotification) onNewNotification(newNotif);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, settings.likes, onNewNotification]);

    // 3. Expose Proximity Simulation via Event or Interval
    // The actual proximity check is triggered by DiscoveryView logic, 
    // but this component handles the display if settings allow.
    useEffect(() => {
        const handleProximityEvent = () => {
            if (settings.proximity) {
                // 1 in 3 chance to show "Target Nearby" when triggered
                if (Math.random() > 0.6) {
                    showToast('proximity', 'V okolí se objevila kořist! 🎯');
                }
            }
        };

        window.addEventListener('notch_proximity_check', handleProximityEvent);
        return () => window.removeEventListener('notch_proximity_check', handleProximityEvent);
    }, [settings.proximity]);

    // 4. Listen for Local Match Event (Immediate Feedback)
    useEffect(() => {
        const handleMatchEvent = (e: any) => {
            const name = e.detail?.name || 'Někdo';
            showToast('match', `Je to Match s ${name}! ❤️‍🔥`);
        };

        window.addEventListener('notch_match_found', handleMatchEvent);
        return () => window.removeEventListener('notch_match_found', handleMatchEvent);
    }, []);

    const showToast = (type: string, text: string) => {
        setNotification({ type, text });
        // Auto hide after 4s
        setTimeout(() => setNotification(null), 4000);
        // Play sound (optional)
        // new Audio('/ping.mp3').play().catch(() => {});
    };

    if (!notification) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-[1000] animate-in slide-in-from-top duration-300">
            <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'like' ? 'bg-red-600' :
                    notification.type === 'match' ? 'bg-gradient-to-r from-pink-500 to-purple-500' :
                        notification.type === 'message' ? 'bg-green-500' :
                            'bg-yellow-500'
                    }`}>
                    {notification.type === 'like' ? <Heart size={20} fill="white" className="text-white" /> :
                        notification.type === 'match' ? <Heart size={20} fill="white" className="text-white animate-pulse" /> :
                            notification.type === 'message' ? <MessageCircle size={20} className="text-white" /> :
                                <MapPin size={20} className="text-black" />}
                </div>
                <div className="flex-grow">
                    <div className="font-bold text-white text-sm">
                        {notification.type === 'like' ? 'Nový obdivovatel' :
                            notification.type === 'match' ? 'It\'s a Match!' :
                                notification.type === 'message' ? 'Nová zpráva' :
                                    'Radar Aktivita'}
                    </div>
                    <div className="text-xs text-slate-300">{notification.text}</div>
                </div>
                <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
