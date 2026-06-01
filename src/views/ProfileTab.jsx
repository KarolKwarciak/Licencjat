import React from 'react'

export default function ProfileTab({
  isEditingName,
  editNameValue,
  setEditNameValue,
  handleUpdateName,
  setIsEditingName,
  displayName,
  session,
  toggleTheme,
  isDarkMode,
  userHeight,
  handleHeightChange,
  bmi,
  bmiColor,
  bmiCategory,
  markerPos,
  measurements,
  setShowMeasurementHistory,
  setShowMeasurementModal,
  workoutHistory,
  totalVolume,
  streaks,
  totalSets,
  weeklyActivity,
  getStreakColorClass,
  showConfirmationModal,
  supabase
}) {
  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col gap-2 transition-colors duration-300 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest relative z-10">Zalogowano jako</span>
        {isEditingName ? (
          <div className="flex gap-2 items-center mt-1 relative z-20">
            <input type="text" value={editNameValue} onChange={e => setEditNameValue(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold shadow-inner" autoFocus />
            <button onClick={handleUpdateName} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer relative z-20">Zapisz</button>
            <button onClick={() => setIsEditingName(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-sm cursor-pointer relative z-20">Anuluj</button>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-1 relative z-20">
            <span className="text-2xl font-black text-gray-900 dark:text-white truncate tracking-tight">{displayName}</span>
            <button onClick={() => { setEditNameValue(displayName); setIsEditingName(true); }} className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative z-20">Edytuj</button>
          </div>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 relative z-10 font-medium">{session?.user?.email}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors duration-300">
        <div><h2 className="font-extrabold text-gray-800 dark:text-gray-100 mb-0.5">Motyw aplikacji</h2><p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Jasny lub Ciemny</p></div>
        <button onClick={toggleTheme} className={`relative w-16 h-8 rounded-full flex items-center p-1 transition-colors duration-300 shadow-inner border border-gray-200 dark:border-gray-700 cursor-pointer ${isDarkMode ? 'bg-indigo-600 border-indigo-500' : 'bg-blue-100 border-blue-200'}`}>
          <div className="absolute w-full left-0 flex justify-between px-2 text-[11px] pointer-events-none z-0 select-none"><span>🌙</span><span>☀️</span></div>
          <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <h2 className="font-extrabold text-gray-800 dark:text-gray-100">Kalkulator BMI</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Wzrost:</span>
              <input type="text" inputMode="numeric" value={userHeight} onChange={(e) => handleHeightChange(e.target.value.replace(/[^0-9]/g, ''))} className="w-16 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 shadow-inner" placeholder="cm" />
            </div>
        </div>
        {bmi ? (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-end mb-1"><span className={`text-4xl font-black tracking-tighter ${bmiColor}`}>{bmi}</span><span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-sm ${bmiColor}`}>{bmiCategory}</span></div>
              <div className="relative w-full h-5 mt-3 mb-1">
                <div className="absolute inset-y-1 left-0 right-0 rounded-full shadow-inner" style={{ background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 17.5%, #22c55e 17.5%, #22c55e 50%, #eab308 50%, #eab308 75%, #ef4444 75%, #ef4444 100%)' }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-gray-900 dark:border-white dark:bg-gray-800 rounded-full shadow-md transition-all duration-700 ease-out" style={{ left: `calc(${markerPos}% - 10px)` }}></div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase mt-1"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>35+</span></div>
            </div>
        ) : (
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 font-medium">Wpisz swój wzrost i dodaj wagę w "Pomiarach".</div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-extrabold text-gray-800 dark:text-gray-100">Moje Pomiary</h2>
          <div className="flex gap-2">
            {measurements.length > 0 && <button onClick={() => setShowMeasurementHistory(true)} className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all px-3 py-1.5 rounded-xl hover:-translate-y-0.5 cursor-pointer">Historia 📈</button>}
            <button onClick={() => setShowMeasurementModal(true)} className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer">+ Dodaj</button>
          </div>
        </div>
        {measurements.length === 0 ? (
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2 font-medium">Brak pomiarów. Dodaj je, aby śledzić progres!</div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 p-4 rounded-xl transition-colors">
              <span className="text-gray-400 dark:text-gray-500 font-black text-[9px] uppercase tracking-widest mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">Ostatni pomiar • {measurements[0].date}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-2 font-bold text-gray-800 dark:text-gray-200 text-sm mt-1">
                {measurements[0].weight && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-xs">Waga: <span className="text-blue-600 dark:text-blue-400">{measurements[0].weight} kg</span></span>}
                {measurements[0].waist && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-xs">Pas: <span className="text-green-600 dark:text-green-400">{measurements[0].waist} cm</span></span>}
                {measurements[0].biceps && <span className="bg-white dark:bg-gray-800 px-2.5 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-xs">Biceps: <span className="text-red-500 dark:text-red-400">{measurements[0].biceps} cm</span></span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4">Statystyki ogólne</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">TRENINGI</p><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{workoutHistory.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
            <p className="text-[9px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest mb-1">TONAŻ (KG)</p><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalVolume}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
            <p className="text-[9px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest mb-1">AKTUALNA SERIA</p><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.current} dni</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
            <p className="text-[9px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest mb-1">REKORD SERII</p><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.longest} dni</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center col-span-2 border border-gray-100 dark:border-gray-700">
            <p className="text-[9px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest mb-1">UKOŃCZONE SERIE</p><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalSets}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <h2 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4">Ten tydzień</h2>
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
          {weeklyActivity.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 border ${day.hasWorkout ? 'border-transparent shadow-sm' : 'border-gray-200 dark:border-gray-700'} ${getStreakColorClass(day.streak, day.isToday, day.hasWorkout)}`}>
                {day.hasWorkout ? (day.streak >= 3 ? '🔥' : '✓') : ''}
              </div>
              <span className={`text-[10px] uppercase tracking-wider transition-colors ${day.isToday ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-gray-400 dark:text-gray-500 font-bold'}`}>{day.dayName}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { showConfirmationModal('Czy na pewno chcesz się wylogować?', () => { supabase.auth.signOut() }); }} className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 font-bold py-3.5 rounded-2xl active:scale-95 transition-all text-sm cursor-pointer mb-8 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10">Wyloguj się</button>

    </div>
  )
}