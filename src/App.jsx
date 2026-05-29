import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EXERCISES_DB } from './data/exercises'
import { supabase } from './supabaseClient'
import BottomNav from './components/BottomNav'
import RestTimer from './components/RestTimer'
import Auth from './components/Auth'

const MUSCLE_GROUPS = ['Wszystkie', 'Klatka piersiowa', 'Plecy', 'Nogi', 'Barki', 'Biceps', 'Triceps', 'Brzuch', 'Łydki', 'Inne']

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('workout')
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [defaultRestTime, setDefaultRestTime] = useState(180) 
  const [timerSource, setTimerSource] = useState(null)
  
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null)
  const [exerciseSubTab, setExerciseSubTab] = useState('opis')

  const [customExercises, setCustomExercises] = useState([])
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExTarget, setNewExTarget] = useState(MUSCLE_GROUPS[1])
  const [newExDescription, setNewExDescription] = useState('') 
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('Wszystkie')

  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [customTemplates, setCustomTemplates] = useState([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateExercises, setNewTemplateExercises] = useState([])

  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // STANY DO EDYCJI NAZWY PROFILU
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')

  const allExercises = [...EXERCISES_DB, ...customExercises]
  const allTemplates = [...customTemplates]

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

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

    let newPRsCount = 0;
    currentWorkout.forEach(ex => {
      let currentMax1RM = 0;
      ex.sets.forEach(set => {
        if (set.isCompleted && set.weight && set.reps) {
          const oneRM = parseFloat(set.weight) * (1 + parseInt(set.reps) / 30);
          if (oneRM > currentMax1RM) currentMax1RM = oneRM;
        }
      });

      if (currentMax1RM > 0) {
        let historicalMax1RM = 0;
        workoutHistory.forEach(w => {
          if (editingWorkoutId && w.id === editingWorkoutId) return; 
          const histEx = w.exercises.find(e => String(e.id) === String(ex.id) || e.name === ex.name);
          if (histEx) {
            histEx.sets.forEach(set => {
              if (set.isCompleted && set.weight && set.reps) {
                const oneRM = parseFloat(set.weight) * (1 + parseInt(set.reps) / 30);
                if (oneRM > historicalMax1RM) historicalMax1RM = oneRM;
              }
            });
          }
        });

        if (currentMax1RM > historicalMax1RM) {
          newPRsCount++;
        }
      }
    });
    
    if (editingWorkoutId) {
      const updatedHistory = workoutHistory.map(w => {
        if (w.id === editingWorkoutId) return { ...w, exercises: currentWorkout, duration: elapsedTime, prs: newPRsCount }
        return w
      })
      saveHistoryToStorage(updatedHistory)
      setEditingWorkoutId(null)
    } else {
      const newWorkout = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        duration: elapsedTime,
        prs: newPRsCount,
        exercises: currentWorkout
      }
      saveHistoryToStorage([newWorkout, ...workoutHistory])
    }
    
    if (newPRsCount > 0 && !editingWorkoutId) {
      setTimeout(() => alert(`Gratulacje! Pobiłeś ${newPRsCount} rekordów (PR) w tym treningu! 🔥🏆`), 300);
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
    setSearchQuery('')
    setSelectedMuscleFilter('Wszystkie')
  }

  const removeExerciseFromWorkout = (indexToRemove) => {
    if (window.confirm('Czy usunąć to ćwiczenie z obecnego treningu?')) {
      setCurrentWorkout(currentWorkout.filter((_, idx) => idx !== indexToRemove))
      if (timerSource?.exercise === indexToRemove) {
        setTimerActive(false)
        setTimerSource(null)
      } else if (timerSource?.exercise > indexToRemove) {
        setTimerSource({ exercise: timerSource.exercise - 1, set: timerSource.set })
      }
    }
  }

  const handleCreateExercise = () => {
    if (!newExName.trim()) return
    const newEx = { 
      id: Date.now().toString(), 
      name: newExName, 
      target: newExTarget,
      description: newExDescription.trim() || undefined
    }
    const updatedCustom = [...customExercises, newEx]
    setCustomExercises(updatedCustom)
    localStorage.setItem('fitAppExercises', JSON.stringify(updatedCustom))
    setNewExName('')
    setNewExDescription('')
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
    setWorkoutStartTime(null)
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
      setTimerSource({ exercise: exerciseIndex, set: setIndex })
    }
  }

  const addSetToTemplate = (exerciseIndex) => {
    const newExercises = [...newTemplateExercises]
    newExercises[exerciseIndex].sets.push({ weight: '', reps: '', isCompleted: false })
    setNewTemplateExercises(newExercises)
  }

  // --- ZAPISYWANIE NAZWY UŻYTKOWNIKA DO SUPABASE ---
  const handleUpdateName = async () => {
    if (!editNameValue.trim()) {
      setIsEditingName(false)
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: editNameValue.trim() }
      })
      if (error) throw error
      setIsEditingName(false)
    } catch (error) {
      alert('Błąd podczas zmiany nazwy: ' + error.message)
    }
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

  const calculateStreaks = () => {
    if (workoutHistory.length === 0) return { current: 0, longest: 0 }
    
    const uniqueDates = Array.from(new Set(workoutHistory.map(w => {
      const d = new Date(w.id)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }))).sort((a, b) => b - a)

    if (uniqueDates.length === 0) return { current: 0, longest: 0 }

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const hasToday = uniqueDates.includes(today.getTime())
    const hasYesterday = uniqueDates.includes(yesterday.getTime())

    if (hasToday || hasYesterday) {
      let checkTime = hasToday ? today.getTime() : yesterday.getTime()
      while (uniqueDates.includes(checkTime)) {
        currentStreak++
        const nextDate = new Date(checkTime)
        nextDate.setDate(nextDate.getDate() - 1)
        checkTime = nextDate.getTime()
      }
    }

    const chronological = [...uniqueDates].sort((a, b) => a - b)
    let maxStreak = 0
    let currentCount = 0
    let lastTime = null

    chronological.forEach(time => {
      if (lastTime === null) {
        currentCount = 1
      } else {
        const expectedNext = new Date(lastTime)
        expectedNext.setDate(expectedNext.getDate() + 1)
        if (time === expectedNext.getTime()) {
          currentCount++
        } else if (time > expectedNext.getTime()) {
          currentCount = 1
        }
      }
      if (currentCount > maxStreak) maxStreak = currentCount
      lastTime = time
    })

    return { current: currentStreak, longest: maxStreak }
  }

  const streaks = calculateStreaks()
  const workoutDatesSet = new Set(workoutHistory.map(w => new Date(w.id).toDateString()))

  const getWeeklyActivity = () => {
    const today = new Date(); const currentDay = today.getDay(); const adjustedDay = currentDay === 0 ? 6 : currentDay - 1
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - adjustedDay); startOfWeek.setHours(0, 0, 0, 0)
    const days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    
    return days.map((dayName, index) => {
      const dateOfThisDay = new Date(startOfWeek); dateOfThisDay.setDate(startOfWeek.getDate() + index)
      const dateStr = dateOfThisDay.toDateString()
      
      let blockLength = 0
      if (workoutDatesSet.has(dateStr)) {
        let fDate = new Date(dateOfThisDay)
        let bDate = new Date(dateOfThisDay)
        let bCount = 0, fCount = 0
        while(workoutDatesSet.has(bDate.toDateString())) { bCount++; bDate.setDate(bDate.getDate() - 1) }
        fDate.setDate(fDate.getDate() + 1)
        while(workoutDatesSet.has(fDate.toDateString())) { fCount++; fDate.setDate(fDate.getDate() + 1) }
        blockLength = bCount + fCount
      }
      return { dayName, hasWorkout: blockLength > 0, isToday: index === adjustedDay, streak: blockLength }
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
        
        let blockLength = 0
        if (workoutDatesSet.has(dateStr)) {
          let fDate = new Date(dateOfThisDay)
          let bDate = new Date(dateOfThisDay)
          let bCount = 0, fCount = 0
          while(workoutDatesSet.has(bDate.toDateString())) { bCount++; bDate.setDate(bDate.getDate() - 1) }
          fDate.setDate(fDate.getDate() + 1)
          while(workoutDatesSet.has(fDate.toDateString())) { fCount++; fDate.setDate(fDate.getDate() + 1) }
          blockLength = bCount + fCount
        }
        days.push({ day: i, hasWorkout: blockLength > 0, isToday: i === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear(), streak: blockLength })
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

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMuscle = selectedMuscleFilter === 'Wszystkie' || ex.target === selectedMuscleFilter
    return matchesSearch && matchesMuscle
  })

  const selectedExObject = selectedExerciseDetail 
    ? (allExercises.find(e => String(e.id) === String(selectedExerciseDetail.id) || e.name === selectedExerciseDetail.name) || selectedExerciseDetail) 
    : null;

  const get1RMData = (exObj) => {
    if (!exObj) return []
    const data = []; const sortedHistory = [...workoutHistory].sort((a, b) => a.id - b.id) 
    sortedHistory.forEach(workout => {
      const ex = workout.exercises.find(e => String(e.id) === String(exObj.id) || e.name === exObj.name)
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

  const weeklyActivity = getWeeklyActivity(); const yearlyData = getYearlyCalendar(); 
  const detailedChartData = selectedExObject ? get1RMData(selectedExObject) : []

  let maxWeightStr = "-";
  let max1RMStr = "-";
  let maxVolStr = "-";

  if (selectedExObject) {
    let wMax = 0; let rmMax = 0; let vMax = 0;
    workoutHistory.forEach(w => {
      const ex = w.exercises.find(e => String(e.id) === String(selectedExObject.id) || e.name === selectedExObject.name);
      if (ex) {
        ex.sets.forEach(set => {
          if (set.isCompleted && set.weight && set.reps) {
            const wgt = parseFloat(set.weight);
            const rps = parseInt(set.reps);
            const rm = wgt * (1 + rps / 30);
            const vol = wgt * rps;

            if (wgt > wMax) { wMax = wgt; maxWeightStr = `${wgt} kg × ${rps}`; }
            if (rm > rmMax) { rmMax = rm; max1RMStr = `${Math.round(rm)} kg`; }
            if (vol > vMax) { vMax = vol; maxVolStr = `${vol} kg`; }
          }
        });
      }
    });
  }

  const displayName = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Użytkownik';

  if (!session) {
    return <Auth />
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
      
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 transition-colors duration-300">
        <div className="flex flex-col">
          <h1 className="font-black text-gray-900 dark:text-white tracking-tight text-2xl">
            {activeTab === 'history' && 'Historia'}
            {activeTab === 'exercises' && (selectedExerciseDetail ? 'Szczegóły' : 'Baza ćwiczeń')}
            {activeTab === 'workout' && !isWorkoutActive && !isCreatingTemplate && 'Trening'}
            {activeTab === 'workout' && isWorkoutActive && (editingWorkoutId ? 'Edycja' : 'Trwa trening')}
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
          <button onClick={finishWorkout} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all">Zapisz</button>
        )}
        {activeTab === 'workout' && isCreatingTemplate && (
          <button onClick={handleSaveTemplate} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all">Zapisz</button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-32 p-4 animate-fade-in-up">
        
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
                  <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 items-center">
                    <span className="flex items-center gap-1">📅 {workout.date}</span>
                    {workout.duration > 0 && <span className="flex items-center gap-1">⏱️ {formatTime(workout.duration)}</span>}
                    {workout.prs > 0 && <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">🏆 {workout.prs} PR</span>}
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
                      <div key={idx} className="flex justify-between items-center text-sm mb-2 border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
                        <div 
                          onClick={() => {
                            setSelectedExerciseDetail(ex);
                            setExerciseSubTab('opis');
                            setActiveTab('exercises');
                          }}
                          className="group flex flex-1 items-center cursor-pointer overflow-hidden mr-3"
                        >
                          <span className="text-gray-500 dark:text-gray-400 mr-2 text-[10px] font-bold bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {ex.sets.length}x
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {ex.name}
                          </span>
                        </div>
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

        {activeTab === 'exercises' && (
          selectedExerciseDetail ? (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setSelectedExerciseDetail(null)} 
                className="self-start text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="text-base leading-none">←</span> Wróć do bazy
              </button>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">{selectedExObject?.name || 'Nieznane ćwiczenie'}</h2>
                {selectedExObject && (
                  <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full uppercase border border-blue-100 dark:border-blue-800">
                    {selectedExObject.target}
                  </span>
                )}
              </div>

              <div className="flex bg-gray-200/60 dark:bg-gray-800 p-1 rounded-xl">
                <button 
                  onClick={() => setExerciseSubTab('opis')} 
                  className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all ${exerciseSubTab === 'opis' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Opis i technika
                </button>
                <button 
                  onClick={() => setExerciseSubTab('progresja')} 
                  className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all ${exerciseSubTab === 'progresja' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Twój wykres
                </button>
                <button 
                  onClick={() => setExerciseSubTab('rekordy')} 
                  className={`flex-1 py-1.5 text-center text-[11px] font-black rounded-lg transition-all ${exerciseSubTab === 'rekordy' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Rekordy (PR)
                </button>
              </div>

              {exerciseSubTab === 'opis' ? (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-3">Jak prawidłowo wykonywać:</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedExObject?.description ? (
                      selectedExObject.description
                    ) : (
                      `Systematyczne wykonywanie tego ćwiczenia skutecznie stymuluje i rozwija partię: ${selectedExObject?.target}. Aby uzyskać optymalne efekty i uniknąć kontuzji, zadbaj o pełny zakres ruchu (ROM), kontrolowaną fazę ekscentryczną oraz stałe napięcie mięśniowe.`
                    )}
                  </p>
                </div>
              ) : exerciseSubTab === 'progresja' ? (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">Szacowane Maksimum (1RM)</h3>
                  {detailedChartData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={detailedChartData}>
                          <defs>
                            <linearGradient id="color1RMEx" x1="0" y1="0" x2="0" y2="1">
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
                          <Area type="monotone" dataKey="1RM" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#color1RMEx)" activeDot={{ r: 6, fill: '#2563eb', stroke: isDarkMode ? '#1f2937' : '#ffffff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm text-center">
                      <p>Brak ukończonych serii w historii dla tego ćwiczenia.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-4">Twoje rekordy (PR):</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                       <span className="text-gray-500 dark:text-gray-400 text-sm">Największy ciężar:</span>
                       <span className="font-black text-gray-900 dark:text-white">{maxWeightStr}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                       <span className="text-gray-500 dark:text-gray-400 text-sm">Szacowane 1RM:</span>
                       <span className="font-black text-blue-600 dark:text-blue-400">{max1RMStr}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 dark:text-gray-400 text-sm">Max objętość (1 seria):</span>
                       <span className="font-black text-green-600 dark:text-green-400">{maxVolStr}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : showCreateExercise ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button onClick={() => setShowCreateExercise(false)} className="self-start text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1">
                <span className="text-base leading-none">✕</span> Anuluj
              </button>
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">NAZWA ĆWICZENIA</label>
                  <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="np. Wyciskanie hantli na skosie" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">PARTIA MIĘŚNIOWA</label>
                  <select value={newExTarget} onChange={e => setNewExTarget(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 appearance-none">
                    {MUSCLE_GROUPS.filter(g => g !== 'Wszystkie').map(g => ( <option key={g} value={g}>{g}</option> ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block tracking-wider">OPIS I WSKAZÓWKI (OPCJONALNIE)</label>
                  <textarea value={newExDescription} onChange={e => setNewExDescription(e.target.value)} placeholder="Zanotuj tu wskazówki techniczne lub ustawienia maszyny..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]" />
                </div>
                <button onClick={handleCreateExercise} className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">Zapisz własne ćwiczenie</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button onClick={() => setShowCreateExercise(true)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all text-center cursor-pointer">+ Stwórz własne ćwiczenie</button>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 shadow-sm">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Szukaj ćwiczenia..." className="w-full bg-gray-100 dark:bg-gray-700 border border-transparent text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-colors" />
                <select value={selectedMuscleFilter} onChange={(e) => setSelectedMuscleFilter(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-transparent text-gray-800 dark:text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600 transition-colors font-medium appearance-none">
                  {MUSCLE_GROUPS.map(g => ( <option key={g} value={g}>{g === 'Wszystkie' ? 'Wszystkie partie' : g}</option> ))}
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 shadow-sm">
                {filteredExercises.map(ex => (
                  <button key={ex.id} onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); }} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 flex justify-between items-center transition-all cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ex.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ex.target}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 text-lg group-hover:translate-x-1 transition-transform">▶</span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* --- ZAKŁADKA TRENING --- */}
        {activeTab === 'workout' && (
          isWorkoutActive ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {currentWorkout.map((exercise, eIndex) => {
                const prevWorkout = workoutHistory.find(w => w.id !== editingWorkoutId && w.exercises.some(e => String(e.id) === String(exercise.id) || e.name === exercise.name));
                const prevExercise = prevWorkout ? prevWorkout.exercises.find(e => String(e.id) === String(exercise.id) || e.name === exercise.name) : null;
                const prevSets = prevExercise ? prevExercise.sets.filter(s => s.isCompleted && s.weight !== '' && s.reps !== '') : [];

                return (
                  <div key={eIndex} className="bg-white dark:bg-gray-900 p-3 pb-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 relative">
                    
                    <div className="flex justify-between items-start mb-4 px-2 pt-1">
                      <h2 className="font-extrabold text-gray-900 dark:text-white text-lg">{exercise.name}</h2>
                      <button 
                        onClick={() => removeExerciseFromWorkout(eIndex)} 
                        className="text-gray-400 hover:text-red-500 transition-colors px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs font-bold"
                      >
                        Usuń
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-[10%_28%_22%_22%_14%] gap-1 mb-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center px-1">
                      <div>Seria</div>
                      <div>Ostatnio</div>
                      <div>KG</div>
                      <div>Powt.</div>
                      <div>Stat</div>
                    </div>
                    
                    {exercise.sets.map((set, sIndex) => {
                      const prevSet = prevSets[sIndex];

                      return (
                        <div key={sIndex} className="flex flex-col mb-2">
                          <div className={`grid grid-cols-[10%_28%_22%_22%_14%] gap-1 items-center p-2 rounded-xl transition-colors ${set.isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/40'}`}>
                            
                            <div className="text-center font-bold text-gray-700 dark:text-gray-300">{sIndex + 1}</div>
                            
                            <div className="flex justify-center px-1">
                              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-1 py-1 rounded-md shadow-sm w-full text-center truncate">
                                {prevSet ? `${prevSet.weight} × ${prevSet.reps}` : '-'}
                              </span>
                            </div>
                            
                            <input 
                              type="text" 
                              inputMode="decimal"
                              value={set.weight} 
                              onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
                              disabled={set.isCompleted} 
                              className={`text-center font-semibold rounded-lg p-1.5 w-full outline-none transition-all ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'}`} 
                              placeholder="0" 
                            />
                            
                            <input 
                              type="text" 
                              inputMode="numeric"
                              value={set.reps} 
                              onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} 
                              disabled={set.isCompleted} 
                              className={`text-center font-semibold rounded-lg p-1.5 w-full outline-none transition-all ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'}`} 
                              placeholder="0" 
                            />
                            
                            <button 
                              onClick={() => toggleSetComplete(eIndex, sIndex)} 
                              className={`w-full flex items-center justify-center h-8 rounded-lg transition-all ${set.isCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                            >
                              ✓
                            </button>
                          </div>
                          
                          {timerActive && timerSource?.exercise === eIndex && timerSource?.set === sIndex && (
                            <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="inline" />
                          )}
                        </div>
                      )
                    })}
                    <button onClick={() => addSet(eIndex)} className="w-full mt-2 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors uppercase tracking-wide">
                      + Dodaj serię
                    </button>
                  </div>
                )
              })}
              
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
            
            {/* PANEL INFO O KONCIE Z MOŻLIWOŚCIĄ EDYCJI */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 transition-colors duration-300">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Konto aktywne</span>
              
              {isEditingName ? (
                <div className="flex gap-2 items-center mt-1">
                  <input 
                    type="text" 
                    value={editNameValue} 
                    onChange={e => setEditNameValue(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold"
                    placeholder="Wpisz nową nazwę..."
                    autoFocus
                  />
                  <button onClick={handleUpdateName} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">Zapisz</button>
                  <button onClick={() => setIsEditingName(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Anuluj</button>
                </div>
              ) : (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-white truncate">{displayName}</span>
                  <button 
                    onClick={() => { setEditNameValue(displayName); setIsEditingName(true); }} 
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Edytuj
                  </button>
                </div>
              )}
              
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{session?.user?.email}</span>
            </div>

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
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg text-center">
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">AKTUALNA SERIA</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.current} dni</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">REKORD SERII</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.longest} dni</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center col-span-2">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">UKOŃCZONE SERIE</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalSets}</p>
                </div>
              </div>
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

            <button 
              onClick={() => {
                if(window.confirm('Czy na pewno chcesz się wylogować?')) {
                  supabase.auth.signOut()
                }
              }}
              className="w-full bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 font-bold py-3 rounded-xl active:scale-95 transition-all text-sm cursor-pointer"
            >
              Wyloguj się
            </button>

          </div>
        )}
      </main>

      {timerActive && activeTab !== 'workout' && !showExerciseModal && (
         <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="compact" />
      )}
      
      {showExerciseModal && (
        <div className="absolute inset-0 z-[100] w-full max-w-md mx-auto bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300 shadow-2xl">
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
                className="w-full text-left p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col group cursor-pointer"
              >
                <span className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ex.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{ex.target}</span>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                Nie znaleziono ćwiczeń spełniających kryteria.
              </div>
            )}
          </div>
        </div>
      )}
      
      {!showExerciseModal && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  )
}

export default App