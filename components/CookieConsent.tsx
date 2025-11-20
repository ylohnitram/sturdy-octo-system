import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from './Button';
import { initGA } from '../services/analyticsService';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
        const consent = localStorage.getItem('notch_cookie_consent');
        if (!consent) {
          setIsVisible(true);
        } else if (consent === 'true') {
          // Init GA4 if already consented (Replace ID with yours!)
          initGA('G-XXXXXXXXXX');
        }
    };
    
    checkConsent();

    // Listen for reset event to show banner again without reloading
    const handleReset = () => {
        setIsVisible(true);
    };
    window.addEventListener('notch_reset_cookies', handleReset);
    
    return () => window.removeEventListener('notch_reset_cookies', handleReset);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('notch_cookie_consent', 'true');
    setIsVisible(false);
    initGA('G-XXXXXXXXXX'); // Start tracking immediately
  };

  const handleDecline = () => {
    // If user declines, we do NOT save 'false'. We just hide it for this session.
    // Next time they load the app, localStorage will be empty, and it will ask again.
    localStorage.removeItem('notch_cookie_consent');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl animate-in slide-in-from-bottom">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-slate-800 rounded-lg text-yellow-500 hidden sm:block shrink-0">
                <Cookie size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <span className="sm:hidden text-yellow-500"><Cookie size={16}/></span>
                    Používáme Cookies 🍪
                </h4>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed text-wrap break-words">
                    Aby Notch fungoval správně, pamatoval si tvé přihlášení a mohli jsme vylepšovat loviště, používáme soubory cookies. Používáním aplikace s tím souhlasíš.
                </p>
            </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <Button variant="secondary" size="sm" onClick={handleDecline} className="flex-1 sm:flex-none">
                Odmítnout
            </Button>
            <Button variant="primary" size="sm" onClick={handleAccept} className="flex-1 sm:flex-none">
                Přijmout vše
            </Button>
        </div>
      </div>
    </div>
  );
};