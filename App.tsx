
import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from './services/supabaseClient';
import { fetchUserData, updateUserLocation } from './services/userService';
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
import { ChatView } from './components/ChatView';
import { LoadingScreen } from './components/LoadingScreen';
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

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [initialChatPartnerId, setInitialChatPartnerId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Swipe Navigation Logic
  const NAV_ORDER = [
    AppView.DISCOVERY,
    AppView.LEADERBOARD,
    AppView.JOURNAL,
    AppView.GALLERY,
    AppView.CHAT,
    AppView.PROFILE
  ];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe Left -> Go to Next Tab (Right)
      const currentIndex = NAV_ORDER.indexOf(currentView);
      if (currentIndex !== -1 && currentIndex < NAV_ORDER.length - 1) {
        setCurrentView(NAV_ORDER[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      // Swipe Right -> Go to Prev Tab (Left)
      const currentIndex = NAV_ORDER.indexOf(currentView);
      if (currentIndex !== -1 && currentIndex > 0) {
        setCurrentView(NAV_ORDER[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  // State for current view - Initialize from localStorage or default to PROFILE
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const savedView = localStorage.getItem('notch_last_view');
    // Simple validation to ensure the saved string is actually a valid view
    if (savedView && Object.values(AppView).includes(savedView as AppView)) {
      return savedView as AppView;
    }
    return AppView.PROFILE;
  });

  // Persist current view on change
  useEffect(() => {
    localStorage.setItem('notch_last_view', currentView);
  }, [currentView]);

  // Flag to prevent duplicate data loading
  const dataLoadedRef = useRef(false);
  const signedInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing Supabase session on mount & Listen for changes
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initApp = async () => {
      // 0. Check and clear cache if version changed
      const currentVersion = import.meta.env.PACKAGE_VERSION;
      const storedVersion = localStorage.getItem('notch_app_version');

      if (storedVersion && storedVersion !== currentVersion) {
        console.log(`[Cache] Version changed from ${storedVersion} to ${currentVersion}. Clearing cache...`);

        // Clear all caches
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('[Cache] All caches cleared');
          } catch (e) {
            console.error('[Cache] Error clearing cache:', e);
          }
        }

        // Clear localStorage except auth and view state
        const authKeys = ['sb-', 'supabase.auth.token', 'notch_verified', 'notch_last_view']; // Keep verified status and last view!
        Object.keys(localStorage).forEach(key => {
          if (!authKeys.some(authKey => key.startsWith(authKey))) {
            localStorage.removeItem(key);
          }
        });

        console.log('[Cache] localStorage cleaned');
      }

      // Store current version
      localStorage.setItem('notch_app_version', currentVersion);

      // 1. Check Invite Persistence
      const verified = localStorage.getItem('notch_verified');
      if (verified === 'true') {
        setHasValidInvite(true);
      }

      // 2. Initialize Auth Listener (AFTER cache check)
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Event:', event, 'Session:', !!session);
        setSession(session);

        // Shared data loading function
        const performDataLoad = async (uid: string) => {
          try {
            dataLoadedRef.current = true;
            console.log(`[Auth] Starting data load...`);
            const { stats, profile, restored, isOnboardingNeeded } = await loadUserDataWithRetry(uid);

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
            setDataLoadError(null);
          } catch (error: any) {
            console.error('Error loading user data:', error);
            if (userStats.username && userStats.username !== 'Lovce') {
              console.warn('[App] Data load failed but using cached userStats');
              setDataLoadError(null);
            } else {
              setDataLoadError(`Nepodařilo se načíst data. Zkus to znovu.`);
            }
            dataLoadedRef.current = false;
          }
        };

        // Handle sign in, initial session, and token refresh
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {

          if (event === 'INITIAL_SESSION') {
            // Priority 1: INITIAL_SESSION
            if (signedInTimeoutRef.current) {
              clearTimeout(signedInTimeoutRef.current);
              signedInTimeoutRef.current = null;
            }

            if (!dataLoadedRef.current) {
              console.log('[Auth] INITIAL_SESSION triggered data load.');
              await performDataLoad(session.user.id);
            }

          } else if (event === 'SIGNED_IN') {
            // Priority 2: SIGNED_IN (Short delay to prefer INITIAL_SESSION)
            if (!dataLoadedRef.current) {
              console.log('[Auth] SIGNED_IN detected. Waiting 500ms for potential INITIAL_SESSION...');

              if (signedInTimeoutRef.current) clearTimeout(signedInTimeoutRef.current);

              signedInTimeoutRef.current = setTimeout(async () => {
                if (!dataLoadedRef.current) {
                  console.log('[Auth] No INITIAL_SESSION arrived. Executing SIGNED_IN fallback load.');
                  await performDataLoad(session.user.id);
                }
              }, 500); // Short 500ms delay is enough
            }

          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[Auth] Token refreshed successfully');
          }
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out - clearing data');
          setUserStats(INITIAL_STATS);
          setUserAvatar('');
          dataLoadedRef.current = false;
          if (signedInTimeoutRef.current) {
            clearTimeout(signedInTimeoutRef.current);
            signedInTimeoutRef.current = null;
          }
          // Clear saved view on logout so next login starts fresh
          localStorage.removeItem('notch_last_view');
          setCurrentView(AppView.PROFILE);
        }
      });

      subscription = data.subscription;

      // 3. Check Session (initial check)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Session initialization error:', error);
        setSession(null);
      } finally {
        setLoadingSession(false);
      }
    };



    // Helper function to load user data with retry logic
    const loadUserDataWithRetry = async (userId: string, maxRetries = 2): Promise<any> => { // Reduced retries
      const totalAttempts = maxRetries + 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Data Load] Attempt ${attempt + 1}/${totalAttempts}...`);

          // Timeout: 5 seconds (Standard)
          const timeout = 5000;
          const dataTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout po 5s')), timeout)
          );

          const userDataPromise = fetchUserData(userId);
          const result = await Promise.race([userDataPromise, dataTimeout]) as any;
          console.log('[Data Load] Success!');
          return result;
        } catch (error: any) {
          console.error(`[Data Load] Attempt ${attempt + 1} failed:`, error.message);

          if (attempt < maxRetries) {
            const waitTime = 500; // Faster retry (500ms)
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        }
      }
    };

    initApp();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Location Tracking (Every 5 minutes)
  useEffect(() => {
    if (!session?.user?.id) return;

    const updatePos = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Only update if we have a valid session
            if (session?.user?.id) {
              await updateUserLocation(session.user.id, latitude, longitude);
              console.log('[Location] Updated:', latitude, longitude);
            }
          },
          (err) => console.error('[Location] Error:', err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    };

    // Initial update
    updatePos();

    // Interval update (every 5 minutes)
    const interval = setInterval(updatePos, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Real-time notification count updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('notification_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        async () => {
          // Refresh notification count
          const { getUnreadNotificationsCount } = await import('./services/userService');
          const count = await getUnreadNotificationsCount(session.user.id);
          setUserStats(prev => ({ ...prev, notificationCount: count }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // Monetization & Features Logic
  const openPremium = () => setIsPremiumModalOpen(true);
  const closePremium = () => setIsPremiumModalOpen(false);

  const openStore = () => setIsStoreModalOpen(true);
  const closeStore = () => setIsStoreModalOpen(false);



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

  const handleOpenChat = (partnerId: string) => {
    setInitialChatPartnerId(partnerId);
    setCurrentView(AppView.CHAT);
  };

  const handleNewNotification = (notification: any) => {
    setUserStats(prev => {
      const newStats = { ...prev, notificationCount: (prev.notificationCount || 0) + 1 };
      if (notification.type === 'message') {
        newStats.unreadConversationsCount = (prev.unreadConversationsCount || 0) + 1;
      }
      return newStats;
    });
  };

  const handleMessageRead = () => {
    setUserStats(prev => ({
      ...prev,
      unreadConversationsCount: Math.max(0, (prev.unreadConversationsCount || 0) - 1)
    }));
  };

  const handleRefreshStats = async () => {
    if (!session?.user?.id) return;
    const { getUnreadConversationsCount } = await import('./services/userService');
    const count = await getUnreadConversationsCount(session.user.id);
    setUserStats(prev => ({ ...prev, unreadConversationsCount: count }));
  };

  const handleNavigate = (view: AppView) => {
    // Clear initialChatPartnerId when navigating to Chat via bottom nav
    if (view === AppView.CHAT) {
      setInitialChatPartnerId(null);
    }
    setCurrentView(view);
  };





  // 1. Loading State
  if (loadingSession) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* GLOBAL OVERLAYS (Panic, Cookies, Wizard, Notifications) */}
      <CookieConsent />
      <ReloadPrompt />
      <NotificationManager
        userId={session?.user?.id || null}
        onNewNotification={handleNewNotification}
        currentView={currentView}
        onOpenNotifications={() => setShowNotifications(true)}
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
          onOpenChat={handleOpenChat}
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
            <div className="fixed top-[calc(env(safe-area-inset-top)+1rem)] left-4 right-4 z-[60] bg-green-600 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top flex items-center gap-3">
              <CheckCircle size={24} />
              <div>
                <div className="font-bold">Vítej zpět!</div>
                <div className="text-xs opacity-90">Smazání tvého účtu bylo zrušeno.</div>
              </div>
            </div>
          )}

          {/* Error Toast for PWA Debugging */}
          {dataLoadError && (
            <div className="fixed top-[calc(env(safe-area-inset-top)+5rem)] left-4 right-4 z-[60] bg-red-600/90 backdrop-blur text-white p-3 rounded-xl shadow-2xl animate-in slide-in-from-top flex items-center gap-3 border border-red-500">
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

          <main {...handlers} className="h-screen overflow-hidden relative pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 pointer-events-none z-0"></div>
            <div className="relative z-10 h-full overflow-hidden">
              {/* Main Tabs - Slider */}
              <div
                className="flex h-full transition-transform duration-300 ease-out will-change-transform"
                style={{
                  width: `${NAV_ORDER.length * 100}%`,
                  transform: `translateX(-${Math.max(0, NAV_ORDER.indexOf(currentView)) * (100 / NAV_ORDER.length)}%)`
                }}
              >
                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <DiscoveryView
                    userStats={userStats}
                    userAvatarUrl={userAvatar}
                    onConsumeAi={consumeAiCredit}
                    onConsumeCoins={consumeCoins}
                    onOpenPremium={openPremium}
                    onOpenChat={handleOpenChat}
                  />
                </div>

                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <LeaderboardView userStats={userStats} onOpenPremium={openPremium} />
                </div>

                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <JournalView onOpenChat={handleOpenChat} onViewProfile={handleViewProfile} />
                </div>

                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <GalleryView />
                </div>

                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <ChatView
                    initialChatPartnerId={initialChatPartnerId}
                    onMessageRead={handleMessageRead}
                    onRefreshStats={handleRefreshStats}
                    onViewProfile={handleViewProfile}
                  />
                </div>

                <div className="h-full" style={{ width: `${100 / NAV_ORDER.length}%` }}>
                  <ProfileView
                    userStats={userStats}
                    avatarUrl={userAvatar}
                    onOpenStore={openStore}
                    onOpenPremium={openPremium}
                    onConsumeAi={consumeAiCredit}
                    onConsumeCoins={consumeCoins}
                    onNavigate={(view) => setCurrentView(view as AppView)}
                    onAvatarUpdate={(newUrl) => setUserAvatar(newUrl)}
                  />
                </div>
              </div>

              {/* Dynamic Views - Rendered Conditionally as Overlay */}
              {currentView === AppView.USER_PROFILE && selectedUserId && (
                <div className="absolute inset-0 z-20 bg-slate-900">
                  <PublicProfileView
                    targetUserId={selectedUserId}
                    onBack={() => setCurrentView(AppView.DISCOVERY)}
                    onConsumeCoins={consumeCoins}
                    userStats={userStats}
                  />
                </div>
              )}
            </div>
          </main>

          <Navigation
            currentView={currentView}
            onNavigate={handleNavigate}
            unreadConversationsCount={userStats?.unreadConversationsCount}
          />   <PremiumModal isOpen={isPremiumModalOpen} onClose={closePremium} />
          <StoreModal isOpen={isStoreModalOpen} onClose={closeStore} onPurchase={addCoins} />
        </>
      )}
    </div>
  );
};

export default App;
