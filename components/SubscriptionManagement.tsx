
import React, { useState, useEffect } from 'react';
import { Crown, Calendar, AlertCircle, Check, X } from 'lucide-react';
import { Button } from './Button';
import { getUserSubscription, cancelSubscription, reactivateSubscription } from '../services/paymentService';
import { Subscription } from '../types';

interface SubscriptionManagementProps {
    onClose: () => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ onClose }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        setIsLoading(true);
        try {
            const sub = await getUserSubscription();
            setSubscription(sub);
        } catch (err) {
            console.error('Error loading subscription:', err);
            setError('Nepodařilo se načíst informace o předplatném');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        setActionLoading(true);
        setError(null);

        try {
            await cancelSubscription();
            await loadSubscription(); // Reload to get updated status
            setShowCancelConfirm(false);
        } catch (err) {
            console.error('Error canceling subscription:', err);
            setError(err instanceof Error ? err.message : 'Nepodařilo se zrušit předplatné');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setActionLoading(true);
        setError(null);

        try {
            await reactivateSubscription();
            await loadSubscription(); // Reload to get updated status
        } catch (err) {
            console.error('Error reactivating subscription:', err);
            setError(err instanceof Error ? err.message : 'Nepodařilo se obnovit předplatné');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
                <div className="bg-slate-900 p-8 rounded-2xl">
                    <p className="text-white">Načítání...</p>
                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
                <div className="bg-slate-900 p-8 rounded-2xl max-w-md">
                    <p className="text-white mb-4">Nemáš aktivní předplatné Notch Gold.</p>
                    <Button onClick={onClose} fullWidth>Zavřít</Button>
                </div>
            </div>
        );
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const willCancel = subscription.cancel_at_period_end;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden border-t border-slate-700 shadow-2xl">

                {/* Header */}
                <div className={`h-32 ${willCancel ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gradient-to-br from-yellow-600 via-orange-500 to-red-600'} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <Crown size={64} className="text-white drop-shadow-lg" fill="currentColor" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            Notch <span className={willCancel ? 'text-orange-400' : 'text-yellow-400'}>GOLD</span>
                        </h2>
                        <p className={`text-sm font-bold mt-2 ${willCancel ? 'text-orange-400' : 'text-green-400'}`}>
                            {willCancel ? 'KONČÍ' : subscription.status === 'trialing' ? 'ZKUŠEBNÍ OBDOBÍ' : 'AKTIVNÍ'}
                        </p>
                    </div>

                    {/* Subscription Info */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-slate-400" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-500">Další platba</p>
                                <p className="text-sm text-white font-bold">
                                    {formatDate(subscription.current_period_end)}
                                </p>
                            </div>
                        </div>

                        {subscription.status === 'trialing' && subscription.trial_end && (
                            <div className="flex items-center gap-3 pt-3 border-t border-slate-700">
                                <Check size={20} className="text-green-400" />
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500">Zkušební období končí</p>
                                    <p className="text-sm text-green-400 font-bold">
                                        {formatDate(subscription.trial_end)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {willCancel && (
                            <div className="flex items-start gap-3 pt-3 border-t border-slate-700">
                                <AlertCircle size={20} className="text-orange-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-orange-400 leading-relaxed">
                                        Tvé výhody platí do {formatDate(subscription.current_period_end)}.
                                        Poté budeš převeden na FREE verzi.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {!showCancelConfirm ? (
                        <div className="space-y-3">
                            {willCancel ? (
                                <Button
                                    fullWidth
                                    size="lg"
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black"
                                    onClick={handleReactivateSubscription}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'NAČÍTÁNÍ...' : 'OBNOVIT PŘEDPLATNÉ'}
                                </Button>
                            ) : (
                                <Button
                                    fullWidth
                                    size="lg"
                                    variant="outline"
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    onClick={() => setShowCancelConfirm(true)}
                                    disabled={actionLoading}
                                >
                                    Zrušit automatické obnovení
                                </Button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full text-sm text-slate-500 hover:text-white transition-colors"
                            >
                                Zavřít
                            </button>
                        </div>
                    ) : (
                        // Retention Modal
                        <div className="space-y-4">
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-white mb-2">Opravdu to chceš zabalit?</h3>
                                <p className="text-sm text-slate-400 mb-4">Přijdeš o tyto výhody:</p>
                            </div>

                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <X size={16} className="text-red-400" />
                                    <span>Globální žebříčky</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <X size={16} className="text-red-400" />
                                    <span>Ghost Mode</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <X size={16} className="text-red-400" />
                                    <span>Kdo tě viděl</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <X size={16} className="text-red-400" />
                                    <span>Zlatý odznak</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    fullWidth
                                    size="lg"
                                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-slate-900 font-black"
                                    onClick={() => setShowCancelConfirm(false)}
                                >
                                    Ne, chci si nechat výhody
                                </Button>

                                <Button
                                    fullWidth
                                    size="lg"
                                    variant="outline"
                                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                                    onClick={handleCancelSubscription}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Ruším...' : 'Ano, zrušit obnovení'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
