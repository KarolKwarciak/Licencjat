export default function RestTimer({ timeLeft, setTimeLeft, setTimerActive, formatTime }) {
  return (
    <div className="absolute bottom-0 w-full bg-blue-600 dark:bg-blue-800 p-5 z-30 flex flex-col shadow-[0_-10px_25px_rgba(0,0,0,0.25)] animate-slide-up rounded-t-3xl border-t border-blue-500 dark:border-blue-700 transition-colors duration-300">
      
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-white">
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
            Odpoczynek
          </span>
          <span className="text-4xl font-black drop-shadow-sm">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTimeLeft(prev => Math.max(0, prev - 30))} 
            className="bg-blue-500 dark:bg-blue-700 text-white w-11 h-11 rounded-full font-bold flex items-center justify-center hover:bg-blue-400 active:scale-90 transition-all shadow-sm"
          >
            -30
          </button>
          <button 
            onClick={() => setTimeLeft(prev => prev + 30)} 
            className="bg-blue-500 dark:bg-blue-700 text-white w-11 h-11 rounded-full font-bold flex items-center justify-center hover:bg-blue-400 active:scale-90 transition-all shadow-sm"
          >
            +30
          </button>
          <button 
            onClick={() => setTimerActive(false)} 
            className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-900 px-5 py-2.5 rounded-xl font-bold ml-2 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            Pomiń
          </button>
        </div>
      </div>
      
      {/* Pasek bezpieczeństwa dla iPhone'ów (safe area) */}
      <div className="h-4 w-full"></div>
    </div>
  )
}