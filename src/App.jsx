import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EXERCISES_DB } from './data/exercises'
import BottomNav from './components/BottomNav'
import RestTimer from './components/RestTimer'

const MUSCLE_GROUPS = ['Wszystkie', 'Klatka piersiowa', 'Plecy', 'Nogi', 'Barki', 'Biceps', 'Triceps', 'Brzuch', 'Łydki', 'Inne']

function App() {
  const [activeTab, setActiveTab] = useState('workout')
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [defaultRestTime, setDefaultRestTime] = useState(90)
  const [timerSource, setTimerSource] = useState(null)
  
  // STANY DLA LICZNIKA CZASU TRENINGU
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [customExercises, setCustomExercises] = useState([])
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExTarget, setNewExTarget] = useState(MUSCLE_GROUPS[1])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('Wszystkie')

  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [customTemplates, setCustomTemplates] = useState([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateExercises, setNewTemplateExercises] = useState([])

  const [isDarkMode, setIsDarkMode] = useState(false)

  const allExercises = [...EXERCISES_DB, ...customExercises]
  const allTemplates = [...customTemplates]
  const [selectedStatExercise, setSelectedStatExercise] = useState('1')

  useEffect(() => {
    const savedHistory = localStorage.getItem('fitAppHistory')
    if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory))

    const savedExercises = localStorage.getItem('fitAppExercises')
    if (savedExercises) setCustomExercises(JSON.parse(savedExercises))

    const savedTemplates = localStorage.getItem('fitAppTemplates')
    if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates))

    const savedTheme = localStorage.getItem('fitAppTheme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // EFEKT DLA TIMERA REGENERACJI
  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => { setTimeLeft(prev => prev - 1) }, 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  // EFEKT DLA LICZNIKA CZASU TRWANIA TRENINGU
  useEffect(() => {
    let interval = null
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isWorkoutActive, workoutStartTime])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('fitAppTheme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('fitAppTheme', 'dark')
      setIsDarkMode(true)
    }
  }

  const saveHistoryToStorage = (newHistory) => {
    setWorkoutHistory(newHistory)
    localStorage.setItem('fitAppHistory', JSON.stringify(newHistory))
  }

  const saveTemplatesToStorage = (newTemplates) => {
    setCustomTemplates(newTemplates)
    localStorage.setItem('fitAppTemplates', JSON.stringify(newTemplates))
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const startWorkout = () => {
    setEditingWorkoutId(null)
    setIsWorkoutActive(true)
    setTimerSource(null)
    setWorkoutStartTime(Date.now())
    setElapsedTime(0)
  }

  const startWorkoutFromTemplate = (template) => {
    setEditingWorkoutId(null)
    const templateCopy = JSON.parse(JSON.stringify(template.exercises))
    setCurrentWorkout(templateCopy)
    setIsWorkoutActive(true)
    setTimerSource(null)
    setWorkoutStartTime(Date.now())
    setElapsedTime(0)
  }

  const cancelWorkout = () => {
    if (window.confirm(editingWorkoutId ? 'Czy chcesz porzucić edycję tego treningu?' : 'Czy na pewno chcesz anulować trening? Postęp zostanie utracony.')) {
      setIsWorkoutActive(false)
      setCurrentWorkout([])
      setTimerActive(false)
      setEditingWorkoutId(null)
      setTimerSource(null)
      setWorkoutStartTime(null)
      setElapsedTime(0)
    }
  }

  const finishWorkout = () => {
    if (currentWorkout.length === 0) {
      alert('Trening jest pusty!')
      return
    }
    
    if (editingWorkoutId) {
      const updatedHistory = workoutHistory.map(w => {
        if (w.id === editingWorkoutId) return { ...w, exercises: currentWorkout, duration: elapsedTime }
        return w
      })
      saveHistoryToStorage(updatedHistory)
      setEditingWorkoutId(null)
    } else {
      const newWorkout = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        duration: elapsedTime,
        exercises: currentWorkout
      }
      saveHistoryToStorage([newWorkout, ...workoutHistory])
    }
    
    setIsWorkoutActive(false)
    setCurrentWorkout([])
    setTimerActive(false)
    setTimerSource(null)
    setWorkoutStartTime(null)
    setElapsedTime(0)
    setActiveTab('history')
  }

  const addExercise = (exercise) => {
    const defaultSet = [{ weight: '', reps: '', isCompleted: false }]
    if (isCreatingTemplate) {
      setNewTemplateExercises([...newTemplateExercises, { ...exercise, sets: defaultSet }])
    } else {
      setCurrentWorkout([...currentWorkout, { ...exercise, sets: defaultSet }])
    }
    setShowExerciseModal(false)
    setShowCreateExercise(false)
    setSearchQuery('')
    setSelectedMuscleFilter('Wszystkie')
  }

  const handleCreateExercise = () => {
    if (!newExName.trim()) return
    const newEx = { id: Date.now().toString(), name: newExName, target: newExTarget }
    const updatedCustom = [...customExercises, newEx]
    setCustomExercises(updatedCustom)
    localStorage.setItem('fitAppExercises', JSON.stringify(updatedCustom))
    setNewExName('')
    setShowCreateExercise(false)
  }

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return alert('Wpisz nazwę szablonu!')
    if (newTemplateExercises.length === 0) return alert('Dodaj przynajmniej jedno ćwiczenie!')

    const newTemplate = {
      id: 'custom-' + Date.now(),
      name: newTemplateName,
      exercises: newTemplateExercises
    }

    saveTemplatesToStorage([...customTemplates, newTemplate])
    setNewTemplateName('')
    setNewTemplateExercises([])
    setIsCreatingTemplate(false)
  }

  const handleDeleteTemplate = (e, templateId) => {
    e.stopPropagation()
    if (window.confirm('Czy chcesz usunąć ten szablon?')) {
      saveTemplatesToStorage(customTemplates.filter(t => t.id !== templateId))
    }
  }

  const handleEditPastWorkout = (workout) => {
    setEditingWorkoutId(workout.id)
    setCurrentWorkout(JSON.parse(JSON.stringify(workout.exercises)))
    setIsWorkoutActive(true)
    setWorkoutStartTime(null) // Podczas edycji nie puszczamy licznika na nowo
    setElapsedTime(workout.duration || 0)
  }

  const handleDeletePastWorkout = (workoutId) => {
    if (window.confirm('Czy na pewno chcesz bezpowrotnie usunąć ten trening z historii?')) {
      saveHistoryToStorage(workoutHistory.filter(w => w.id !== workoutId))
    }
  }

  const addSet = (exerciseIndex) => {
    const newWorkout = [...currentWorkout]
    newWorkout[exerciseIndex].sets.push({ weight: '', reps: '', isCompleted: false })
    setCurrentWorkout(newWorkout)
  }

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newWorkout = [...currentWorkout]
    newWorkout[exerciseIndex].sets[setIndex][field] = value
    setCurrentWorkout(newWorkout)
  }

  const toggleSetComplete = (exerciseIndex, setIndex) => {
    const newWorkout = [...currentWorkout]
    const isNowCompleted = !newWorkout[exerciseIndex].sets[setIndex].isCompleted
    newWorkout[exerciseIndex].sets[setIndex].isCompleted = isNowCompleted
    setCurrentWorkout(newWorkout)

    if (isNowCompleted) {
      setTimeLeft(defaultRestTime)
      setTimerActive(true)
      setTimerSource(exerciseIndex)
    }
  }

  const addSetToTemplate = (exerciseIndex) => {
    const newExercises = [...newTemplateExercises]
    newExercises[exerciseIndex].sets.push({ weight: '', reps: '', isCompleted: false })
    setNewTemplateExercises(newExercises)
  }

  let totalVolume = 0; let totalSets = 0
  workoutHistory.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.isCompleted && set.weight && set.reps) {
          totalVolume += (parseFloat(set.weight) * parseInt(set.reps)); totalSets += 1
        }
      })
    })
  })

  // --- LOGIKA STREAKÓW ---
  const workoutDatesSet = new Set(workoutHistory.map(w => new Date(w.id).toDateString()))

  const getWeeklyActivity = () => {
    const today = new Date(); const currentDay = today.getDay(); const adjustedDay = currentDay === 0 ? 6 : currentDay - 1
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - adjustedDay); startOfWeek.setHours(0, 0, 0, 0)
    const days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    
    return days.map((dayName, index) => {
      const dateOfThisDay = new Date(startOfWeek); dateOfThisDay.setDate(startOfWeek.getDate() + index)
      const dateStr = dateOfThisDay.toDateString()
      
      let streak = 0
      if (workoutDatesSet.has(dateStr)) {
        let checkDate = new Date(dateOfThisDay)
        while (workoutDatesSet.has(checkDate.toDateString())) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }
      return { dayName, hasWorkout: streak > 0, isToday: index === adjustedDay, streak }
    })
  }

  const getYearlyCalendar = () => {
    const year = new Date().getFullYear(); const monthsData = []
    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
    
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate(); const firstDay = new Date(year, m, 1).getDay()
      const startingBlanks = firstDay === 0 ? 6 : firstDay - 1; const days = []
      
      for (let i = 0; i < startingBlanks; i++) days.push(null)
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateOfThisDay = new Date(year, m, i)
        const dateStr = dateOfThisDay.toDateString()
        
        let streak = 0
        if (workoutDatesSet.has(dateStr)) {
          let checkDate = new Date(dateOfThisDay)
          while (workoutDatesSet.has(checkDate.toDateString())) {
            streak++
            checkDate.setDate(checkDate.getDate() - 1)
          }
        }
        days.push({ day: i, hasWorkout: streak > 0, isToday: i === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear(), streak })
      }
      monthsData.push({ name: monthNames[m], days })
    }
    return { year, months: monthsData }
  }

  const getStreakColorClass = (streak, isToday, hasWorkout) => {
    if (!hasWorkout) return isToday ? 'border border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
    if (streak === 1) return 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
    if (streak === 2) return 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
    return 'bg-gradient-to-tr from-red-500 to-yellow-400 text-white shadow-lg shadow-red-500/40 font-black'
  }

  const get1RMData = (exerciseId) => {
    const data = []; const sortedHistory = [...workoutHistory].sort((a, b) => a.id - b.id) 
    sortedHistory.forEach(workout => {
      const ex = workout.exercises.find(e => e.id === exerciseId)
      if (ex) {
        let max1RM = 0
        ex.sets.forEach(set => {
          if (set.isCompleted && set.weight && set.reps) {
            const oneRM = parseFloat(set.weight) * (1 + parseInt(set.reps) / 30)
            if (oneRM > max1RM) max1RM = oneRM
          }
        })
        if (max1RM > 0) {
          const shortDate = workout.date.split(' ').slice(0, 2).join(' ')
          data.push({ date: shortDate, '1RM': Math.round(max1RM) })
        }
      }
    })
    return data
  }

  const weeklyActivity = getWeeklyActivity(); const yearlyData = getYearlyCalendar(); const chartData1RM = get1RMData(selectedStatExercise)
  
  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMuscle = selectedMuscleFilter === 'Wszystkie' || ex.target === selectedMuscleFilter
    return matchesSearch && matchesMuscle
  })

  // WSPÓLNY KOMPONENT MODALNY DLA WYBORU ĆWICZEŃ (Całkowicie usunięta animacja wejściowa by zapobiec usterce z-index)
  function ModalWyboru() {
    return (
      <div className="absolute inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300">
        {!showCreateExercise ? (
          <>
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black dark:text-white">Wybierz ćwiczenie</h2>
              <button onClick={() => { setShowExerciseModal(false); setSearchQuery(''); setSelectedMuscleFilter('Wszystkie'); }} className="text-blue-500 dark:text-blue-400 font-bold">Anuluj</button>
            </header>
            
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3 transition-colors duration-300">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Szukaj ćwiczenia..." 
                className="w-full bg-gray-100 dark:bg-gray-700 border border-transparent text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-colors"
              />
              <select 
                value={selectedMuscleFilter}
                onChange={(e) => setSelectedMuscleFilter(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-transparent text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-colors font-medium appearance-none"
              >
                {MUSCLE_GROUPS.map(g => (
                  <option key={g} value={g}>{g === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : g}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
              {filteredExercises.map(ex => (
                <button 
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  className="w-full text-left p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col"
                >
                  <span className="font-bold text-gray-800 dark:text-gray-100">{ex.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{ex.target}</span>
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                  Nie znaleziono ćwiczeń spełniających kryteria.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <button 
                onClick={() => setShowCreateExercise(true)}
                className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold py-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                + Stwórz własne ćwiczenie
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black dark:text-white">Nowe ćwiczenie</h2>
              <button onClick={() => setShowCreateExercise(false)} className="text-blue-500 dark:text-blue-400 font-bold">Wróć</button>
            </header>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">NAZWA ĆWICZENIA</label>
                <input 
                  type="text" 
                  value={newExName} 
                  onChange={e => setNewExName(e.target.value)} 
                  placeholder="np. Wyciskanie hantli na skosie" 
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">PARTIA MIĘŚNIOWA</label>
                <select 
                  value={newExTarget} 
                  onChange={e => setNewExTarget(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
                >
                  {MUSCLE_GROUPS.filter(g => g !== 'Wszystkie').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleCreateExercise} 
                className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
              >
                Zapisz ćwiczenie
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // --- GŁÓWNA STRUKTURA APLIKACJI ---
  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
      
      {/* GLOBALNY NAGŁÓWEK */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 transition-colors duration-300">
        <div className="flex flex-col">
          <h1 className={`font-black text-gray-900 dark:text-white tracking-tight ${activeTab === 'workout' && (isWorkoutActive || isCreatingTemplate) ? 'text-lg' : 'text-2xl'}`}>
            {activeTab === 'history' && 'Historia'}
            {activeTab === 'workout' && !isWorkoutActive && !isCreatingTemplate && 'Trening'}
            {activeTab === 'workout' && isWorkoutActive && (editingWorkoutId ? 'Edytujesz trening' : 'Trwa trening')}
            {activeTab === 'workout' && isCreatingTemplate && 'Nowy szablon'}
            {activeTab === 'calendar' && 'Twój Rok'}
            {activeTab === 'profile' && 'Profil'}
          </h1>
          {activeTab === 'workout' && isWorkoutActive && !editingWorkoutId && (
            <span className="text-xs font-bold text-blue-500 mt-0.5 flex items-center gap-1">
              <span className="animate-pulse">⏱️</span> {formatTime(elapsedTime)}
            </span>
          )}
        </div>
        {activeTab === 'workout' && isWorkoutActive && (
          <button onClick={finishWorkout} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg transition-colors active:scale-95 shadow-sm">Zapisz</button>
        )}
        {activeTab === 'workout' && isCreatingTemplate && (
          <button onClick={handleSaveTemplate} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg transition-colors active:scale-95 shadow-sm">Zapisz</button>
        )}
      </header>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="flex-1 overflow-y-auto pb-32 p-4 animate-fade-in-up">
        
        {/* --- ZAKŁADKA HISTORIA --- */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            {workoutHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <p>Brak zapisanych treningów.</p>
              </div>
            ) : (
              workoutHistory.map(workout => (
                <div key={workout.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative transition-colors duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Trening ({workout.exercises.length} ćw.)</h2>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditPastWorkout(workout)} className="text-xs bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold">✏️</button>
                      <button onClick={() => handleDeletePastWorkout(workout.id)} className="text-xs bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-red-500 dark:text-red-400 px-2 py-1 rounded font-bold">🗑️</button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1">📅 {workout.date}</span>
                    {workout.duration > 0 && <span className="flex items-center gap-1">⏱️ {formatTime(workout.duration)}</span>}
                  </div>
                  
                  {workout.exercises.map((ex, idx) => {
                    const validSets = ex.sets.filter(s => s.isCompleted && s.weight !== '' && s.reps !== '')
                    let bestSetStr = "Brak danych"
                    if (validSets.length > 0) {
                      const bestSet = validSets.reduce((prev, curr) => {
                        const prev1RM = parseFloat(prev.weight) * (1 + parseInt(prev.reps) / 30)
                        const curr1RM = parseFloat(curr.weight) * (1 + parseInt(curr.reps) / 30)
                        return curr1RM > prev1RM ? curr : prev
                      })
                      bestSetStr = `${bestSet.weight} kg × ${bestSet.reps}`
                    }

                    return (
                      <div key={idx} className="flex justify-between items-center text-sm mb-1.5 border-b border-gray-50 dark:border-gray-700/50 pb-1.5 last:border-0 last:pb-0">
                        <span className="truncate pr-2" title={ex.name}>
                          <span className="text-gray-500 dark:text-gray-400 mr-1.5">{ex.sets.length}x</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{ex.name}</span>
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {bestSetStr}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ZAKŁADKA TRENING (DASHBOARD LUB AKTYWNY) --- */}
        {activeTab === 'workout' && (
          isWorkoutActive ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {currentWorkout.map((exercise, eIndex) => (
                <div key={eIndex} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                  <h2 className="font-extrabold text-gray-900 dark:text-white text-lg mb-4">{exercise.name}</h2>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                    <div>Seria</div><div>KG</div><div>Powt.</div><div>Status</div>
                  </div>
                  
                  {exercise.sets.map((set, sIndex) => (
                    <div key={sIndex} className={`grid grid-cols-4 gap-2 mb-2 items-center p-2 rounded-lg transition-colors ${set.isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                      <div className="text-center font-bold text-gray-700 dark:text-gray-300">{sIndex + 1}</div>
                      
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={set.weight} 
                        onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
                        disabled={set.isCompleted} 
                        className={`text-center font-semibold rounded p-1.5 w-full outline-none transition-all ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`} 
                        placeholder="0" 
                      />
                      
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={set.reps} 
                        onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} 
                        disabled={set.isCompleted} 
                        className={`text-center font-semibold rounded p-1.5 w-full outline-none transition-all ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`} 
                        placeholder="0" 
                      />
                      
                      <button 
                        onClick={() => toggleSetComplete(eIndex, sIndex)} 
                        className={`w-full flex items-center justify-center h-8 rounded-lg transition-all ${set.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addSet(eIndex)} className="w-full mt-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wide">
                    + Dodaj serię
                  </button>

                  {/* TIMER INLINE - wyświetlany pod ćwiczeniem, z którego go wystartowano */}
                  {timerActive && timerSource === eIndex && (
                    <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="inline" />
                  )}

                </div>
              ))}
              
              <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all mb-2">
                + Dodaj ćwiczenie
              </button>
              
              <button onClick={cancelWorkout} className="w-full text-red-500 font-medium py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                {editingWorkoutId ? 'Porzuć edycję' : 'Anuluj trening'}
              </button>
            </div>
          ) : isCreatingTemplate ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">NAZWA SZABLONU PLANU</label>
                <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="np. FBW Piątek, Push A" className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 font-medium shadow-sm transition-colors duration-300" />
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
              <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Zaplanowane ćwiczenia ({newTemplateExercises.length})</h3>
              
              {newTemplateExercises.map((ex, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2 transition-colors duration-300">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{ex.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{ex.target} • {ex.sets.length} zaplanowanych serii</p>
                    </div>
                    <button onClick={() => setNewTemplateExercises(newTemplateExercises.filter((_, i) => i !== idx))} className="text-red-500 dark:text-red-400 text-lg p-1">✕</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addSetToTemplate(idx)} className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-md">+ Dodaj serię</button>
                    <button onClick={() => {
                      if(ex.sets.length > 1) {
                        const newExs = [...newTemplateExercises]
                        newExs[idx].sets.pop()
                        setNewTemplateExercises(newExs)
                      }
                    }} className={`text-xs font-bold px-3 py-1 rounded-md ${ex.sets.length > 1 ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'}`}>- Usuń serię</button>
                  </div>
                </div>
              ))}

              <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold py-3 rounded-xl border border-dashed border-blue-200 dark:border-blue-800">+ Dodaj ćwiczenie do planu</button>
              <button onClick={() => { setIsCreatingTemplate(false); setNewTemplateExercises([]); setNewTemplateName(''); }} className="w-full text-gray-500 dark:text-gray-400 font-medium py-2">Anuluj</button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button 
                onClick={startWorkout}
                className="w-full bg-blue-600 dark:bg-blue-700 text-white font-black py-4 rounded-xl shadow-sm active:bg-blue-700 dark:active:bg-blue-600 transition-colors"
              >
                Rozpocznij pusty trening
              </button>
              <button 
                onClick={() => setIsCreatingTemplate(true)} 
                className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 font-bold py-3 rounded-xl shadow-sm transition-colors" 
              >
                + Stwórz własny szablon planu
              </button>
              <div className="flex items-center gap-4 my-1">
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                <span className="text-gray-400 dark:text-gray-500 text-xs font-bold tracking-wider">SZABLONY PLANÓW</span>
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
              </div>
              
              {allTemplates.length === 0 ? (
                <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
                  Brak szablonów. Stwórz swój pierwszy plan!
                </div>
              ) : (
                allTemplates.map(tpl => {
                  return (
                    <div key={tpl.id} onClick={() => startWorkoutFromTemplate(tpl)} className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold py-4 px-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer flex justify-between items-center transition-all" >
                      <div className="flex flex-col text-left">
                        <span>{tpl.name}</span>
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{tpl.exercises.length} zaplanowanych ćwiczeń</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => handleDeleteTemplate(e, tpl.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm" title="Usuń szablon">🗑️</button>
                        <span className="text-blue-600 dark:text-blue-400 text-xl">▶</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )
        )}

        {/* --- ZAKŁADKA KALENDARZ --- */}
        {activeTab === 'calendar' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors duration-300">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Rok</span>
              <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400">{yearlyData.year}</h2>
            </div>
            
            {yearlyData.months.map((month, mIdx) => (
              <div key={mIdx} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{month.name}</h3>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {month.days.map((item, idx) => {
                    if (item === null) return <div key={`blank-${idx}`} className="h-6"></div>
                    return (
                      <div key={`day-${item.day}`} className="flex justify-center items-center h-8">
                        <div className={`w-7 h-7 flex items-center justify-center text-xs transition-all duration-300 rounded-md ${getStreakColorClass(item.streak, item.isToday, item.hasWorkout)}`}>
                          {item.day}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- ZAKŁADKA PROFIL --- */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors duration-300">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-gray-100">Ciemny motyw</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Oszczędzaj wzrok i baterię</p>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Progresja siłowa (Szacowane 1RM)</h2>
              
              <select 
                value={selectedStatExercise}
                onChange={(e) => setSelectedStatExercise(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 rounded-lg p-3 mb-6 outline-none font-medium appearance-none transition-colors duration-300"
              >
                {allExercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>

              {chartData1RM.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData1RM}>
                      <defs>
                        <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af' }} width={30} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#374151' }}
                        labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: '4px' }}
                        formatter={(value) => [`${value} kg`, 'Szacowane 1RM']}
                      />
                      <Area type="monotone" dataKey="1RM" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#color1RM)" activeDot={{ r: 6, fill: '#2563eb', stroke: isDarkMode ? '#1f2937' : '#ffffff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  <p>Brak ukończonych serii dla tego ćwiczenia.</p>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Ten tydzień</h2>
              <div className="flex justify-between items-center">
                {weeklyActivity.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${getStreakColorClass(day.streak, day.isToday, day.hasWorkout)}`}>
                      {day.hasWorkout ? (day.streak >= 3 ? '🔥' : '✓') : ''}
                    </div>
                    <span className={`text-[10px] font-medium uppercase transition-colors ${day.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Statystyki ogólne</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">TRENINGI</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{workoutHistory.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">TONAŻ (KG)</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalVolume}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center col-span-2">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">UKOŃCZONE SERIE</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalSets}</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ELEMENTY PŁYWAJĄCE - CAŁKOWICIE UKRYWANE GDY MODAL JEST OTWARTY */}
      {timerActive && activeTab !== 'workout' && !showExerciseModal && (
         <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="compact" />
      )}
      
      {showExerciseModal && <ModalWyboru />}
      
      {!showExerciseModal && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  )
}

export default App