import React from 'react'

export default function HistoryTab({
  workoutHistory,
  highlightedWorkoutId,
  handleEditPastWorkout,
  handleDeletePastWorkout,
  formatTime,
  setSelectedExerciseDetail,
  setExerciseSubTab,
  setActiveTab
}) {
  if (workoutHistory.length === 0) {
    return (
      <div className="flex flex-col gap-4 animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
          <p>Brak zapisanych treningów.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {workoutHistory.map(workout => (
        <div key={workout.id} id={`workout-${workout.id}`} className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl shadow-md transition-all duration-500 ${highlightedWorkoutId === workout.id ? 'border-blue-500 ring-4 ring-blue-500/30 scale-[1.02] shadow-blue-500/20' : 'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'}`}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h2 className="font-extrabold text-gray-900 dark:text-gray-100 text-lg tracking-tight">Trening ({workout.exercises.length} ćw.)</h2>
            <div className="flex gap-2">
              <button onClick={() => handleEditPastWorkout(workout)} className="text-xs bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-lg font-bold border border-gray-200 dark:border-gray-600 shadow-sm transition-all cursor-pointer">✏️</button>
              <button onClick={() => handleDeletePastWorkout(workout.id)} className="text-xs bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 px-2.5 py-1.5 rounded-lg font-bold border border-gray-200 dark:border-gray-600 shadow-sm transition-all cursor-pointer">🗑️</button>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-5 items-center relative z-10">
            <span className="flex items-center gap-1 font-medium">📅 {workout.date}</span>
            {workout.duration > 0 && <span className="flex items-center gap-1 font-medium">⏱️ {formatTime(workout.duration)}</span>}
            {workout.prs > 0 && <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-md border border-yellow-100 dark:border-yellow-800/50 shadow-sm">🏆 {workout.prs} PR</span>}
          </div>
          <div className="flex flex-col gap-1 relative z-10">
            {workout.exercises.map((ex, idx) => {
              const validSets = ex.sets.filter(s => s.isCompleted && s.weight !== '' && s.reps !== '')
              let bestSetStr = "Brak danych"
              if (validSets.length > 0) {
                const bestSet = validSets.reduce((prev, curr) => {
                  const pW = parseFloat(prev.weight) || 0; const cW = parseFloat(curr.weight) || 0;
                  const prev1RM = pW === 0 ? parseInt(prev.reps) : pW * (1 + parseInt(prev.reps) / 30);
                  const curr1RM = cW === 0 ? parseInt(curr.reps) : cW * (1 + parseInt(curr.reps) / 30);
                  return curr1RM > prev1RM ? curr : prev;
                })
                bestSetStr = `${bestSet.weight} kg × ${bestSet.reps}`
              }
              return (
                <div key={idx} className="flex justify-between items-center text-sm mb-2 border-b border-gray-100 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
                  <div onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); setActiveTab('exercises'); }} className="flex flex-1 items-center cursor-pointer overflow-hidden mr-3 group/ex">
                    <span className="text-gray-500 dark:text-gray-400 mr-3 text-[11px] font-black bg-gray-100 dark:bg-gray-900/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm transition-colors group-hover/ex:text-blue-600 dark:group-hover/ex:text-blue-400">{ex.sets.length}x</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate transition-colors group-hover/ex:text-blue-600 dark:group-hover/ex:text-blue-400">{ex.name}</span>
                  </div>
                  <span className="font-black text-blue-600 dark:text-blue-400 text-[11px] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50 shadow-sm whitespace-nowrap">{bestSetStr}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}