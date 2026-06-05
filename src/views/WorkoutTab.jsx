import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RestTimer from '../components/RestTimer';

const WorkoutTabRaw = ({
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
  showConfirmationModal,
  moveExercise,
  setIsInlineTimerVisible,
  setSelectedExerciseDetail,
  setExerciseSubTab,
  setActiveTab,
  adjustTimer,
  handleEditTemplate,
  setEditingTemplateId
}) => {

  // Monitorowanie widoczności stopera na ekranie dla widgetu w App.jsx
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInlineTimerVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    const timerElement = document.getElementById('inline-timer');
    if (timerElement) observer.observe(timerElement);
    return () => {
      if (timerElement) observer.unobserve(timerElement);
      setIsInlineTimerVisible(false);
    };
  }, [timerActive, setIsInlineTimerVisible]);

  // WIDOK 1: TWORZENIE / EDYCJA SZABLONU
  if (isCreatingTemplate) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-20">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Nazwa szablonu</label>
          <input 
            type="text" 
            value={newTemplateName} 
            onChange={(e) => setNewTemplateName(e.target.value)} 
            placeholder="np. Push Day, Nogi Siła..." 
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
          />
        </div>

        {newTemplateExercises.map((exercise, eIndex) => (
          <div key={`${exercise.id}-${eIndex}`} className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-sm">{eIndex + 1}</span>
                <span 
                  className="font-extrabold text-gray-900 dark:text-white text-lg max-w-[200px] truncate cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => {
                    setSelectedExerciseDetail(exercise);
                    setExerciseSubTab('opis');
                    setActiveTab('exercises');
                  }}
                >
                  {exercise.name}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                <button onClick={() => moveExercise(eIndex, -1)} disabled={eIndex === 0} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors">↑</button>
                <button onClick={() => moveExercise(eIndex, 1)} disabled={eIndex === newTemplateExercises.length - 1} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors">↓</button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => {
                  const newExs = newTemplateExercises.filter((_, idx) => idx !== eIndex);
                  setNewTemplateExercises(newExs);
                }} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">✕</button>
              </div>
            </div>

            <div className="space-y-2">
              {exercise.sets.map((set, sIndex) => (
                <div key={sIndex} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-700/30 p-2 rounded-xl relative border border-gray-100 dark:border-gray-700/50">
                  <span className="w-6 text-center font-bold text-gray-400 dark:text-gray-500 text-xs">{sIndex + 1}</span>
                  <div className="flex-1 flex gap-2">
                    <input type="text" inputMode="decimal" placeholder="kg" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" value={set.weight} onChange={(e) => {
                      const newExs = [...newTemplateExercises];
                      newExs[eIndex].sets[sIndex].weight = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      setNewTemplateExercises(newExs);
                    }} />
                    <input type="text" inputMode="numeric" placeholder="powt" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg p-2 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" value={set.reps} onChange={(e) => {
                      const newExs = [...newTemplateExercises];
                      newExs[eIndex].sets[sIndex].reps = e.target.value.replace(/[^0-9]/g, '');
                      setNewTemplateExercises(newExs);
                    }} />
                  </div>
                  <button onClick={() => {
                    const newExs = [...newTemplateExercises];
                    newExs[eIndex].sets.splice(sIndex, 1);
                    setNewTemplateExercises(newExs);
                  }} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">✕</button>
                </div>
              ))}
            </div>
            
            <button onClick={() => addSetToTemplate(eIndex)} className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-sm hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
              <span className="text-lg leading-none">+</span> Dodaj serię
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-3 pt-2">
          <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black py-4 rounded-2xl shadow-sm hover:bg-blue-100 dark:hover:bg-blue-800/30 active:scale-95 transition-all border border-blue-100 dark:border-blue-800/50 flex items-center justify-center gap-2">
            <span className="text-xl leading-none">+</span> Dodaj ćwiczenie
          </button>
          <button 
            onClick={() => { 
              setIsCreatingTemplate(false); 
              setEditingTemplateId(null); 
              setNewTemplateName(''); 
              setNewTemplateExercises([]); 
            }} 
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-4 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            Anuluj
          </button>
        </div>
      </motion.div>
    );
  }

  // WIDOK 2: EKRAN GŁÓWNY TRENINGU (PRZED STARTEM)
  if (!isWorkoutActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-[0_15px_30px_rgba(37,99,235,0.3)] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Gotowy na wycisk?</h2>
          <p className="text-blue-100 mb-6 text-sm font-medium relative z-10">Rozpocznij pusty trening lub wybierz jeden ze swoich szablonów.</p>
          <button onClick={startWorkout} className="w-full bg-white text-blue-700 font-black py-4 rounded-2xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2">
            <span className="text-xl">🔥</span> Rozpocznij pusty trening
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-xl tracking-tight">Twoje Szablony</h3>
            <button onClick={() => { setIsCreatingTemplate(true); setEditingTemplateId(null); setNewTemplateName(''); setNewTemplateExercises([]); }} className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
              + Nowy
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {allTemplates.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-4xl block mb-3">📋</span>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Brak zapisanych szablonów.</p>
              </div>
            ) : (
              allTemplates.map(template => (
                <div key={template.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-gray-900 dark:text-white text-lg">{template.name}</h4>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }} className="w-9 h-9 flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/40 active:scale-95 transition-all shadow-sm">
                        ✏️
                      </button>
                      <button onClick={(e) => handleDeleteTemplate(e, template.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/40 active:scale-95 transition-all shadow-sm">
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {template.exercises.map(e => e.name).join(', ')}
                  </p>
                  <button onClick={() => startWorkoutFromTemplate(template)} className="w-full bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 active:scale-95 transition-all shadow-sm">
                    Rozpocznij ten trening
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // WIDOK 3: AKTYWNY TRENING
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pb-20 flex flex-col">

      {currentWorkout.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 my-4">
          <span className="text-6xl block mb-4 animate-bounce">🏋️‍♂️</span>
          <p className="text-gray-900 dark:text-white font-black text-xl mb-2">Trening rozpoczęty!</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Dodaj pierwsze ćwiczenie, aby zacząć notować wyniki.</p>
        </div>
      ) : (
        currentWorkout.map((exercise, eIndex) => (
          <div key={`${exercise.id}-${eIndex}`} className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-sm">{eIndex + 1}</span>
                <span 
                  className="font-extrabold text-gray-900 dark:text-white text-lg max-w-[200px] truncate cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => {
                    setSelectedExerciseDetail(exercise);
                    setExerciseSubTab('opis');
                    setActiveTab('exercises');
                  }}
                >
                  {exercise.name}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                <button onClick={() => moveExercise(eIndex, -1)} disabled={eIndex === 0} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors">↑</button>
                <button onClick={() => moveExercise(eIndex, 1)} disabled={eIndex === currentWorkout.length - 1} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors">↓</button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => removeExerciseFromWorkout(eIndex)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors">✕</button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <div className="flex gap-2 px-2 pb-1">
                <span className="w-6"></span>
                <div className="flex-1 flex gap-2">
                  <span className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400">KG</span>
                  <span className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400">POWT.</span>
                </div>
                <span className="w-12"></span>
              </div>

              {exercise.sets.map((set, sIndex) => {
                const isActiveMenu = activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex;
                const isWarmup = set.type === 'warm-up' || set.type === 'W';
                const isDrop = set.type === 'drop' || set.type === 'D';

                // --- Szukanie poprzedniego wyniku ---
                let prevW = "-"; let prevR = "-";
                const pastWk = workoutHistory.find(w => w.id !== editingWorkoutId && w.exercises.some(e => e.name === exercise.name));
                if (pastWk) {
                  const pEx = pastWk.exercises.find(e => e.name === exercise.name);
                  if (pEx && pEx.sets[sIndex]) {
                    prevW = pEx.sets[sIndex].weight ? `${pEx.sets[sIndex].weight}` : "-";
                    prevR = pEx.sets[sIndex].reps ? `${pEx.sets[sIndex].reps}` : "-";
                  }
                }

                return (
                  <div key={sIndex} className="flex flex-col">
                    <div className={`flex gap-2 items-center p-2 rounded-xl relative transition-all duration-300 ${set.isCompleted ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50' : isWarmup ? 'bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30' : isDrop ? 'bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30' : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50'}`}>
                      
                      <button onClick={() => setActiveSetMenu(isActiveMenu ? null : {eIndex, sIndex})} className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-xs transition-colors shadow-sm ${isWarmup ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : isDrop ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : 'bg-white dark:bg-gray-600 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-500'}`}>
                        {isWarmup ? 'W' : isDrop ? 'D' : sIndex + 1}
                      </button>

                      <div className="flex-1 flex flex-col justify-center gap-1">
                        <div className="flex gap-2">
                          <input type="text" inputMode="decimal" className={`w-full rounded-lg p-1.5 text-center font-black text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'}`} value={set.weight} onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} readOnly={set.isCompleted} placeholder="-" />
                          <input type="text" inputMode="numeric" className={`w-full rounded-lg p-1.5 text-center font-black text-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'}`} value={set.reps} onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} readOnly={set.isCompleted} placeholder="-" />
                        </div>
                        {(prevW !== "-" || prevR !== "-") && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold text-center tracking-wide">
                            Ostatnio: {prevW} kg × {prevR}
                          </span>
                        )}
                      </div>

                      <button onClick={() => toggleSetComplete(eIndex, sIndex)} className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-sm ${set.isCompleted ? 'bg-green-500 text-white shadow-green-500/40' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                        ✓
                      </button>

                      <AnimatePresence>
                        {isActiveMenu && !set.isCompleted && (
                          <motion.div initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }} className="absolute left-10 top-10 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex gap-1 flex-wrap w-[220px]">
                            <button onClick={() => { updateSet(eIndex, sIndex, 'type', 'warm-up'); setActiveSetMenu(null); }} className="px-3 py-2 text-xs font-bold bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl flex-1 text-center">Rozgrzewka</button>
                            <button onClick={() => { updateSet(eIndex, sIndex, 'type', 'normal'); setActiveSetMenu(null); }} className="px-3 py-2 text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-xl flex-1 text-center">Zwykła</button>
                            <button onClick={() => { updateSet(eIndex, sIndex, 'type', 'drop'); setActiveSetMenu(null); }} className="px-3 py-2 text-xs font-bold bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl flex-1 text-center">Dropset</button>
                            <div className="w-full flex gap-1 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                              <button onClick={() => moveSet(eIndex, sIndex, -1)} disabled={sIndex === 0} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex-1 text-center disabled:opacity-30">↑</button>
                              <button onClick={() => moveSet(eIndex, sIndex, 1)} disabled={sIndex === exercise.sets.length - 1} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl flex-1 text-center disabled:opacity-30">↓</button>
                              <button onClick={() => deleteSet(eIndex, sIndex)} className="px-3 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl flex-1 text-center font-bold">Usuń</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* TIMER RENDEROWANY BEZPOŚREDNIO POD AKTYWNĄ SERIĄ */}
                    <AnimatePresence>
                      {timerActive && timerSource?.exercise === eIndex && timerSource?.set === sIndex && (
                        <motion.div id="inline-timer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 mb-2 px-1">
                          <RestTimer timeLeft={timeLeft} formatTime={formatTime} adjustTimer={adjustTimer} skipTimer={() => { setTimerActive(false); setTimerTarget(null); setTimerSource(null); }} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                )
              })}
            </div>
            
            <button onClick={() => addSet(eIndex)} className="w-full mt-3 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-sm hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
              <span className="text-lg leading-none">+</span> Dodaj serię
            </button>
          </div>
        ))
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black py-4 rounded-2xl shadow-sm hover:bg-blue-100 dark:hover:bg-blue-800/30 active:scale-95 transition-all border border-blue-100 dark:border-blue-800/50 flex items-center justify-center gap-2">
          <span className="text-xl leading-none">+</span> Dodaj ćwiczenie
        </button>
        <button onClick={cancelWorkout} className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 font-bold py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-800/30 active:scale-95 transition-all border border-red-100 dark:border-red-800/50">
          Anuluj trening
        </button>
      </div>

    </motion.div>
  );
};

export default WorkoutTabRaw;