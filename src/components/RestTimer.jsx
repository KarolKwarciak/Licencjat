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

  // WERSJA 1: KOMPAKTOWA PIGUŁKA (Wyświetlana poza zakładką Treningu)
  if (variant === 'compact') {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full shadow-2xl p-2 px-4 z-50 flex items-center justify-between animate-fade-in-up">
        
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse">⏳</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight select-none">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button onClick={handleSub30s} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-lg font-black w-9 h-9 rounded-full active:scale-95 transition-all flex items-center justify-center select-none">-</button>
          <button onClick={handleAdd30s} className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-black w-9 h-9 rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center select-none">+</button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button onClick={handleSkip} className="text-red-500 hover:text-red-600 w-8 h-8 flex items-center justify-center active:scale-95 transition-all font-black text-lg">✕</button>
        </div>

      </div>
    )
  }

  // WERSJA 2: INLINE (Wbudowana w kartę ćwiczenia na ekranie Treningu)
  return (
    <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex flex-col gap-3 animate-fade-in-up mt-4 shadow-sm">
      
      {/* Górny pasek */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base animate-pulse">⏳</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest select-none">
            Regeneracja
          </span>
        </div>
        <button 
          onClick={handleSkip}
          className="text-xs font-bold text-red-500 hover:text-red-600 bg-white/50 dark:bg-gray-900/50 px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
        >
          Pomiń
        </button>
      </div>

      {/* Dolny pasek z czasem i przyciskami */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight font-mono select-none">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSub30s}
            className="flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-2xl font-black w-12 h-10 rounded-xl active:scale-95 transition-all cursor-pointer select-none shadow-sm"
          >
            -
          </button>
          <button
            onClick={handleAdd30s}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black w-12 h-10 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer select-none"
          >
            +
          </button>
        </div>
      </div>

    </div>
  )
}