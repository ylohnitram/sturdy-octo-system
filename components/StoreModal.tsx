
import React, { useState } from 'react';
import { X, Coins, CreditCard, Star, Zap, Shield } from 'lucide-react';
import { Button } from './Button';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number) => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<'coins' | 'gold'>('coins');

  if (!isOpen) return null;

  const coinPackages = [
    { amount: 50, price: '49 Kč', label: 'Starter', bonus: null },
    { amount: 150, price: '129 Kč', label: 'Popular', bonus: '+10 zdarma' },
    { amount: 500, price: '399 Kč', label: 'Whale', bonus: '+100 zdarma' },
  ];

  const goldFeatures = [
    { icon: Star, text: 'Neomezené AI Swipes' },
    { icon: Zap, text: 'Prioritní zobrazení profilu' },
    { icon: Shield, text: 'Anonymní Ghost Mode' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
                Notch <span className="text-red-500">Store</span>
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-800/50">
            <button 
                onClick={() => setActiveTab('coins')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'coins' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
            >
                <Coins size={16} className={activeTab === 'coins' ? 'text-yellow-500' : ''} /> Coins
            </button>
            <button 
                onClick={() => setActiveTab('gold')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'gold' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
            >
                <Star size={16} className={activeTab === 'gold' ? 'text-yellow-500' : ''} /> Notch Gold
            </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'coins' ? (
                <div className="space-y-4">
                    <div className="text-center mb-6">
                        <p className="text-slate-400 text-sm">Kup si coiny na odemykání galerií a boost profilu.</p>
                    </div>
                    
                    {coinPackages.map((pkg, i) => (
                        <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:border-yellow-500/50 transition-colors cursor-pointer group"
                             onClick={() => onPurchase(pkg.amount)}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                                    <Coins size={24} />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">{pkg.amount} Coins</div>
                                    {pkg.bonus && <div className="text-[10px] font-bold text-green-400 uppercase">{pkg.bonus}</div>}
                                </div>
                            </div>
                            <Button size="sm" className="bg-slate-700 hover:bg-yellow-500 hover:text-black transition-colors">
                                {pkg.price}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
                        <Star size={40} className="text-white" fill="currentColor" />
                    </div>
                    
                    <div>
                        <h3 className="text-2xl font-black text-white">Notch Gold</h3>
                        <p className="text-slate-400 text-sm mt-1">Vládni žebříčkům.</p>
                    </div>

                    <div className="space-y-3 text-left bg-slate-800/50 p-4 rounded-xl">
                        {goldFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                                <f.icon size={16} className="text-yellow-500" />
                                {f.text}
                            </div>
                        ))}
                    </div>

                    <Button fullWidth size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400">
                        Aktivovat za 199 Kč / měs
                    </Button>
                </div>
            )}
        </div>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
             <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
                <CreditCard size={10} /> Platba probíhá bezpečně přes Stripe
             </p>
        </div>
      </div>
    </div>
  );
};