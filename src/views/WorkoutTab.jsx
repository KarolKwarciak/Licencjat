import React from 'react'
import RestTimer from '../components/RestTimer'

export default function WorkoutTab({
  isWorkoutActive,
  isCreatingTemplate,
  setIsCreatingTemplate,
  currentWorkout,
  workoutHistory,
  editingWorkoutId,
  activeSetMenu,
  setActiveSetMenu,
  timerActive,
  timerSource,
  timeLeft,
  setTimeLeft,
  setTimerActive,
  formatTime,
  allTemplates,
  newTemplateName,
  setNewTemplateName,
  newTemplateExercises,
  setNewTemplateExercises,
  setShowExerciseModal,
  startWorkout,
  startWorkoutFromTemplate,
  cancelWorkout,
  handleDeleteTemplate,
  removeExerciseFromWorkout,
  addSet,
  updateSet,
  toggleSetComplete,
  moveSet,
  deleteSet,
  addSetToTemplate,
  showConfirmationModal
}) {
  return (
    <>
      {/* --- EKRAN 1: LISTA SZABLONÓW --- */}
      {!isWorkoutActive && !isCreatingTemplate && (
        <div className="flex flex-col gap-4 animate-fade-in-up">
          <button onClick={startWorkout} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all cursor-pointer">Rozpocznij pusty trening</button>
          <button onClick={() => setIsCreatingTemplate(true)} className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 font-bold py-3 rounded-2xl shadow-sm transition-colors cursor-pointer">+ Stwórz własny szablon planu</button>
          
          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div><span className="text-gray-400 dark:text-gray-500 text-xs font-black tracking-widest uppercase">SZABLONY PLANÓW</span><div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
          </div>
          
          {allTemplates.length === 0 ? (
            <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">Brak szablonów. Stwórz swój pierwszy plan!</div>
          ) : (
            <div className="flex flex-col gap-4 pb-6">
              {allTemplates.map(tpl => {
                const totalSets = tpl.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
                return (
                  <div key={tpl.id} className="relative w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div onClick={() => startWorkoutFromTemplate(tpl)} className="flex flex-col text-left flex-1 cursor-pointer">
                      <span className="text-lg font-black text-gray-900 dark:text-white mb-1.5 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tpl.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">{tpl.exercises.length} ćwiczeń</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 shadow-sm">{totalSets} serii</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10 shrink-0 ml-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(e, tpl.id); }} className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-black text-gray-400 border border-gray-700 shadow-sm cursor-pointer transition-all duration-300 hover:bg-red-600 hover:text-white hover:border-red-500" title="Usuń szablon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); startWorkoutFromTemplate(tpl); }} className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-900 dark:bg-black text-gray-400 border border-gray-700 shadow-sm cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-blue-500" title="Rozpocznij plan">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-1" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- EKRAN 2: KREATOR SZABLONU --- */}
      {isCreatingTemplate && (
        <div className="flex flex-col gap-5 animate-fade-in-up">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/90 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Nazwa Szablonu</label>
            <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="np. Push Day, Pull..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" />
          </div>

          {newTemplateExercises.map((exercise, eIndex) => (
            <div key={eIndex} className="bg-white dark:bg-gray-800 p-4 pb-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 relative">
              <div className="flex justify-between items-start mb-5 px-1 pt-1">
                <h2 className="font-extrabold text-gray-900 dark:text-white text-xl pr-4">{exercise.name}</h2>
                <button onClick={() => { const newExs = [...newTemplateExercises]; newExs.splice(eIndex, 1); setNewTemplateExercises(newExs); }} className="text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-900/30">Usuń</button>
              </div>
              
              <div className="grid grid-cols-[15%_25%_25%_35%] gap-2 mb-2 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center px-2 py-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
                <div>Seria</div><div>KG</div><div>Powt</div><div>Typ</div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                {exercise.sets.map((set, sIndex) => (
                  <div key={sIndex} className="grid grid-cols-[15%_25%_25%_35%] gap-2 items-center p-2 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-center font-black text-xs text-gray-500">{sIndex + 1}</div>
                    <input type="text" inputMode="decimal" value={set.weight} onChange={(e) => { const newExs = [...newTemplateExercises]; newExs[eIndex].sets[sIndex].weight = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'); setNewTemplateExercises(newExs); }} className="text-center font-black rounded-xl p-2 w-full outline-none text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-400" placeholder="0" />
                    <input type="text" inputMode="numeric" value={set.reps} onChange={(e) => { const newExs = [...newTemplateExercises]; newExs[eIndex].sets[sIndex].reps = e.target.value.replace(/[^0-9]/g, ''); setNewTemplateExercises(newExs); }} className="text-center font-black rounded-xl p-2 w-full outline-none text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:border-blue-400" placeholder="0" />
                    <button onClick={() => { const newExs = [...newTemplateExercises]; const types = ['normal', 'warmup', 'failure']; const currentIdx = types.indexOf(set.type || 'normal'); newExs[eIndex].sets[sIndex].type = types[(currentIdx + 1) % types.length]; setNewTemplateExercises(newExs); }} className={`text-[10px] font-black rounded-xl p-2 w-full uppercase transition-all shadow-sm border cursor-pointer flex items-center justify-center ${set.type === 'warmup' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30' : set.type === 'failure' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                      {set.type === 'warmup' ? 'W' : set.type === 'failure' ? 'F' : 'N'}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => addSetToTemplate(eIndex)} className="w-full mt-3 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">+ Dodaj serię</button>
            </div>
          ))}
          
          <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all cursor-pointer">
            + Dodaj ćwiczenie
          </button>
          <button 
            onClick={() => { 
              showConfirmationModal(
                'Czy na pewno chcesz porzucić tworzenie tego szablonu? Cały postęp zostanie utracony.', 
                () => { setIsCreatingTemplate(false); setNewTemplateName(''); setNewTemplateExercises([]); },
                'Tak, anuluj tworzenie',
                'Nie, wróć do edycji'
              ) 
            }} 
            className="w-full text-red-500 font-bold py-3 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            Anuluj tworzenie
          </button>
        </div>
      )}

      {/* --- EKRAN 3: AKTYWNY TRENING --- */}
      {isWorkoutActive && (
        <div className="flex flex-col gap-5 animate-fade-in-up">
          {currentWorkout.map((exercise, eIndex) => {
            const prevWorkout = workoutHistory.find(w => w.id !== editingWorkoutId && w.exercises.some(e => String(e.id) === String(exercise.id) || e.name === exercise.name));
            const prevExercise = prevWorkout ? prevWorkout.exercises.find(e => String(e.id) === String(exercise.id) || e.name === exercise.name) : null;
            const prevSets = prevExercise ? prevExercise.sets.filter(s => s.isCompleted && s.weight !== '' && s.reps !== '') : [];

            return (
              <div key={eIndex} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/90 p-4 pb-6 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex justify-between items-start mb-5 relative z-10 px-1 pt-1">
                  <h2 className="font-extrabold text-gray-900 dark:text-white text-xl pr-4 tracking-tight">{exercise.name}</h2>
                  <button onClick={() => removeExerciseFromWorkout(eIndex)} className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm cursor-pointer">Usuń</button>
                </div>
                
                <div className="grid grid-cols-[8%_25%_18%_18%_16%_12%] gap-1 mb-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center px-2 py-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-xl relative z-10">
                  <div>Ser</div><div>Ostatnio</div><div>KG</div><div>Powt</div><div>Typ</div><div>Stat</div>
                </div>
                
                <div className="flex flex-col gap-1.5 relative z-10">
                  {exercise.sets.map((set, sIndex) => {
                    const prevSet = prevSets[sIndex]; const setType = set.type || 'normal';
                    return (
                      <div key={sIndex} className="flex flex-col">
                        <div className={`grid grid-cols-[8%_25%_18%_18%_16%_12%] gap-1.5 items-center p-2 rounded-2xl transition-all duration-700 ease-out border ${set.isCompleted ? 'bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-800/40 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                          <div className="flex items-center justify-center w-full h-full cursor-pointer" onClick={() => setActiveSetMenu(activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex ? null : {eIndex, sIndex})} title="Zarządzaj serią">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-inner font-black text-xs transition-colors ${activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400'}`}>{sIndex + 1}</div>
                          </div>
                          <div className="flex justify-center"><span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-1 py-1.5 rounded-lg shadow-inner w-full text-center truncate">{prevSet ? `${prevSet.weight}x${prevSet.reps}` : '-'}</span></div>
                          <input type="text" inputMode="decimal" value={set.weight} onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} disabled={set.isCompleted} className={`text-center font-black rounded-xl p-2 w-full outline-none text-xs transition-all border ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400 border-transparent' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner'}`} placeholder="0" />
                          <input type="text" inputMode="numeric" value={set.reps} onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} disabled={set.isCompleted} className={`text-center font-black rounded-xl p-2 w-full outline-none text-xs transition-all border ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400 border-transparent' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner'}`} placeholder="0" />
                          <button onClick={() => updateSet(eIndex, sIndex, 'type', setType === 'normal' ? 'warmup' : setType === 'warmup' ? 'failure' : 'normal')} disabled={set.isCompleted} className={`text-[11px] font-black rounded-xl p-2 w-full uppercase transition-all shadow-sm border flex items-center justify-center cursor-pointer ${setType === 'warmup' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50' : setType === 'failure' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{setType === 'warmup' ? 'W' : setType === 'failure' ? 'F' : '—'}</button>
                          <button onClick={() => toggleSetComplete(eIndex, sIndex)} className={`w-full flex items-center justify-center h-8 rounded-xl text-sm transition-all shadow-sm border cursor-pointer ${set.isCompleted ? 'bg-green-500 text-white border-green-600 shadow-green-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>✓</button>
                        </div>

                        {activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex && (
                          <div className="flex justify-between items-center bg-gray-800 dark:bg-gray-900 text-white p-2 rounded-xl mt-1 mb-1 animate-fade-in-up shadow-lg z-20">
                            <button onClick={() => moveSet(eIndex, sIndex, -1)} disabled={sIndex === 0} className={`flex-1 font-bold text-xs py-1.5 transition-colors cursor-pointer ${sIndex === 0 ? 'opacity-30' : 'hover:text-blue-400'}`}>↑ W górę</button>
                            <div className="w-px h-5 bg-gray-600 mx-2"></div>
                            <button onClick={() => moveSet(eIndex, sIndex, 1)} disabled={sIndex === exercise.sets.length - 1} className={`flex-1 font-bold text-xs py-1.5 transition-colors cursor-pointer ${sIndex === exercise.sets.length - 1 ? 'opacity-30' : 'hover:text-blue-400'}`}>↓ W dół</button>
                            <div className="w-px h-5 bg-gray-600 mx-2"></div>
                            <button onClick={() => deleteSet(eIndex, sIndex)} className="flex-1 font-bold text-xs py-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer">🗑️ Usuń</button>
                          </div>
                        )}
                        
                        <div className={`grid transition-all duration-500 ease-in-out ${timerSource?.exercise === eIndex && timerSource?.set === sIndex && timerActive ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                          <div className="overflow-hidden">
                            <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="inline" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => addSet(eIndex)} className="w-full mt-3 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors uppercase tracking-wide border border-blue-100 dark:border-blue-800/50 relative z-10 shadow-sm cursor-pointer">+ Dodaj serię</button>
              </div>
            )
          })}
          
          <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-xl hover:bg-blue-700 hover:shadow-blue-500/20 transition-all mb-2 hover:-translate-y-0.5 cursor-pointer">+ Dodaj ćwiczenie</button>
          <button onClick={cancelWorkout} className="w-full text-red-500 font-bold py-3 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm mb-4 cursor-pointer">{editingWorkoutId ? 'Porzuć edycję' : 'Anuluj trening'}</button>
        </div>
      )}
    </>
  );
}