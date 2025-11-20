
import React, { useState } from 'react';
import { Unlock } from 'lucide-react';

interface CamoModeProps {
  isActive: boolean;
  onDeactivate: () => void;
}

export const CamoMode: React.FC<CamoModeProps> = ({ isActive, onDeactivate }) => {
  const [display, setDisplay] = useState('0');
  
  if (!isActive) return null;

  const handlePress = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
    } else if (val === '=') {
        // Secret code to unlock: 6969
      if (display === '6969') {
        onDeactivate();
        setDisplay('0');
      } else {
        // Random math result just to be a real calculator
        try {
            // eslint-disable-next-line no-eval
            setDisplay(String(eval(display))); 
        } catch (e) {
            setDisplay('Error');
        }
      }
    } else {
      setDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  const buttons = [
    'C', '(', ')', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '=',
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 text-white flex flex-col font-mono">
        {/* Fake Status Bar Header */}
        <div className="bg-gray-800 p-4 text-center text-sm text-gray-400">
            Notch Financial Calc v2.1
        </div>

        {/* Display */}
        <div className="flex-grow bg-gray-100 flex items-end justify-end p-6">
            <div className="text-6xl text-gray-800 font-light truncate">{display}</div>
        </div>

        {/* Keypad */}
        <div className="bg-gray-900 p-4 grid grid-cols-4 gap-4">
            {buttons.map((btn) => (
                <button
                    key={btn}
                    onClick={() => handlePress(btn)}
                    className={`
                        aspect-square rounded-full text-2xl font-bold flex items-center justify-center transition-opacity active:opacity-70
                        ${btn === '=' ? 'bg-orange-500 text-white col-span-2 aspect-auto rounded-2xl' : ''}
                        ${['/', '*', '-', '+', 'C'].includes(btn) ? 'bg-gray-700 text-orange-400' : 'bg-gray-800 text-white'}
                        ${btn === '0' ? 'col-span-2 aspect-auto rounded-2xl justify-start pl-8' : ''}
                    `}
                >
                    {btn}
                </button>
            ))}
        </div>
        
        <div className="text-center p-4 text-gray-600 text-xs">
            <p>Secure Financial Vault. Enter code to unlock.</p>
        </div>
    </div>
  );
};
