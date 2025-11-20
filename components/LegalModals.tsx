
import React from 'react';
import { X, Shield, Scale, Cookie } from 'lucide-react';

interface LegalModalProps {
  type: 'tos' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {type === 'tos' ? <Scale className="text-red-500" size={20}/> : <Shield className="text-red-500" size={20}/>}
            {type === 'tos' ? 'Podmínky použití' : 'Ochrana soukromí'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-slate-300 text-sm space-y-4 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          {type === 'tos' ? (
            <>
              <p><strong>1. Přijetí podmínek</strong><br/>Vstupem do aplikace Notch potvrzujete, že je vám více než 18 let. Tato aplikace je určena pouze pro dospělé osoby.</p>
              <p><strong>2. Chování uživatelů</strong><br/>Notch je soutěžní platforma. Obtěžování, stalking nebo nahrávání nezákonného obsahu je přísně zakázáno a vede k okamžitému zrušení účtu.</p>
              <p><strong>3. Virtuální měna</strong><br/>Coins a Předplatné jsou virtuální statky bez reálné peněžní hodnoty. Jsou nevratné.</p>
              <p><strong>4. Vyloučení odpovědnosti</strong><br/>Aplikaci používáte na vlastní nebezpečí. Provozovatel nenese odpovědnost za schůzky sjednané prostřednictvím aplikace.</p>
            </>
          ) : (
            <>
              <p><strong>1. Sběr dat</strong><br/>Shromažďujeme pouze údaje nezbytné pro fungování hry: e-mail, uživatelské jméno, nahrané fotografie a herní statistiky.</p>
              <p><strong>2. Fotografie</strong><br/>Vaše fotografie jsou uloženy v zabezpečeném úložišti. Soukromé galerie jsou přístupné pouze po odemčení jiným uživatelem.</p>
              <p><strong>3. Cookies a Analytika</strong><br/>Používáme soubory cookies pro zapamatování přihlášení a nástroje (např. Google Analytics) pro analýzu návštěvnosti. Tyto nástroje nám pomáhají zlepšovat aplikaci a jsou spouštěny pouze s vaším souhlasem.</p>
              <p><strong>4. Právo na výmaz</strong><br/>Svůj účet a veškerá data můžete kdykoliv smazat v nastavení profilu.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-right bg-slate-900/95 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors"
          >
            Rozumím
          </button>
        </div>
      </div>
    </div>
  );
};
