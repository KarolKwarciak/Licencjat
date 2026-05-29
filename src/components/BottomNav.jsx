export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 flex justify-evenly items-center py-3 z-50 pb-6">
      
      <button
        onClick={() => setActiveTab('history')}
        className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center w-12 h-12 active:scale-95 ${activeTab === 'history' ? 'bg-blue-500/10 scale-110' : 'opacity-60 hover:opacity-100'}`}
      >
        <span className="text-xl">📋</span>
      </button>

      <div className="w-px h-6 bg-gray-300/60 dark:bg-gray-700/60"></div>

      <button
        onClick={() => {
          setActiveTab('exercises');
        }}
        className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center w-12 h-12 active:scale-95 ${activeTab === 'exercises' ? 'bg-blue-500/10 scale-110' : 'opacity-60 hover:opacity-100'}`}
      >
        <span className="text-xl">🏋️‍♂️</span>
      </button>

      <div className="w-px h-6 bg-gray-300/60 dark:bg-gray-700/60"></div>

      <button
        onClick={() => setActiveTab('workout')}
        className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center w-12 h-12 active:scale-95 ${activeTab === 'workout' ? 'bg-blue-500/10 scale-110' : 'opacity-60 hover:opacity-100'}`}
      >
        <span className="text-xl">💪</span>
      </button>

      <div className="w-px h-6 bg-gray-300/60 dark:bg-gray-700/60"></div>

      <button
        onClick={() => setActiveTab('calendar')}
        className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center w-12 h-12 active:scale-95 ${activeTab === 'calendar' ? 'bg-blue-500/10 scale-110' : 'opacity-60 hover:opacity-100'}`}
      >
        <span className="text-xl">📆</span>
      </button>

      <div className="w-px h-6 bg-gray-300/60 dark:bg-gray-700/60"></div>

      <button
        onClick={() => setActiveTab('profile')}
        className={`p-2 rounded-2xl transition-all duration-300 flex items-center justify-center w-12 h-12 active:scale-95 ${activeTab === 'profile' ? 'bg-blue-500/10 scale-110' : 'opacity-60 hover:opacity-100'}`}
      >
        <span className="text-xl">👤</span>
      </button>

    </nav>
  )
}