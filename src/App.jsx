import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const startWorkout = () => {
    setEditingWorkoutId(null)
    setIsWorkoutActive(true)
  }

  const startWorkoutFromTemplate = (template) => {
    setEditingWorkoutId(null)
    const templateCopy = JSON.parse(JSON.stringify(template.exercises))
    setCurrentWorkout(templateCopy)
    setIsWorkoutActive(true)
  }

  const cancelWorkout = () => {
    if (window.confirm(editingWorkoutId ? 'Czy chcesz porzucić edycję tego treningu?' : 'Czy na pewno chcesz anulować trening? Postęp zostanie utracony.')) {
      setIsWorkoutActive(false)
      setCurrentWorkout([])
      setTimerActive(false)
      setEditingWorkoutId(null)
    }
  }

  const finishWorkout = () => {
    if (currentWorkout.length === 0) {
      alert('Trening jest pusty!')
      return
    }
    
    if (editingWorkoutId) {
      const updatedHistory = workoutHistory.map(w => {
        if (w.id === editingWorkoutId) return { ...w, exercises: currentWorkout }
        return w
      })
      saveHistoryToStorage(updatedHistory)
      setEditingWorkoutId(null)
    } else {
      const newWorkout = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        exercises: currentWorkout
      }
      saveHistoryToStorage([newWorkout, ...workoutHistory])
    }
    
    setIsWorkoutActive(false)
    setCurrentWorkout([])
    setTimerActive(false)
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

  const getWeeklyActivity = () => {
    const today = new Date(); const currentDay = today.getDay(); const adjustedDay = currentDay === 0 ? 6 : currentDay - 1
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - adjustedDay); startOfWeek.setHours(0, 0, 0, 0)
    const days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    return days.map((dayName, index) => {
      const dateOfThisDay = new Date(startOfWeek); dateOfThisDay.setDate(startOfWeek.getDate() + index)
      const hasWorkout = workoutHistory.some(workout => {
        const wDate = new Date(workout.id)
        return wDate.getDate() === dateOfThisDay.getDate() && wDate.getMonth() === dateOfThisDay.getMonth() && wDate.getFullYear() === dateOfThisDay.getFullYear()
      })
      return { dayName, hasWorkout, isToday: index === adjustedDay }
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
        const hasWorkout = workoutHistory.some(w => { const d = new Date(w.id); return d.getDate() === i && d.getMonth() === m && d.getFullYear() === year })
        days.push({ day: i, hasWorkout, isToday: i === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear() })
      }
      monthsData.push({ name: monthNames[m], days })
    }
    return { year, months: monthsData }
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

  // EKRAN 1: AKTYWNY TRENING / EDYCJA TRENINGU
  if (isWorkoutActive) {
    return (
      <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10 shrink-0 transition-colors duration-300">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{editingWorkoutId ? 'Edytujesz trening' : 'Trwa trening'}</h1>
          <button onClick={finishWorkout} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1 rounded-lg">Zapisz</button>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 ${timerActive ? 'pb-32' : 'pb-24'}`}>
          {currentWorkout.map((exercise, eIndex) => (
            <div key={eIndex} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 transition-colors duration-300">
              <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-3">{exercise.name}</h2>
              <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                <div>SERIA</div><div>KG</div><div>POWT.</div><div>✔️</div>
              </div>
              {exercise.sets.map((set, sIndex) => (
                <div key={sIndex} className={`grid grid-cols-4 gap-2 mb-2 items-center p-1 rounded ${set.isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <div className="text-center font-bold text-gray-700 dark:text-gray-300">{sIndex + 1}</div>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={set.weight} 
                    onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
                    disabled={set.isCompleted} 
                    className={`rounded p-2 text-center w-full outline-none focus:ring-2 focus:ring-blue-400 ${set.isCompleted ? 'bg-transparent text-green-800 dark:text-green-400 font-bold' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`} 
                    placeholder="0" 
                  />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={set.reps} 
                    onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} 
                    disabled={set.isCompleted} 
                    className={`rounded p-2 text-center w-full outline-none focus:ring-2 focus:ring-blue-400 ${set.isCompleted ? 'bg-transparent text-green-800 dark:text-green-400 font-bold' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`} 
                    placeholder="0" 
                  />
                  <button onClick={() => toggleSetComplete(eIndex, sIndex)} className={`rounded p-2 transition-colors ${set.isCompleted ? 'bg-green-500 dark:bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'}`}>✓</button>
                </div>
              ))}
              <button onClick={() => addSet(eIndex)} className="w-full mt-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50">+ Dodaj serię</button>
            </div>
          ))}
          <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold py-3 rounded-xl shadow-sm mb-4">+ Dodaj ćwiczenie</button>
          <button onClick={cancelWorkout} className="w-full text-red-500 dark:text-red-400 font-medium py-3 rounded-xl mb-4 hover:bg-red-50 dark:hover:bg-red-900/20">{editingWorkoutId ? 'Porzuć edycję' : 'Anuluj trening'}</button>
        </main>

        {timerActive && <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} />}
        {showExerciseModal && <ModalWyboru />}
      </div>
    )
  }

  // EKRAN 2: KREATOR WŁASNYCH SZABLONÓW
  if (isCreatingTemplate) {
    return (
      <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 transition-colors duration-300">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Nowy szablon</h1>
          <button onClick={handleSaveTemplate} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1 rounded-lg">Zapisz</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
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
        </main>
        {showExerciseModal && <ModalWyboru />}
      </div>
    )
  }

  // WSPÓLNY KOMPONENT MODALNY DLA WYBORU ĆWICZEŃ
  function ModalWyboru() {
    return (
      <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col transition-colors duration-300">
        {!showCreateExercise ? (
          <>
            <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold dark:text-white">Wybierz ćwiczenie</h2>
              <button onClick={() => { setShowExerciseModal(false); setSearchQuery(''); setSelectedMuscleFilter('Wszystkie'); }} className="text-blue-500 dark:text-blue-400 font-medium">Anuluj</button>
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

            <div className="flex-1 overflow-y-auto">
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
            <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold dark:text-white">Nowe ćwiczenie</h2>
              <button onClick={() => setShowCreateExercise(false)} className="text-blue-500 dark:text-blue-400 font-medium">Wróć</button>
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

  // GŁÓWNE RENDEROWANIE ZAKŁADEK
  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 px-4 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
          {activeTab === 'history' && 'Historia'}
          {activeTab === 'workout' && 'Trening'}
          {activeTab === 'calendar' && 'Twój Rok'}
          {activeTab === 'profile' && 'Profil'}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 p-4">
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            {workoutHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <p>Brak zapisanych treningów.</p>
              </div>
            ) : (
              workoutHistory.map(workout => (
                <div key={workout.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative transition-colors duration-300">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">Trening ({workout.exercises.length} ćw.)</h2>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditPastWorkout(workout)} className="text-xs bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 px-2 py-1 rounded font-bold">✏️</button>
                      <button onClick={() => handleDeletePastWorkout(workout.id)} className="text-xs bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-red-500 dark:text-red-400 px-2 py-1 rounded font-bold">🗑️</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{workout.date}</p>
                  {workout.exercises.map((ex, idx) => {
                    const completedSets = ex.sets.filter(s => s.isCompleted).length
                    return (
                      <div key={idx} className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span className="font-medium">{ex.name}</span>: {completedSets} / {ex.sets.length} serii
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'workout' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={startWorkout}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm active:bg-blue-700 dark:active:bg-blue-600 transition-colors"
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
        )}

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
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium
                          ${item.hasWorkout ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                          ${item.isToday && !item.hasWorkout ? 'border border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400' : ''}
                        `}>
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

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            
            {/* NOWA SEKCJA USTAWIENIA */}
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
                    <LineChart data={chartData1RM}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af' }} width={30} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#374151' }}
                        labelStyle={{ fontWeight: 'bold', color: isDarkMode ? '#f3f4f6' : '#374151', marginBottom: '4px' }}
                        formatter={(value) => [`${value} kg`, 'Szacowane 1RM']}
                      />
                      <Line type="monotone" dataKey="1RM" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: isDarkMode ? '#1f2937' : '#ffffff' }} activeDot={{ r: 6 }} />
                    </LineChart>
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${day.hasWorkout ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'} ${day.isToday && !day.hasWorkout ? 'border-2 border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800' : ''}`}>
                      {day.hasWorkout ? '✓' : ''}
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

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App