
import React, { useState, useEffect } from 'react';
import { ChevronRight, Key, Mail, CheckCircle, XCircle, LogIn, Info } from 'lucide-react';
import { validateInviteCode, joinWaitlist } from '../services/invitationService';

interface LandingPageProps {
  onEnter: (initialMode?: 'login' | 'signup') => void;
  initialMessage?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, initialMessage }) => {
  const [viewState, setViewState] = useState<'hero' | 'code' | 'waitlist'>('hero');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for initial message (e.g. from logout)
    if (initialMessage) {
      setViewState('code');
      setInfoMessage(initialMessage);
    }

    // 2. Check for invite code in URL (e.g. from share link)
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      setInviteCode(inviteParam.toUpperCase());
      setViewState('code');
      setInfoMessage('Kód načten z odkazu');
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [initialMessage]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const isValid = await validateInviteCode(inviteCode);
      if (isValid) {
        // Uložíme příznak, že uživatel prošel "branou"
        localStorage.setItem('notch_verified', 'true');
        // DŮLEŽITÉ: Uložíme konkrétní kód pro spárování s účtem při registraci
        localStorage.setItem('notch_invite_code_value', inviteCode.trim().toUpperCase());

        onEnter('signup');
      } else {
        setError('Neplatný kód. Přístup zamítnut.');
      }
    } catch (err) {
      setError('Chyba ověření. Zkontrolujte připojení.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await joinWaitlist(email);
    setIsLoading(false);
    setWaitlistSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-red-500 selection:text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            NOTCH
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onEnter('login')}
              className="text-slate-400 text-sm font-bold hover:text-white transition-colors flex items-center gap-1"
            >
              <LogIn size={16} /> Přihlášení
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 min-h-[90vh] flex flex-col justify-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">

          {viewState === 'hero' && (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-red-400 mb-6 uppercase tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Invite Only • Czech Republic
              </div>

              <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-tight">
                LOV <span className="text-red-600">ZAČÍNÁ.</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Exkluzivní soutěžní komunita. Přístup pouze na pozvánky.
                <br />Máš kód? Ukaž, co v tobě je.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setViewState('code')}
                  className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-xl transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2"
                >
                  MÁM KÓD <ChevronRight size={24} />
                </button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-medium">
                <button onClick={() => onEnter('login')} className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                  Už máš účet? <span className="text-white underline underline-offset-4 decoration-red-500">Přihlásit se</span>
                </button>
                <span className="hidden sm:inline text-slate-700">•</span>
                <button onClick={() => setViewState('waitlist')} className="text-slate-500 hover:text-slate-300">
                  Nemám kód (Waitlist)
                </button>
              </div>
            </div>
          )}

          {viewState === 'code' && (
            <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 fade-in">
              <div className="mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="text-red-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">Zadej přístupový kód</h2>
                <p className="text-slate-400 text-sm mt-2">Aplikace je v uzavřené beta verzi. Pro vstup potřebuješ pozvánku.</p>
              </div>

              {infoMessage && (
                <div className="mb-6 flex items-start justify-center gap-2 text-yellow-400 text-sm font-bold bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="LOV-XXXX-XXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-center text-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 uppercase"
                  autoFocus
                />

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg">
                    <XCircle size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !inviteCode}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Ověřuji...' : 'Odemknout Přístup'}
                </button>
              </form>

              <button onClick={() => setViewState('hero')} className="mt-6 text-slate-500 text-sm hover:text-white">
                Zpět
              </button>
            </div>
          )}

          {viewState === 'waitlist' && (
            <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 fade-in">
              {waitlistSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Jsi na seznamu!</h2>
                  <p className="text-slate-400 mt-2">Jakmile se uvolní místo, pošleme ti kód na e-mail.</p>
                  <button onClick={() => setViewState('hero')} className="mt-8 text-slate-500 text-sm hover:text-white">
                    Zpět na úvod
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="text-slate-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Waitlist</h2>
                    <p className="text-slate-400 text-sm mt-2">Kapacita je momentálně naplněna. Nech nám e-mail.</p>
                  </div>

                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tvoje@email.cz"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      {isLoading ? 'Odesílám...' : 'Chci být informován'}
                    </button>
                  </form>
                  <button onClick={() => setViewState('hero')} className="mt-6 text-slate-500 text-sm hover:text-white">
                    Zpět
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <section className="py-12 bg-slate-950 border-t border-slate-900 text-center px-6">
        <div className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Notch App. Pouze 18+. Vytvořeno v Praze.
        </div>
      </section>
    </div>
  );
};
