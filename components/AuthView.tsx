
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { checkUsernameAvailability } from '../services/userService';
import { Button } from './Button';
import { LegalModals } from './LegalModals';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle, RefreshCw, AlertTriangle, ArrowLeft, Loader2, XCircle } from 'lucide-react';

interface AuthViewProps {
  onLogin: () => void;
  initialView?: 'login' | 'signup';
  onBackToLanding?: (message?: string) => void;
}

type ViewState = 'login' | 'signup' | 'forgot_password';
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, initialView = 'signup', onBackToLanding }) => {
  const [viewState, setViewState] = useState<ViewState>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');

  // Username Validation State
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  // Checkboxes states
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const [isLegalConfirmed, setIsLegalConfirmed] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLegalModal, setShowLegalModal] = useState<'tos' | 'privacy' | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Update viewState if prop changes
  useEffect(() => {
    setViewState(initialView);
  }, [initialView]);

  // Real-time Username Check (Debounced)
  useEffect(() => {
    if (viewState !== 'signup' || !username) {
      setUsernameStatus('idle');
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkUsernameAvailability(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
      } catch (e) {
        console.error(e);
        setUsernameStatus('error');
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [username, viewState]);

  // Validations
  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const isUsernameValid = usernameStatus === 'available';
  const isFormValid = viewState !== 'signup' || (isAgeConfirmed && isLegalConfirmed && isUsernameValid && passwordsMatch && password.length >= 6);

  // Helper function to explain why button is disabled
  const getValidationMessage = () => {
    if (viewState !== 'signup') return null;
    if (usernameStatus === 'checking') return 'Ověřuji přezdívku...';
    if (usernameStatus === 'taken') return 'Přezdívka je zabraná.';
    if (username.length > 0 && username.length < 3) return 'Přezdívka je příliš krátká.';
    if (!passwordsMatch) return 'Hesla se neshodují.';
    if (password.length > 0 && password.length < 6) return 'Heslo musí mít min. 6 znaků.';
    if (!isAgeConfirmed) return 'Musíte potvrdit věk 18+.';
    if (!isLegalConfirmed) return 'Musíte souhlasit s podmínkami.';
    return null;
  };

  // KOMPLEXNÍ PŘEKLADAČ CHYB SUPABASE
  const translateError = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('security purposes') || m.includes('rate limit')) return 'Příliš mnoho pokusů. Z bezpečnostních důvodů počkejte cca 1 minutu.';
    if (m.includes('user already registered') || m.includes('already exists')) return 'Tento email už je zaregistrovaný. Přepněte na přihlášení.';
    if (m.includes('password should be')) return 'Heslo je příliš krátké (musí mít alespoň 6 znaků).';
    if (m.includes('invalid login credentials')) return 'Špatný email nebo heslo.';
    if (m.includes('email not confirmed')) return 'E-mail ještě nebyl potvrzen. Zkontrolujte prosím schránku (i SPAM).';
    if (m.includes('email not confirmed')) return 'E-mail ještě nebyl potvrzen. Zkontrolujte prosím schránku (i SPAM).';
    if (m.includes('network request failed') || m.includes('failed to fetch')) return 'Chyba připojení k databázi. Pravděpodobně chybí konfigurace (Environment Variables) na Vercelu.';
    if (m.includes('valid email')) return 'Zadejte platný formát e-mailu.';
    if (m.includes('invite code')) return 'Neplatný nebo již použitý pozvánkový kód.';

    // Fallback
    return `Nastala chyba: ${msg}`;
  };

  // Polling for auto-login after manual verification
  useEffect(() => {
    if (!awaitingConfirmation) return;

    const interval = setInterval(async () => {
      // Try to sign in silently or check session
      // Since we can't check "isVerified" easily without logging in, 
      // we try to login with the credentials if we have them, or rely on user action.
      // Note: Storing password in state is risky, but for UX during wait it helps.
      // Better approach: Just check if session exists now.

      // If the user clicked the link in another tab, this tab might not know instantly.
      // But if we did the SQL update, we can try to re-authenticate.
    }, 3000);

    return () => clearInterval(interval);
  }, [awaitingConfirmation]);

  const handleSwitchMode = () => {
    setError(null);
    setSuccessMessage(null);

    if (viewState === 'login') {
      // Uživatel chce jít z Loginu na Registraci.
      // MUSÍME OVĚŘIT, ZDA MÁ KÓD (uložený v localStorage z LandingPage)
      const isVerified = localStorage.getItem('notch_verified') === 'true';

      if (!isVerified) {
        // Nemá kód -> Vykopnout zpět na Landing Page (Zadání kódu)
        if (onBackToLanding) {
          onBackToLanding('Pro registraci je nutný pozvánkový kód.');
        } else {
          alert('Pro registraci je nutný pozvánkový kód.');
          window.location.reload();
        }
        return;
      }
      setViewState('signup');
    } else {
      // Z registrace na login může jít kdokoliv
      setViewState('login');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewState === 'signup' && !isFormValid) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (viewState === 'signup') {
        // 0. Validace hesel
        if (password !== confirmPassword) {
          throw new Error('Hesla se neshodují.');
        }

        // 1. Bezpečnostní pojistka: Má opravdu kód?
        const inviteCode = localStorage.getItem('notch_invite_code_value');
        if (!inviteCode || localStorage.getItem('notch_verified') !== 'true') {
          if (onBackToLanding) setTimeout(() => onBackToLanding('Chybí kód.'), 1000);
          throw new Error('Chybí ověření pozvánkového kódu.');
        }

        // 2. Kontrola unikátní přezdívky (Double check před odesláním)
        if (usernameStatus === 'taken') {
          throw new Error(`Přezdívka "${username}" je už zabraná. Zkus jinou.`);
        }

        // 3. Registrace
        // DŮLEŽITÉ: emailRedirectTo zajišťuje, že se uživatel vrátí SEM, ne na localhost
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              invite_code: inviteCode // Kód putuje do metadat, kde ho zachytí trigger
            },
            emailRedirectTo: window.location.origin
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setAwaitingConfirmation(true);
        } else {
          onLogin();
        }

      } else if (viewState === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();

      } else if (viewState === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMessage('Odkaz pro obnovu hesla byl odeslán na tvůj e-mail.');
      }

    } catch (err: any) {
      setError(translateError(err.message || 'Nastala neočekávaná chyba.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResendStatus('sending');
    setError(null);

    try {
      // Zde taky musíme vynutit Redirect URL, jinak Supabase použije default (localhost)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      setResendStatus('sent');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendStatus('idle');
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e: any) {
      console.error(e);
      setResendStatus('error');
      // Zobrazíme chybu přímo v UI
      alert(translateError(e.message || 'Nepodařilo se odeslat email.'));
    }
  };

  // Obrazovka "Jdi do mailu"
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center animate-in zoom-in duration-300 shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-red-500/30">
            <Mail size={36} />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Zkontroluj si e-mail</h2>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Poslali jsme ti potvrzovací odkaz na:<br />
            <span className="text-white font-bold text-lg">{email}</span>
          </p>

          <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30 text-sm text-yellow-200 mb-6 text-left flex items-start gap-3">
            <AlertTriangle className="shrink-0 text-yellow-500" size={20} />
            <div>
              <strong className="block text-yellow-500 mb-1">Nevidíš ho?</strong>
              Na 99% spadl do složky <strong>SPAM</strong> nebo <strong>Hromadné</strong>. Přesuň ho do doručené pošty, ať ti fungují i další notifikace.
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resendStatus === 'sending'}
              variant="secondary"
              fullWidth
              className={`
                            ${resendStatus === 'sent' ? 'bg-green-600/20 text-green-400 border-green-600/50' : 'bg-slate-800 hover:bg-slate-700'}
                        `}
            >
              {resendStatus === 'sending' ? 'Odesílám...' :
                resendStatus === 'sent' ? `Odesláno! Další pokus za ${resendCooldown}s` :
                  resendCooldown > 0 ? `Počkej ${resendCooldown}s` :
                    'Znovu odeslat e-mail'}
            </Button>

            <button
              onClick={() => setAwaitingConfirmation(false)}
              className="text-sm text-slate-500 hover:text-white flex items-center justify-center gap-1 w-full py-2"
            >
              <RefreshCw size={14} /> Změnit e-mail (překlep?)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <LegalModals type={showLegalModal} onClose={() => setShowLegalModal(null)} />

      {/* Background FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            NOTCH <span className="text-red-600">ID</span>
          </h1>
          <p className="text-slate-400">
            {viewState === 'signup' ? 'Vytvoř si identitu lovce.' :
              viewState === 'login' ? 'Vítej zpět.' :
                'Obnova přístupu.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex items-start gap-2 animate-pulse">
              <AlertCircle size={16} className="mt-0.5 min-w-[16px]" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 min-w-[16px]" />
              <span>{successMessage}</span>
            </div>
          )}

          {viewState === 'signup' && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Přezdívka"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-slate-950 border rounded-xl py-3.5 pl-12 pr-10 text-white placeholder-slate-600 focus:outline-none transition-colors ${usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                    usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' :
                      'border-slate-700 focus:border-red-500'
                  }`}
                required
              />
              {/* Username Status Indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {usernameStatus === 'checking' && <Loader2 className="animate-spin text-slate-500" size={18} />}
                {usernameStatus === 'available' && <CheckCircle className="text-green-500" size={18} />}
                {usernameStatus === 'taken' && <XCircle className="text-red-500" size={18} />}
              </div>

              {/* Username Status Text - PRO LEPŠÍ UX */}
              <div className="absolute top-full left-0 mt-1 text-[10px] pl-4">
                {usernameStatus === 'checking' && <span className="text-slate-500">Ověřuji dostupnost...</span>}
                {usernameStatus === 'available' && <span className="text-green-500 font-bold">Přezdívka je volná</span>}
                {usernameStatus === 'taken' && <span className="text-red-500 font-bold">Přezdívka je již obsazená</span>}
              </div>
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>

          {viewState !== 'forgot_password' && (
            <>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                <input
                  type="password"
                  placeholder="Heslo (min. 6 znaků)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>
              {viewState === 'signup' && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                  <input
                    type="password"
                    placeholder="Potvrzení hesla"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none transition-colors ${confirmPassword && !passwordsMatch ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700 focus:border-red-500'
                      }`}
                    required
                  />
                  {confirmPassword && !passwordsMatch && (
                    <div className="absolute top-full left-0 mt-1 text-[10px] pl-4 text-red-500 font-bold">
                      Hesla se neshodují
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Checkboxes - Only for Sign Up */}
          {viewState === 'signup' && (
            <div className="space-y-3 pt-2 px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center w-5 h-5 rounded border transition-all ${isAgeConfirmed ? 'bg-red-600 border-red-600' : 'bg-slate-950 border-slate-600 group-hover:border-slate-400'}`}>
                  <input type="checkbox" className="hidden" checked={isAgeConfirmed} onChange={(e) => setIsAgeConfirmed(e.target.checked)} />
                  {isAgeConfirmed && <CheckCircle size={14} className="text-white" />}
                </div>
                <span className="text-sm text-slate-300 select-none">Potvrzuji, že mi je <strong className="text-white">18+ let</strong>.</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative flex items-center justify-center w-5 h-5 rounded border transition-all ${isLegalConfirmed ? 'bg-red-600 border-red-600' : 'bg-slate-950 border-slate-600 group-hover:border-slate-400'}`}>
                  <input type="checkbox" className="hidden" checked={isLegalConfirmed} onChange={(e) => setIsLegalConfirmed(e.target.checked)} />
                  {isLegalConfirmed && <CheckCircle size={14} className="text-white" />}
                </div>
                <span className="text-sm text-slate-300 select-none">
                  Souhlasím s <span className="text-red-400 hover:underline" onClick={(e) => { e.preventDefault(); setShowLegalModal('tos') }}>Podmínkami</span> a <span className="text-red-400 hover:underline" onClick={(e) => { e.preventDefault(); setShowLegalModal('privacy') }}>Soukromím</span>.
                </span>
              </label>
            </div>
          )}

          {/* Forgot Password Link */}
          {viewState === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setViewState('forgot_password'); setError(null); setSuccessMessage(null); }}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Zapomněl jsi heslo?
              </button>
            </div>
          )}

          {/* VISUAL FEEDBACK: WHY IS BUTTON DISABLED? */}
          {viewState === 'signup' && !isFormValid && (
            <div className="text-center text-[11px] text-red-400/80 bg-slate-950/50 p-2 rounded-lg border border-red-900/30">
              {getValidationMessage() || 'Vyplňte prosím všechna pole.'}
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            type="submit"
            disabled={loading || (viewState === 'signup' && !isFormValid)}
            className="mt-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {viewState === 'signup' ? 'ZAREGISTROVAT' :
                  viewState === 'login' ? 'PŘIHLÁSIT SE' :
                    'ODESLAT LINK'}
                <ArrowRight size={20} />
              </span>
            )}
          </Button>
        </form>

        <div className="text-center mt-8">
          {viewState === 'forgot_password' ? (
            <button
              onClick={() => { setViewState('login'); setError(null); setSuccessMessage(null); }}
              className="text-slate-500 hover:text-white text-sm font-medium transition-colors p-2 flex items-center justify-center gap-2 w-full"
            >
              <ArrowLeft size={16} /> Zpět na přihlášení
            </button>
          ) : (
            <button
              onClick={handleSwitchMode}
              className="text-slate-500 hover:text-white text-sm font-medium transition-colors p-2"
            >
              {viewState === 'signup' ? 'Už máš účet? Přihlášení' : 'Nemáš účet? Registrace'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
