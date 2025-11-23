
import React, { useState, useEffect, useRef } from 'react';
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
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ReloadPrompt } from './components/ReloadPrompt';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { CookieConsent } from './components/CookieConsent';
import { OnboardingWizard } from './components/OnboardingWizard';
import { NotificationManager } from './components/NotificationManager';
import { Header } from './components/Header';
import { NotificationsPanel } from './components/NotificationsPanel';
import { PublicProfileView } from './components/PublicProfileView';
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
  invitesAvailable: 0,
  notificationCount: 0
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Flag to prevent duplicate data loading
  const dataLoadedRef = useRef(false);

  // Check for existing Supabase session on mount & Listen for changes
  useEffect(() => {
    // 0. Check and clear cache if version changed
    const checkCacheVersion = async () => {
      const currentVersion = import.meta.env.PACKAGE_VERSION;
      const storedVersion = localStorage.getItem('notch_app_version');

      if (storedVersion && storedVersion !== currentVersion) {
        console.log(`[Cache] Version changed from ${storedVersion} to ${currentVersion}. Clearing cache...`);

        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('[Cache] All caches cleared');
        }

        // Clear localStorage except auth
        const authKeys = ['sb-', 'supabase.auth.token'];
        Object.keys(localStorage).forEach(key => {
          if (!authKeys.some(authKey => key.startsWith(authKey))) {
            localStorage.removeItem(key);
          }
        });

        console.log('[Cache] localStorage cleaned');
      }

      // Store current version
      localStorage.setItem('notch_app_version', currentVersion);
    };

    checkCacheVersion();

    // 1. Check Invite Persistence
    const verified = localStorage.getItem('notch_verified');
    if (verified === 'true') {
      setHasValidInvite(true);
    }

    // Helper function to load user data with retry logic
    const loadUserDataWithRetry = async (userId: string, maxRetries = 3): Promise<any> => {
      const totalAttempts = maxRetries + 1; // 1 initial + 3 retries = 4 total

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Data Load] Attempt ${attempt + 1}/${totalAttempts} for user ${userId.substring(0, 8)}...`);

          // Timeout: 5 seconds per attempt - if Supabase is slower, it's a cold start issue
          const timeout = 5000;
          const dataTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout po 5s')), timeout)
          );

          const userDataPromise = fetchUserData(userId);
          const result = await Promise.race([userDataPromise, dataTimeout]) as any;
          console.log('[Data Load] Success!', result);
          console.log('[Data Load] Stats tier:', result?.stats?.tier);
          console.log('[Data Load] Profile tier:', result?.profile?.tier);
          return result; // Success
        } catch (error: any) {
          console.error(`[Data Load] Attempt ${attempt + 1} failed:`, error.message);

          if (attempt < maxRetries) {
            // Progressive backoff: 1s, 2s
            const waitTime = (attempt + 1) * 1000;
            console.log(`[Data Load] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            console.error('[Data Load] All attempts failed!');
            throw error; // Final attempt failed
          }
        }
      }
    };

    // 2. Check Session (data loading handled by onAuthStateChange)
    const initSession = async () => {
      try {
        // Just check session, don't load data (onAuthStateChange will handle that)
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        console.log('[initSession] Session checked, data loading will be handled by onAuthStateChange');
      } catch (error) {
        console.error('Session initialization error:', error);
        setSession(null);
      } finally {
        setLoadingSession(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Event:', event, 'Session:', !!session);
      setSession(session);

      // Handle sign in, initial session, and token refresh
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        try {
          // ONLY load data on INITIAL_SESSION - SIGNED_IN fires too early before Supabase is ready!
          if (event === 'INITIAL_SESSION' && !dataLoadedRef.current) {
            dataLoadedRef.current = true; // Mark as loading/loaded
            console.log(`[Auth] Loading data for event: ${event}`);
            const { stats, profile, restored, isOnboardingNeeded } = await loadUserDataWithRetry(session.user.id);

            if (stats) {
              console.log('[App] Setting userStats with tier:', stats.tier);
              setUserStats(stats);
            }
            if (profile?.avatarUrl) setUserAvatar(profile.avatarUrl);

            if (restored) {
              setShowRestoreNotification(true);
              setTimeout(() => setShowRestoreNotification(false), 5000);
            }
            if (isOnboardingNeeded) setShowOnboarding(true);
          } else if (event === 'SIGNED_IN') {
            console.log('[Auth] SIGNED_IN event - skipping (will load on INITIAL_SESSION)');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed successfully - connection maintained');
            // Don't reload data on token refresh - just maintain existing state
          }

          setDataLoadError(null);
        } catch (error: any) {
          console.error('Error loading user data in auth listener:', error);

          // FALLBACK: If we already have user stats (from previous load), keep using them
          if (userStats.username && userStats.username !== 'Lovce') {
            console.warn('[App] Data load failed but using cached userStats');
            setDataLoadError(null); // Don't show error if we have cached data
          } else {
            // Only show error if we have no data at all
            setDataLoadError(`Nepodařilo se načíst data. Zkus to znovu.`);
          }
          dataLoadedRef.current = false; // Allow retry
        }
      }

      // Handle sign out
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out - clearing data');
        setUserStats(INITIAL_STATS);
        setUserAvatar('');
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
    alert(`TIER: ${userStats.tier}, CREDITS: ${userStats.aiCredits}`);
    console.log('[consumeAiCredit] Checking tier:', userStats.tier, 'Credits:', userStats.aiCredits);
    // GOLD users have unlimited AI credits
    if (userStats.tier === 'PREMIUM') {
      console.log('[consumeAiCredit] PREMIUM user - allowing unlimited AI');
      alert('PREMIUM USER - ALLOWING!');
      return true;
    }

    // Free users need to have credits
    if (userStats.aiCredits > 0) {
      console.log('[consumeAiCredit] Free user with credits - consuming 1');
      setUserStats(prev => ({ ...prev, aiCredits: prev.aiCredits - 1 }));
      return true;
    }

    // No credits and not premium - show upgrade modal
    console.log('[consumeAiCredit] No credits and not premium - showing modal');
    alert('NO PREMIUM - SHOWING MODAL');
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

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView(AppView.USER_PROFILE);
    setShowNotifications(false);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DISCOVERY:
        return <DiscoveryView
          userStats={userStats}
          onConsumeAi={consumeAiCredit}
          onConsumeCoins={consumeCoins}
          onOpenPremium={openPremium}
        />;
      case AppView.LEADERBOARD:
        return <LeaderboardView userStats={userStats} onOpenPremium={openPremium} />;
      case AppView.JOURNAL:
        return <JournalView />;
      case AppView.GALLERY:
        return <GalleryView />;
      case AppView.ANALYTICS:
        return <StatsView userStats={userStats} onOpenPremium={openPremium} />;
      case AppView.PROFILE:
        return <ProfileView
          userStats={userStats}
          onActivatePanic={activatePanic}
          onOpenStore={openStore}
          onOpenPremium={openPremium}
          onConsumeAi={consumeAiCredit}
          onConsumeCoins={consumeCoins}
        />;
      case AppView.USER_PROFILE:
        return selectedUserId ? (
          <PublicProfileView
            targetUserId={selectedUserId}
            onBack={() => setCurrentView(AppView.DISCOVERY)}
          />
        ) : <DiscoveryView userStats={userStats} onConsumeAi={consumeAiCredit} onConsumeCoins={consumeCoins} />;
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
      <NotificationManager
        userId={session?.user?.id || null}
        onNewNotification={() => setUserStats(prev => ({ ...prev, notificationCount: (prev.notificationCount || 0) + 1 }))}
      />
      <PWAInstallPrompt />
      {session && showOnboarding && <OnboardingWizard userId={session.user.id} onComplete={handleOnboardingComplete} />}

      {/* Notifications Panel */}
      {session && showNotifications && (
        <NotificationsPanel
          userId={session.user.id}
          onClose={() => setShowNotifications(false)}
          onNotificationCountChange={(count) => setUserStats(prev => ({ ...prev, notificationCount: count }))}
          onViewProfile={handleViewProfile}
        />
      )}

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
            onOpenNotifications={() => setShowNotifications(true)}
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
