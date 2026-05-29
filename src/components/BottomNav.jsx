export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="absolute bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-evenly items-center py-3 z-10 pb-8 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-300">
      
      <button
        onClick={() => setActiveTab('history')}
        className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center w-16 h-16 cursor-pointer ${activeTab === 'history' ? 'bg-blue-50 dark:bg-blue-900/40 scale-125 shadow-sm opacity-100 grayscale-0' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 hover:opacity-100 hover:grayscale-0 grayscale opacity-60'}`}
      >
        {/* ZMIENIONA IKONKA HISTORII */}
        <span className="text-3xl">📋</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

      <button
        onClick={() => setActiveTab('workout')}
        className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center w-16 h-16 cursor-pointer ${activeTab === 'workout' ? 'bg-blue-50 dark:bg-blue-900/40 scale-125 shadow-sm opacity-100 grayscale-0' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 hover:opacity-100 hover:grayscale-0 grayscale opacity-60'}`}
      >
        <span className="text-3xl">💪</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

      <button
        onClick={() => setActiveTab('calendar')}
        className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center w-16 h-16 cursor-pointer ${activeTab === 'calendar' ? 'bg-blue-50 dark:bg-blue-900/40 scale-125 shadow-sm opacity-100 grayscale-0' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 hover:opacity-100 hover:grayscale-0 grayscale opacity-60'}`}
      >
        {/* IKONKA KALENDARZA POZOSTAJE BEZ ZMIAN */}
        <span className="text-3xl">📆</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

      <button
        onClick={() => setActiveTab('profile')}
        className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center w-16 h-16 cursor-pointer ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/40 scale-125 shadow-sm opacity-100 grayscale-0' : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110 hover:opacity-100 hover:grayscale-0 grayscale opacity-60'}`}
      >
        <span className="text-3xl">👤</span>
      </button>

    </nav>
  )
}