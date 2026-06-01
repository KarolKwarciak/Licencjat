import React from 'react'

export default function RestTimer({ timeLeft, setTimeLeft, setTimerActive, formatTime, variant = 'inline', adjustTimer }) {
  const handleClose = () => {
    setTimerActive(false);
  };

  if (variant === 'inline') {
    return (
      <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-3 flex flex-col gap-2 relative overflow-hidden shadow-md">
        {/* Subtelny błysk w tle jak w dolnym widgecie */}
        <div className="absolute inset-0 bg-white/5 w-1/2 skew-x-12 -translate-x-full animate-[shimmer_3s_infinite]"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            <span className="animate-pulse">⏳</span> Przerwa
          </span>
          <button onClick={handleClose} className="text-blue-200 hover:text-white font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-colors">✕</button>
        </div>
        
        <div className="flex items-center justify-between gap-4 relative z-10 px-2">
          <button onClick={() => adjustTimer && adjustTimer(-30)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white shadow-sm border border-white/10 font-black active:scale-95 transition-all cursor-pointer">
            -30
          </button>
          
          <div className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">
            {formatTime(timeLeft)}
          </div>
          
          <button onClick={() => adjustTimer && adjustTimer(30)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white shadow-sm border border-white/10 font-black active:scale-95 transition-all cursor-pointer">
            +30
          </button>
        </div>
      </div>
    );
  }

  return null;
}