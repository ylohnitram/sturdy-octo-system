
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { fetchUserData } from './services/userService';
import { Navigation } from './components/Navigation';
import { DiscoveryView } from './components/DiscoveryView';
import { LeaderboardView } from './components/LeaderboardView';
import { StatsView } from './components/StatsView';
import { ProfileView } from './components/ProfileView';
import { JournalView } from './components/JournalView';
import { GalleryView } from './components/GalleryView';
import { PremiumModal } from './components/PremiumModal';
import { StoreModal } from './components/StoreModal';
import { ReloadPrompt } from './components/ReloadPrompt';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { CookieConsent } from './components/CookieConsent';
import { OnboardingWizard } from './components/OnboardingWizard';
import { NotificationManager } from './components/NotificationManager';
import { Header } from './components/Header';
import { AppView, UserStats } from './types';
import { CheckCircle, AlertTriangle } from 'lucide-react';



// Default stats before loading real data
const INITIAL_STATS: UserStats = {
  bodyCount: 0,
  weeklyScore: 0,
  matches: 0,
  avgPartnerAge: 0,
  preferredType: '-',
  streakDays: 0,
  aiCredits: 3,
  coins: 50,
  inviteCode: 'LOADING...',
  invitesAvailable: 0
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [hasValidInvite, setHasValidInvite] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [landingMessage, setLandingMessage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DISCOVERY);

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');

  // Check for existing Supabase session on mount & Listen for changes
  useEffect(() => {
    // 1. Check Invite Persistence
    const verified = localStorage.getItem('notch_verified');
    if (verified === 'true') {
      setHasValidInvite(true);
    }

    // 2. Check Session
    const initSession = async () => {
      try {
        // Safety timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();

        // Race between session check and timeout
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        setSession(session);
        if (session) {
          // Load real data immediately if logged in with timeout protection
          try {
            const dataTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('User data fetch timeout')), 5000)
            );

            const userDataPromise = fetchUserData(session.user.id);
            const { stats, profile, restored, isOnboardingNeeded } = await Promise.race([userDataPromise, dataTimeout]) as any;

            if (stats) setUserStats(stats);
            if (profile?.avatarUrl) setUserAvatar(profile.avatarUrl);

            if (restored) {
              setShowRestoreNotification(true);
              setTimeout(() => setShowRestoreNotification(false), 5000);
            }
            if (isOnboardingNeeded) setShowOnboarding(true);
            setDataLoadError(null); // Clear any previous errors
          } catch (userDataError: any) {
            console.error('Error loading user data:', userDataError);
            setDataLoadError(userDataError.message || 'Chyba načítání dat');
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        // Fallback: assume no session if check fails
        setSession(null);
      } finally {
        setLoadingSession(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        try {
          const dataTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('User data fetch timeout in auth listener')), 5000)
          );

          const userDataPromise = fetchUserData(session.user.id);
          const { stats, profile, restored, isOnboardingNeeded } = await Promise.race([userDataPromise, dataTimeout]) as any;

          if (stats) setUserStats(stats);
          if (profile?.avatarUrl) setUserAvatar(profile.avatarUrl);

          if (restored) {
            setShowRestoreNotification(true);
            setTimeout(() => setShowRestoreNotification(false), 5000);
          }
          if (isOnboardingNeeded) setShowOnboarding(true);
          setDataLoadError(null);
        } catch (error: any) {
          console.error('Error loading user data in auth listener:', error);
          setDataLoadError(error.message || 'Chyba načítání dat');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monetization & Features Logic
  const openPremium = () => setIsPremiumModalOpen(true);
  const closePremium = () => setIsPremiumModalOpen(false);

  const openStore = () => setIsStoreModalOpen(true);
  const closeStore = () => setIsStoreModalOpen(false);

  const activatePanic = () => setIsPanicMode(true);
  const deactivatePanic = () => setIsPanicMode(false);

  const consumeAiCredit = (): boolean => {
    if (userStats.aiCredits > 0) {
      setUserStats(prev => ({ ...prev, aiCredits: prev.aiCredits - 1 }));
      return true;
    }
    openPremium();
    return false;
  };

  const consumeCoins = (amount: number): boolean => {
    if (userStats.coins >= amount) {
      setUserStats(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    openStore();
    return false;
  };

  const addCoins = (amount: number) => {
    setUserStats(prev => ({ ...prev, coins: prev.coins + amount }));
    closeStore();
  };

  const handleEnterApp = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setHasValidInvite(true);
    setLandingMessage(null);
  };

  const handleBackToLanding = (message?: string) => {
    setHasValidInvite(false);
    setAuthMode('signup');
    localStorage.removeItem('notch_verified');
    setLandingMessage(message || null);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Reload stats to reflect new avatar/bio
    if (session) {
      fetchUserData(session.user.id).then(({ stats }) => {
        if (stats) setUserStats(stats);
      });
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DISCOVERY:
        return <DiscoveryView
          userStats={userStats}
          onConsumeAi={consumeAiCredit}
          onConsumeCoins={consumeCoins}
        />;
      case AppView.LEADERBOARD:
        return <LeaderboardView userStats={userStats} onOpenPremium={openPremium} />;
      case AppView.JOURNAL:
        return <JournalView />;
      case AppView.GALLERY:
        return <GalleryView />;
      case AppView.ANALYTICS:
        return <StatsView onOpenPremium={openPremium} />;
      case AppView.PROFILE:
        return <ProfileView
          userStats={userStats}
          onActivatePanic={activatePanic}
          onOpenStore={openStore}
          onOpenPremium={openPremium}
          onConsumeAi={consumeAiCredit}
          onConsumeCoins={consumeCoins}
        />;
      default:
        return <DiscoveryView userStats={userStats} onConsumeAi={consumeAiCredit} onConsumeCoins={consumeCoins} />;
    }
  };

  // 1. Loading State
  if (loadingSession) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* GLOBAL OVERLAYS (Panic, Cookies, Wizard, Notifications) */}
      <CookieConsent />
      <ReloadPrompt />
      <NotificationManager userId={session?.user?.id || null} />
      {session && showOnboarding && <OnboardingWizard userId={session.user.id} onComplete={handleOnboardingComplete} />}

      {/* 2. Not Logged In Flow */}
      {!session ? (
        (!hasValidInvite && authMode !== 'login') ?
          <LandingPage onEnter={handleEnterApp} initialMessage={landingMessage} /> :
          <AuthView
            onLogin={() => { /* Session handled by listener */ }}
            initialView={authMode}
            onBackToLanding={handleBackToLanding}
          />
      ) : (
        /* 3. Main App (Logged In) */
        <>
          {showRestoreNotification && (
            <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top flex items-center gap-3">
              <CheckCircle size={24} />
              <div>
                <div className="font-bold">Vítej zpět!</div>
                <div className="text-xs opacity-90">Smazání tvého účtu bylo zrušeno.</div>
              </div>
            </div>
          )}

          {/* Error Toast for PWA Debugging */}
          {dataLoadError && (
            <div className="fixed top-20 left-4 right-4 z-50 bg-red-600/90 backdrop-blur text-white p-3 rounded-xl shadow-2xl animate-in slide-in-from-top flex items-center gap-3 border border-red-500">
              <AlertTriangle size={20} className="shrink-0" />
              <div className="flex-grow">
                <div className="font-bold text-sm">Chyba připojení</div>
                <div className="text-xs opacity-90">{dataLoadError}. Zkus to znovu.</div>
              </div>
              <button onClick={() => window.location.reload()} className="bg-white/20 px-2 py-1 rounded text-xs font-bold hover:bg-white/30">
                Reload
              </button>
            </div>
          )}

          <Header
            userStats={userStats}
            avatarUrl={userAvatar}
            onOpenStore={openStore}
            onNavigateProfile={() => setCurrentView(AppView.PROFILE)}
            notificationsEnabled={true}
          />

          <main className="h-screen overflow-hidden relative pt-16 pb-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 pointer-events-none z-0"></div>
            <div className="relative z-10 h-full">
              {renderView()}
            </div>
          </main>

          <Navigation currentView={currentView} onNavigate={setCurrentView} />

          <PremiumModal isOpen={isPremiumModalOpen} onClose={closePremium} />
          <StoreModal isOpen={isStoreModalOpen} onClose={closeStore} onPurchase={addCoins} />
        </>
      )}
    </div>
  );
};

export default App;
