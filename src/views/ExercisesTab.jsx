import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ExercisesTab({
  selectedExerciseDetail,
  setSelectedExerciseDetail,
  selectedExObject,
  exerciseSubTab,
  setExerciseSubTab,
  detailedChartData,
  isDarkMode,
  maxWeightStr,
  max1RMStr,
  maxVolStr,
  showCreateExercise,
  setShowCreateExercise,
  newExName,
  setNewExName,
  newExTarget,
  setNewExTarget,
  isCreateExFilterOpen,
  setIsCreateExFilterOpen,
  MUSCLE_GROUPS,
  newExDescription,
  setNewExDescription,
  handleCreateExercise,
  searchQuery,
  setSearchQuery,
  isExFilterOpen,
  setIsExFilterOpen,
  selectedMuscleFilter,
  setSelectedMuscleFilter,
  filteredExercises,
  addExercise
}) {

  if (selectedExerciseDetail) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <button onClick={() => setSelectedExerciseDetail(null)} className="self-start text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <span className="text-base leading-none">←</span> Wróć do bazy
        </button>
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{selectedExObject?.name || 'Nieznane ćwiczenie'}</h2>
          {selectedExObject && (
            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg uppercase border border-indigo-100 dark:border-indigo-800/50 shadow-sm tracking-wider">{selectedExObject.target}</span>
          )}
        </div>
        <div className="flex bg-gray-200/60 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
          <button onClick={() => setExerciseSubTab('opis')} className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all cursor-pointer ${exerciseSubTab === 'opis' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Opis</button>
          <button onClick={() => setExerciseSubTab('progresja')} className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all cursor-pointer ${exerciseSubTab === 'progresja' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Wykres</button>
          <button onClick={() => setExerciseSubTab('rekordy')} className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all cursor-pointer ${exerciseSubTab === 'rekordy' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>Rekordy</button>
        </div>

        {exerciseSubTab === 'opis' ? (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up flex flex-col gap-4">
            <h3 className="font-bold text-gray-800 dark:text-white text-sm">Jak prawidłowo wykonywać:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {selectedExObject?.description ? selectedExObject.description : `Systematyczne wykonywanie tego ćwiczenia skutecznie stymuluje i rozwija partię: ${selectedExObject?.target}. Aby uzyskać optymalne efekty i uniknąć kontuzji, zadbaj o pełny zakres ruchu (ROM), kontrolowaną fazę ekscentryczną oraz stałe napięcie mięśniowe.`}
            </p>
          </div>
        ) : exerciseSubTab === 'progresja' ? (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">Szacowane Maksimum (1RM)</h3>
            {detailedChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280', fontWeight: 'bold' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid ' + (isDarkMode ? '#374151' : '#e5e7eb'), boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#111827' }}
                      labelStyle={{ fontWeight: '900', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      formatter={(value) => [`${value} kg`, 'Szacowane 1RM']}
                    />
                    <Line 
                      type="linear" 
                      dataKey="1RM" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: '#2563eb', stroke: isDarkMode ? '#1f2937' : '#ffffff', strokeWidth: 2 }} 
                      activeDot={{ r: 8, fill: '#2563eb', stroke: isDarkMode ? '#1f2937' : '#ffffff', strokeWidth: 3 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm text-center">
                <p>Brak ukończonych serii w historii dla tego ćwiczenia.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
            <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-4">Twoje rekordy (PR):</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2"><span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Największy ciężar:</span><span className="font-black text-gray-900 dark:text-white">{maxWeightStr}</span></div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2"><span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Szacowane 1RM:</span><span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{max1RMStr}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Max objętość (1 seria):</span><span className="font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{maxVolStr}</span></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showCreateExercise) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <button onClick={() => setShowCreateExercise(false)} className="self-start text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"><span className="text-base leading-none">✕</span> Anuluj</button>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-5">
          <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">NAZWA ĆWICZENIA</label><input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="np. Wyciskanie hantli na skosie" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner" /></div>
          <div className="relative z-40">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">PARTIA MIĘŚNIOWA</label>
            <div onClick={() => setIsCreateExFilterOpen(!isCreateExFilterOpen)} className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{newExTarget}</span>
              <span className={`text-xs text-gray-500 transition-transform duration-300 ${isCreateExFilterOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
            {isCreateExFilterOpen && (
              <><div className="fixed inset-0 z-30" onClick={() => setIsCreateExFilterOpen(false)}></div>
                <div className="absolute top-full left-0 w-full mt-2 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-[120] overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                  {MUSCLE_GROUPS.filter(g => g !== 'Wszystkie').map(g => (
                    <div key={g} onClick={() => { setNewExTarget(g); setIsCreateExFilterOpen(false); }} className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${newExTarget === g ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}>
                      <span>{g}</span>{newExTarget === g && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">OPIS I WSKAZÓWKI (OPCJONALNIE)</label><textarea value={newExDescription} onChange={e => setNewExDescription(e.target.value)} placeholder="Zanotuj tu wskazówki techniczne lub ustawienia maszyny..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all min-h-[80px] shadow-inner" /></div>
          <button onClick={handleCreateExercise} className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all mt-2 cursor-pointer">Zapisz własne ćwiczenie</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      <button onClick={() => setShowCreateExercise(true)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all text-center cursor-pointer">+ Stwórz własne ćwiczenie</button>
      
      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-md relative z-40">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Szukaj ćwiczenia..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner" />
        
        <div className="relative">
          <div onClick={() => setIsExFilterOpen(!isExFilterOpen)} className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{selectedMuscleFilter === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : selectedMuscleFilter}</span>
            <span className={`text-xs text-gray-500 transition-transform duration-300 ${isExFilterOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
          
          {isExFilterOpen && (
            <><div className="fixed inset-0 z-30" onClick={() => setIsExFilterOpen(false)}></div>
              <div className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg z-40 overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                {MUSCLE_GROUPS.map(g => (
                  <div key={g} onClick={() => { setSelectedMuscleFilter(g); setIsExFilterOpen(false); }} className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${selectedMuscleFilter === g ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}>
                    <span>{g === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : g}</span>
                    {selectedMuscleFilter === g && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 relative z-30 pb-6">
        {filteredExercises.map(ex => (
          <div key={ex.id} className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center transition-all duration-300">
            <div onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); }} className="flex flex-col flex-1 cursor-pointer">
              <span className="font-bold text-gray-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{ex.name}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg mt-2 w-max border border-indigo-100 dark:border-indigo-800/50">{ex.target}</span>
            </div>
            <button onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); }} className="w-8 h-8 rounded-full bg-gray-900 dark:bg-black border border-gray-700 shadow-inner flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 cursor-pointer shrink-0 ml-2">
              <span className="font-black italic text-sm leading-none">i</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}