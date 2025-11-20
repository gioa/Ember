import React from 'react';

interface CandleProps {
  className?: string;
  isLit?: boolean;
}

export const Candle: React.FC<CandleProps> = ({ className = "", isLit = true }) => {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Flame - Only visible if lit */}
      <div className={`relative transition-opacity duration-700 ${isLit ? 'opacity-100' : 'opacity-0'}`}>
        {/* Outer glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-orange-500/20 rounded-full blur-xl flame-flicker"></div>
        {/* Inner flame */}
        <div className="w-4 h-12 bg-gradient-to-t from-orange-600 via-orange-400 to-yellow-200 rounded-full rounded-t-[50%] shadow-[0_0_20px_rgba(255,165,0,0.6)] flame-flicker origin-bottom"></div>
        {/* Wick */}
        <div className="w-1 h-3 bg-black/50 mx-auto -mt-1"></div>
      </div>
      
      {/* Candle Body */}
      <div className="w-16 h-32 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-t-md shadow-inner relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-4 bg-stone-100/50 rounded-full blur-sm"></div>
        <div className="absolute top-8 right-2 w-full h-full bg-gradient-to-l from-stone-300/20 to-transparent"></div>
      </div>
      
      {/* Candle Holder/Base */}
      <div className="w-24 h-4 bg-stone-800 rounded-full -mt-1 shadow-lg"></div>
    </div>
  );
};