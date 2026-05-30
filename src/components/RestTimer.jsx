import React from 'react'

export default function RestTimer({ timeLeft, setTimeLeft, setTimerActive, formatTime, variant }) {
  
  const handleAdd30s = () => {
    setTimeLeft(prev => prev + 30)
  }

  const handleSub30s = () => {
    setTimeLeft(prev => {
      if (prev <= 30) {
        setTimerActive(false)
        return 0
      }
      return prev - 30
    })
  }

  const handleSkip = () => {
    setTimeLeft(0)
    setTimerActive(false)
  }

  if (variant === 'compact') {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-full shadow-2xl p-2 px-4 z-50 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse text-white">⏳</span>
          <span className="text-xl font-black text-blue-400 font-mono tracking-tight select-none">
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleSub30s} className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-black w-9 h-9 rounded-full active:scale-95 transition-all flex items-center justify-center select-none">-</button>
          <button onClick={handleAdd30s} className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-black w-9 h-9 rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center select-none">+</button>
          <div className="w-px h-5 bg-gray-600 mx-1"></div>
          <button onClick={handleSkip} className="text-red-400 hover:text-red-300 w-8 h-8 flex items-center justify-center active:scale-95 transition-all font-black text-lg">✕</button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 flex flex-col gap-3 mt-3 mb-2 shadow-xl shadow-blue-500/30 animate-fade-in-up border border-blue-500 relative overflow-hidden">
      {/* Dodatkowy błysk tła */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center px-1 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-base animate-pulse text-white">⏳</span>
          <span className="text-[11px] font-black text-blue-100 uppercase tracking-widest select-none drop-shadow-sm">
            Czas regeneracji
          </span>
        </div>
        <button onClick={handleSkip} className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm">
          Pomiń
        </button>
      </div>
      <div className="flex items-center justify-between px-1 relative z-10">
        <div className="text-4xl font-black text-white tracking-tight font-mono select-none drop-shadow-md">
          {formatTime(timeLeft)}
        </div>
        <div className="flex gap-2.5">
          <button onClick={handleSub30s} className="flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-2xl font-black w-12 h-12 rounded-2xl active:scale-95 transition-all cursor-pointer select-none shadow-sm backdrop-blur-sm">-</button>
          <button onClick={handleAdd30s} className="flex items-center justify-center bg-white hover:bg-gray-100 text-blue-600 text-2xl font-black w-12 h-12 rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer select-none">+</button>
        </div>
      </div>
    </div>
  )
}