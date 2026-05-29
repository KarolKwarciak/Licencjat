export default function RestTimer({ timeLeft, setTimeLeft, setTimerActive, formatTime }) {
  return (
    <div className="absolute bottom-0 w-full bg-blue-600 p-4 z-30 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.2)] animate-slide-up">
      <div className="flex flex-col text-white">
        <span className="text-xs font-medium opacity-80">Czas odpoczynku</span>
        <span className="text-3xl font-bold">{formatTime(timeLeft)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setTimeLeft(prev => Math.max(0, prev - 30))} 
          className="bg-blue-500 text-white w-10 h-10 rounded-full font-bold flex items-center justify-center hover:bg-blue-400"
        >
          -30
        </button>
        <button 
          onClick={() => setTimeLeft(prev => prev + 30)} 
          className="bg-blue-500 text-white w-10 h-10 rounded-full font-bold flex items-center justify-center hover:bg-blue-400"
        >
          +30
        </button>
        <button 
          onClick={() => setTimerActive(false)} 
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold ml-2 shadow-sm"
        >
          Pomiń
        </button>
      </div>
    </div>
  )
}