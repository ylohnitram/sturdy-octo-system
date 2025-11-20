
import React, { useState, useRef } from 'react';
import { Camera, ArrowRight, User, Check, Sparkles, Users } from 'lucide-react';
import { uploadAvatar, updateUserBio, saveUserBirthDate, calculateAge, updateUserPreferences } from '../services/userService';
import { generateUserBio } from '../services/geminiService';
import { Button } from './Button';
import { Gender, TargetGender } from '../types';

interface OnboardingWizardProps {
  userId: string;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  
  // Data States
  const [birthDate, setBirthDate] = useState('');
  const [myGender, setMyGender] = useState<Gender | null>(null);
  const [targetGender, setTargetGender] = useState<TargetGender>('both');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // UI States
  const [uploading, setUploading] = useState(false);
  const [generatingBio, setGeneratingBio] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 1: AGE
  const handleAgeSubmit = async () => {
    if (!birthDate) return;
    const age = calculateAge(birthDate);
    if (age < 18) {
        alert('Musí ti být 18+ let pro vstup.');
        return;
    }
    await saveUserBirthDate(userId, birthDate);
    setStep(2);
  };

  // STEP 2: GENDER
  const handleGenderSubmit = async () => {
      if (!myGender) return;
      await updateUserPreferences(userId, myGender, targetGender);
      setStep(3);
  };

  // STEP 3: AVATAR
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const publicUrl = await uploadAvatar(userId, file);
      if (publicUrl) {
          setAvatarUrl(publicUrl);
          setTimeout(() => setStep(4), 1000);
      }
    } catch (error) {
      console.error(error);
      alert('Chyba při nahrávání.');
    } finally {
      setUploading(false);
    }
  };

  // STEP 4: BIO
  const handleAiBio = async () => {
      setGeneratingBio(true);
      const newBio = await generateUserBio('Neznámý', ['Party', 'Seznamování']);
      setBio(newBio);
      setGeneratingBio(false);
  };

  const handleFinish = async () => {
      if (!bio) {
          await updateUserBio(userId, 'Jsem tu nový.');
      } else {
          await updateUserBio(userId, bio);
      }
      onComplete();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col items-center justify-center p-6">
        {/* Progress */}
        <div className="w-full max-w-xs flex gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-red-600' : 'bg-slate-800'}`}></div>
            ))}
        </div>

        <div className="w-full max-w-sm bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl animate-in zoom-in duration-300">
            
            {/* STEP 1: DATE OF BIRTH */}
            {step === 1 && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
                        <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kdy ses narodil?</h2>
                    <p className="text-slate-400 text-sm mb-6">Věk se bude počítat automaticky. Pouze 18+.</p>
                    
                    <input 
                        type="date" 
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-center text-lg font-bold text-white focus:border-red-500 focus:outline-none mb-6 uppercase"
                        autoFocus
                    />

                    <Button fullWidth onClick={handleAgeSubmit} disabled={!birthDate}>
                        Pokračovat <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            )}

            {/* STEP 2: GENDER & PREFERENCE */}
            {step === 2 && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">Kdo jsi?</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={() => setMyGender('male')}
                            className={`p-4 rounded-xl border-2 font-bold transition-all ${myGender === 'male' ? 'border-red-500 bg-red-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                        >
                            Muž
                        </button>
                        <button 
                            onClick={() => setMyGender('female')}
                            className={`p-4 rounded-xl border-2 font-bold transition-all ${myGender === 'female' ? 'border-red-500 bg-red-500/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400'}`}
                        >
                            Žena
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-4">Koho hledáš?</h2>
                    <div className="flex gap-2 mb-8 bg-slate-800 p-1 rounded-xl">
                         {(['women', 'both', 'men'] as const).map(t => (
                             <button
                                key={t}
                                onClick={() => setTargetGender(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${targetGender === t ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
                             >
                                 {t === 'women' ? 'Ženy' : t === 'men' ? 'Muže' : 'Vše'}
                             </button>
                         ))}
                    </div>

                    <Button fullWidth onClick={handleGenderSubmit} disabled={!myGender}>
                        Pokračovat <ArrowRight size={18} className="ml-2" />
                    </Button>
                </div>
            )}

            {/* STEP 3: AVATAR */}
            {step === 3 && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
                        <Camera size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Ukaž se</h2>
                    <p className="text-slate-400 text-sm mb-6">Lovci bez fotky nic neuloví.</p>

                    <div className="relative w-32 h-32 mx-auto mb-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-red-600" alt="Avatar" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center hover:border-red-500 transition-colors">
                                <div className="text-slate-500 text-xs">Nahrát</div>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {avatarUrl && (
                        <Button fullWidth onClick={() => setStep(4)}>
                            Vypadá to skvěle <Check size={18} className="ml-2" />
                        </Button>
                    )}
                    {!avatarUrl && (
                        <button onClick={() => setStep(4)} className="text-slate-500 text-sm hover:text-white">
                            Přeskočit (nedoporučeno)
                        </button>
                    )}
                </div>
            )}

            {/* STEP 4: BIO */}
            {step === 4 && (
                <div className="text-center">
                     <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Kdo jsi?</h2>
                    <p className="text-slate-400 text-sm mb-6">Napiš něco o sobě nebo nech AI, ať to vymyslí.</p>

                    <div className="relative mb-6">
                        <textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Jsem..."
                            className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-red-500 focus:outline-none resize-none"
                        />
                        <button 
                            onClick={handleAiBio}
                            className="absolute bottom-3 right-3 p-2 bg-slate-800 rounded-lg text-red-400 hover:text-white hover:bg-red-600 transition-colors text-xs flex items-center gap-1"
                        >
                           {generatingBio ? '...' : <><Sparkles size={12} /> AI</>}
                        </button>
                    </div>

                    <Button fullWidth onClick={handleFinish}>
                        Dokončit a vstoupit <Check size={18} className="ml-2" />
                    </Button>
                </div>
            )}

        </div>
    </div>
  );
};
