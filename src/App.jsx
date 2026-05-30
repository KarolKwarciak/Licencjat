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
  
  // --- STANY DLA TRENINGU I HISTORII ---
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [highlightedWorkoutId, setHighlightedWorkoutId] = useState(null)
  const [activeSetMenu, setActiveSetMenu] = useState(null) 
  
  // --- TIMERY ---
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [defaultRestTime, setDefaultRestTime] = useState(180) 
  const [timerSource, setTimerSource] = useState(null)
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // --- STANY BAZY ĆWICZEŃ ---
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null)
  const [exerciseSubTab, setExerciseSubTab] = useState('opis')
  const [customExercises, setCustomExercises] = useState([])
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExTarget, setNewExTarget] = useState(MUSCLE_GROUPS[1])
  const [newExDescription, setNewExDescription] = useState('') 
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('Wszystkie')

  // --- SZABLONY ---
  const [customTemplates, setCustomTemplates] = useState([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateExercises, setNewTemplateExercises] = useState([])

  // --- STANY DODATKOWE ---
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [measurements, setMeasurements] = useState([])
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)
  const [showMeasurementHistory, setShowMeasurementHistory] = useState(false)
  const [measForm, setMeasForm] = useState({ weight: '', waist: '', biceps: '' })
  const [userHeight, setUserHeight] = useState('') 
  
  const [showSummaryModal, setShowSummaryModal] = useState(null)
  const [syncQueue, setSyncQueue] = useState([]) 
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')

  // --- STANY CUSTOMOWYCH DROPDOWNÓW ---
  const [isExFilterOpen, setIsExFilterOpen] = useState(false)
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false)
  const [isCreateExFilterOpen, setIsCreateExFilterOpen] = useState(false)

  const allExercises = [...EXERCISES_DB, ...customExercises]
  const allTemplates = [...customTemplates]

  // --- INICJALIZACJA SESJI ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // --- WCZYTYWANIE DANYCH PRZYPISANYCH DO KONKRETNEGO UŻYTKOWNIKA ---
  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    const savedHistory = localStorage.getItem(`fitAppHistory_${uid}`)
    setWorkoutHistory(savedHistory ? JSON.parse(savedHistory) : [])

    const savedExercises = localStorage.getItem(`fitAppExercises_${uid}`)
    setCustomExercises(savedExercises ? JSON.parse(savedExercises) : [])

    const savedTemplates = localStorage.getItem(`fitAppTemplates_${uid}`)
    setCustomTemplates(savedTemplates ? JSON.parse(savedTemplates) : [])

    const savedMeasurements = localStorage.getItem(`fitAppMeasurements_${uid}`)
    setMeasurements(savedMeasurements ? JSON.parse(savedMeasurements) : [])
    
    const savedQueue = localStorage.getItem(`fitAppSyncQueue_${uid}`)
    setSyncQueue(savedQueue ? JSON.parse(savedQueue) : [])

    const savedHeight = localStorage.getItem(`fitAppHeight_${uid}`)
    setUserHeight(savedHeight || '')
  }, [session?.user?.id])

  useEffect(() => {
    const savedTheme = localStorage.getItem('fitAppTheme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // --- TIMERY I STOPER TRENINGU ---
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

  // --- BEZPIECZNY ZAPIS DANYCH DLA KONKRETNEGO KONTA ---
  const saveHistoryToStorage = async (newHistory, newWorkoutObj = null) => {
    const uid = session?.user?.id;
    setWorkoutHistory(newHistory)
    if(uid) localStorage.setItem(`fitAppHistory_${uid}`, JSON.stringify(newHistory))

    if (newWorkoutObj && uid) {
      try {
        // Docelowy kod do Supabase
      } catch (err) {
        const updatedQueue = [...syncQueue, newWorkoutObj]
        setSyncQueue(updatedQueue)
        localStorage.setItem(`fitAppSyncQueue_${uid}`, JSON.stringify(updatedQueue))
      }
    }
  }

  const handleSaveMeasurement = () => {
    if (!measForm.weight && !measForm.waist && !measForm.biceps) {
      alert("Wpisz przynajmniej jedną wartość!")
      return;
    }
    const uid = session?.user?.id;
    const newMeas = { 
      date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), 
      ...measForm 
    };
    const updated = [newMeas, ...measurements];
    setMeasurements(updated)
    if(uid) localStorage.setItem(`fitAppMeasurements_${uid}`, JSON.stringify(updated))
    
    setMeasForm({ weight: '', waist: '', biceps: '' })
    setShowMeasurementModal(false)
  }

  const handleHeightChange = (val) => {
    setUserHeight(val)
    const uid = session?.user?.id;
    if(uid) localStorage.setItem(`fitAppHeight_${uid}`, val)
  }

  const saveTemplatesToStorage = (newTemplates) => {
    const uid = session?.user?.id;
    setCustomTemplates(newTemplates)
    if(uid) localStorage.setItem(`fitAppTemplates_${uid}`, JSON.stringify(newTemplates))
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // --- ZARZĄDZANIE TRENINGIEM ---
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

    let finalWorkoutData = [...currentWorkout];
    const hasIncompleteSets = currentWorkout.some(ex => 
      ex.sets.some(s => !s.isCompleted && (s.weight !== '' || s.reps !== ''))
    );

    if (hasIncompleteSets) {
      const wantsToComplete = window.confirm('Masz niezapisane serie z wpisanymi wartościami.\n\nKliknij OK, aby zapisać je jako ukończone. Kliknij Anuluj, aby je pominąć/odrzucić.');
      
      finalWorkoutData = finalWorkoutData.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => {
          if (!s.isCompleted && (s.weight !== '' || s.reps !== '')) {
            return wantsToComplete ? { ...s, isCompleted: true } : s;
          }
          return s;
        }).filter(s => s.isCompleted) 
      })).filter(ex => ex.sets.length > 0);
    } else {
      finalWorkoutData = finalWorkoutData.map(ex => ({
        ...ex,
        sets: ex.sets.filter(s => s.isCompleted)
      })).filter(ex => ex.sets.length > 0);
    }

    if (finalWorkoutData.length === 0) {
      alert('Brak ukończonych serii! Trening nie został zapisany.');
      setIsWorkoutActive(false)
      setCurrentWorkout([])
      setTimerActive(false)
      setTimerSource(null)
      setWorkoutStartTime(null)
      setElapsedTime(0)
      return;
    }

    let newPRsCount = 0;
    let workoutVolume = 0;

    finalWorkoutData.forEach(ex => {
      let currentMax1RM = -1;
      ex.sets.forEach(set => {
        const wgt = parseFloat(set.weight) || 0;
        const rps = parseInt(set.reps) || 0;
        workoutVolume += (wgt * rps);
        const oneRM = wgt === 0 ? rps : wgt * (1 + rps / 30);
        if (oneRM > currentMax1RM) currentMax1RM = oneRM;
      });

      if (currentMax1RM >= 0) {
        let historicalMax1RM = -1;
        workoutHistory.forEach(w => {
          if (editingWorkoutId && w.id === editingWorkoutId) return; 
          const histEx = w.exercises.find(e => String(e.id) === String(ex.id) || e.name === ex.name);
          if (histEx) {
            histEx.sets.forEach(set => {
              if (set.isCompleted && set.weight !== '' && set.reps !== '') {
                const wgt = parseFloat(set.weight) || 0;
                const rps = parseInt(set.reps) || 0;
                const oneRM = wgt === 0 ? rps : wgt * (1 + rps / 30);
                if (oneRM > historicalMax1RM) historicalMax1RM = oneRM;
              }
            });
          }
        });
        if (currentMax1RM > historicalMax1RM) newPRsCount++;
      }
    });
    
    let finalWorkoutObj = null;

    if (editingWorkoutId) {
      const updatedHistory = workoutHistory.map(w => {
        if (w.id === editingWorkoutId) return { ...w, exercises: finalWorkoutData, duration: elapsedTime, prs: newPRsCount }
        return w
      })
      saveHistoryToStorage(updatedHistory)
      setEditingWorkoutId(null)
    } else {
      finalWorkoutObj = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        duration: elapsedTime,
        prs: newPRsCount,
        exercises: finalWorkoutData
      }
      saveHistoryToStorage([finalWorkoutObj, ...workoutHistory], finalWorkoutObj)
    }
    
    if (!editingWorkoutId) {
      setShowSummaryModal({
        duration: elapsedTime,
        volume: workoutVolume,
        prs: newPRsCount,
        exerciseCount: finalWorkoutData.length
      })
    }

    setIsWorkoutActive(false)
    setCurrentWorkout([])
    setTimerActive(false)
    setTimerSource(null)
    setWorkoutStartTime(null)
    setElapsedTime(0)
    setActiveSetMenu(null)
    setActiveTab('history')
  }

  // --- ĆWICZENIA I SERIE ---
  const addExercise = (exercise) => {
    const defaultSet = [{ weight: '', reps: '', type: 'normal', isCompleted: false }]
    if (isCreatingTemplate) {
      setNewTemplateExercises([...newTemplateExercises, { ...exercise, sets: defaultSet }])
    } else {
      setCurrentWorkout([...currentWorkout, { ...exercise, sets: defaultSet }])
    }
    setShowExerciseModal(false)
    setSearchQuery('')
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
    const newEx = { id: Date.now().toString(), name: newExName, target: newExTarget, description: newExDescription.trim() || undefined }
    const updatedCustom = [...customExercises, newEx]
    const uid = session?.user?.id;
    setCustomExercises(updatedCustom)
    if(uid) localStorage.setItem(`fitAppExercises_${uid}`, JSON.stringify(updatedCustom))
    setNewExName(''); setNewExDescription(''); setShowCreateExercise(false)
  }

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return alert('Wpisz nazwę szablonu!')
    if (newTemplateExercises.length === 0) return alert('Dodaj przynajmniej jedno ćwiczenie!')
    const newTemplate = { id: 'custom-' + Date.now(), name: newTemplateName, exercises: newTemplateExercises }
    saveTemplatesToStorage([...customTemplates, newTemplate])
    setNewTemplateName('')
    setNewTemplateExercises([])
    setIsCreatingTemplate(false)
  }

  const handleDeleteTemplate = (e, templateId) => {
    e.stopPropagation()
    if (window.confirm('Czy chcesz usunąć ten szablon?')) saveTemplatesToStorage(customTemplates.filter(t => t.id !== templateId))
  }

  const handleEditPastWorkout = (workout) => {
    setEditingWorkoutId(workout.id)
    setCurrentWorkout(JSON.parse(JSON.stringify(workout.exercises)))
    setIsWorkoutActive(true)
    setWorkoutStartTime(null)
    setElapsedTime(workout.duration || 0)
    setActiveTab('workout') 
  }

  const handleDeletePastWorkout = (workoutId) => {
    if (window.confirm('Czy na pewno chcesz bezpowrotnie usunąć ten trening z historii?')) saveHistoryToStorage(workoutHistory.filter(w => w.id !== workoutId))
  }

  const addSet = (exerciseIndex) => {
    const newWorkout = [...currentWorkout]
    newWorkout[exerciseIndex].sets.push({ weight: '', reps: '', type: 'normal', isCompleted: false })
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
    } else {
      if (timerSource?.exercise === exerciseIndex && timerSource?.set === setIndex) {
        setTimerActive(false)
        setTimerSource(null)
      }
    }
  }

  const moveSet = (eIndex, sIndex, direction) => {
    const newWorkout = [...currentWorkout];
    const sets = [...newWorkout[eIndex].sets];
    
    if (sIndex + direction < 0 || sIndex + direction >= sets.length) return;
    
    const temp = sets[sIndex];
    sets[sIndex] = sets[sIndex + direction];
    sets[sIndex + direction] = temp;
    
    newWorkout[eIndex].sets = sets;
    setCurrentWorkout(newWorkout);
    setActiveSetMenu(null);
  }

  const deleteSet = (eIndex, sIndex) => {
    if(window.confirm('Czy na pewno usunąć tę serię?')) {
      const newWorkout = [...currentWorkout];
      newWorkout[eIndex].sets.splice(sIndex, 1);
      setCurrentWorkout(newWorkout);
      setActiveSetMenu(null);
    }
  }

  const addSetToTemplate = (exerciseIndex) => {
    const newExercises = [...newTemplateExercises]
    newExercises[exerciseIndex].sets.push({ weight: '', reps: '', type: 'normal', isCompleted: false })
    setNewTemplateExercises(newExercises)
  }

  const handleUpdateName = async () => {
    if (!editNameValue.trim()) { setIsEditingName(false); return }
    try {
      const { error } = await supabase.auth.updateUser({ data: { username: editNameValue.trim() } })
      if (error) throw error
      setIsEditingName(false)
    } catch (error) {
      alert('Błąd podczas zmiany nazwy: ' + error.message)
    }
  }

  const handleCalendarClick = (plDateStr) => {
    const targetWorkout = workoutHistory.find(w => w.date.startsWith(plDateStr));
    if (targetWorkout) {
      setActiveTab('history');
      setHighlightedWorkoutId(targetWorkout.id);
      setTimeout(() => {
        const el = document.getElementById(`workout-${targetWorkout.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      setTimeout(() => {
        setHighlightedWorkoutId(null);
      }, 2500);
    }
  }

  // --- STATYSTYKI ORAZ BMI ---
  let totalVolume = 0; let totalSets = 0
  workoutHistory.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.isCompleted && set.weight !== '' && set.reps !== '') {
          totalVolume += (parseFloat(set.weight) * parseInt(set.reps)); totalSets += 1
        }
      })
    })
  })

  const latestWeight = measurements.length > 0 ? parseFloat(measurements[0].weight?.replace(',','.')) : null;
  const heightInMeters = userHeight ? parseFloat(userHeight) / 100 : null;
  let bmi = null; let bmiColor = "text-gray-400"; let bmiCategory = "Brak danych"; let markerPos = 0;

  if (latestWeight && heightInMeters && latestWeight > 0 && heightInMeters > 0) {
    bmi = (latestWeight / (heightInMeters * heightInMeters)).toFixed(1);
    if (bmi < 18.5) { bmiColor = "text-blue-500"; bmiCategory = "Niedowaga"; }
    else if (bmi < 25) { bmiColor = "text-green-500"; bmiCategory = "Norma"; }
    else if (bmi < 30) { bmiColor = "text-yellow-500"; bmiCategory = "Nadwaga"; }
    else { bmiColor = "text-red-500"; bmiCategory = "Otyłość"; }
    markerPos = Math.min(100, Math.max(0, ((parseFloat(bmi) - 15) / 20) * 100));
  }

  const shareWorkout = () => {
    if (navigator.share && showSummaryModal) {
      navigator.share({
        title: 'Mój dzisiejszy trening 💪',
        text: `Właśnie ukończyłem świetny trening w FitApp!\n⏱ Czas: ${formatTime(showSummaryModal.duration)}\n🏋️‍♂️ Tonaż: ${showSummaryModal.volume} kg\n🏆 Nowe Rekordy: ${showSummaryModal.prs}\nLecimy po więcej! 🔥`,
      }).catch(console.error);
    } else {
      alert("Twoja przeglądarka nie wspiera funkcji bezpośredniego udostępniania, ale zrób screena i wrzucaj na stories!");
    }
  }

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
    let maxStreak = 0; let currentCount = 0; let lastTime = null

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
        const plDateStr = dateOfThisDay.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
        
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
        days.push({ day: i, hasWorkout: blockLength > 0, isToday: i === new Date().getDate() && m === new Date().getMonth() && year === new Date().getFullYear(), streak: blockLength, plDateStr })
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
          if (set.isCompleted && set.weight !== '' && set.reps !== '') {
            const wgt = parseFloat(set.weight) || 0;
            const rps = parseInt(set.reps) || 0;
            const oneRM = wgt === 0 ? rps : wgt * (1 + rps / 30);
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

  let maxWeightStr = "-"; let max1RMStr = "-"; let maxVolStr = "-";

  if (selectedExObject) {
    let wMax = -1; let rmMax = -1; let vMax = -1;
    workoutHistory.forEach(w => {
      const ex = w.exercises.find(e => String(e.id) === String(selectedExObject.id) || e.name === selectedExObject.name);
      if (ex) {
        ex.sets.forEach(set => {
          if (set.isCompleted && set.weight !== '' && set.reps !== '') {
            const wgt = parseFloat(set.weight) || 0;
            const rps = parseInt(set.reps) || 0;
            const rm = wgt === 0 ? rps : wgt * (1 + rps / 30);
            const vol = wgt * rps;

            if (wgt > wMax) { 
              wMax = wgt; 
              maxWeightStr = `${wgt} kg × ${rps}`; 
            } else if (wgt === 0 && wMax <= 0) {
              if (wMax === -1 || rps > parseInt(maxWeightStr.split('×')[1] || 0)) {
                wMax = wgt;
                maxWeightStr = `${wgt} kg × ${rps}`;
              }
            }

            if (rm > rmMax) { 
              rmMax = rm; 
              max1RMStr = wgt === 0 ? `${rps} powt. (BW)` : `${Math.round(rm)} kg`; 
            }

            if (vol > vMax) { 
              vMax = vol; 
              maxVolStr = `${vol} kg`; 
            } else if (wgt === 0 && vMax <= 0) {
              if (vMax === -1 || rps > vMax) {
                vMax = 0;
                maxVolStr = `${rps} powt. (BW)`;
              }
            }
          }
        });
      }
    });
  }

  const displayName = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Użytkownik';

  // --- ZABEZPIECZENIE AUTORYZACJĄ ---
  if (!session) return <Auth />

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
      
      {/* GLOBALNY NAGŁÓWEK */}
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

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <main className="flex-1 overflow-y-auto pb-32 p-4 animate-fade-in-up relative">
        
        {/* MODAL PODSUMOWANIA TRENINGU */}
        {showSummaryModal && (
          <div className="absolute inset-0 z-50 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col justify-center items-center p-6 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full text-center flex flex-col gap-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Trening Zakończony!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Dobra robota, {displayName}!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Czas</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatTime(showSummaryModal.duration)}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Tonaż</span>
                  <span className="text-xl font-black text-green-600 dark:text-green-400">{showSummaryModal.volume} kg</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col col-span-2 border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10">
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase">Nowe Rekordy (PR)</span>
                  <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">🏆 {showSummaryModal.prs}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <button onClick={shareWorkout} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">📸 Udostępnij wynik</button>
                <button onClick={() => setShowSummaryModal(null)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3.5 rounded-xl active:scale-95 transition-all">Zamknij</button>
              </div>
            </div>
          </div>
        )}

        {/* --- ZAKŁADKA HISTORIA - MAJESTATYCZNE KARTY --- */}
        {activeTab === 'history' && !showSummaryModal && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            {workoutHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <p>Brak zapisanych treningów.</p>
              </div>
            ) : (
              workoutHistory.map(workout => (
                <div 
                  id={`workout-${workout.id}`}
                  key={workout.id} 
                  className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl shadow-md transition-all duration-500 ${highlightedWorkoutId === workout.id ? 'border-blue-500 ring-4 ring-blue-500/30 scale-[1.02] shadow-blue-500/20' : 'border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg'}`}
                >
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none"></div>
                  
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
                          const pW = parseFloat(prev.weight) || 0;
                          const cW = parseFloat(curr.weight) || 0;
                          const prev1RM = pW === 0 ? parseInt(prev.reps) : pW * (1 + parseInt(prev.reps) / 30);
                          const curr1RM = cW === 0 ? parseInt(curr.reps) : cW * (1 + parseInt(curr.reps) / 30);
                          return curr1RM > prev1RM ? curr : prev;
                        })
                        bestSetStr = `${bestSet.weight} kg × ${bestSet.reps}`
                      }

                      return (
                        <div key={idx} className="flex justify-between items-center text-sm mb-2 border-b border-gray-100 dark:border-gray-700/50 pb-2 last:border-0 last:pb-0">
                          <div 
                            onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); setActiveTab('exercises'); }}
                            className="flex flex-1 items-center cursor-pointer overflow-hidden mr-3 group/ex"
                          >
                            <span className="text-gray-500 dark:text-gray-400 mr-3 text-[11px] font-black bg-gray-100 dark:bg-gray-900/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm group-hover/ex:text-blue-600 transition-colors">
                              {ex.sets.length}x
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate group-hover/ex:text-blue-600 dark:group-hover/ex:text-blue-400 transition-colors">
                              {ex.name}
                            </span>
                          </div>
                          <span className="font-black text-blue-600 dark:text-blue-400 text-[11px] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-800/50 shadow-sm whitespace-nowrap">
                            {bestSetStr}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- ZAKŁADKA BAZA ĆWICZEŃ --- */}
        {activeTab === 'exercises' && (
          selectedExerciseDetail ? (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button 
                onClick={() => setSelectedExerciseDetail(null)} 
                className="self-start text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span className="text-base leading-none">←</span> Wróć do bazy
              </button>
              
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{selectedExObject?.name || 'Nieznane ćwiczenie'}</h2>
                {selectedExObject && (
                  <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg uppercase border border-indigo-100 dark:border-indigo-800/50 shadow-sm tracking-wider">
                    {selectedExObject.target}
                  </span>
                )}
              </div>

              <div className="flex bg-gray-200/60 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
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
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
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
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
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
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up">
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-4">Twoje rekordy (PR):</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                       <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Największy ciężar:</span>
                       <span className="font-black text-gray-900 dark:text-white">{maxWeightStr}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                       <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Szacowane 1RM:</span>
                       <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{max1RMStr}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Max objętość (1 seria):</span>
                       <span className="font-black text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">{maxVolStr}</span>
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
              <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">NAZWA ĆWICZENIA</label>
                  <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} placeholder="np. Wyciskanie hantli na skosie" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner" />
                </div>
                
                <div className="relative z-40">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">PARTIA MIĘŚNIOWA</label>
                  <div 
                    onClick={() => setIsCreateExFilterOpen(!isCreateExFilterOpen)}
                    className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold"
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      {newExTarget}
                    </span>
                    <span className={`text-xs text-gray-500 transition-transform duration-300 ${isCreateExFilterOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                  
                  {isCreateExFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsCreateExFilterOpen(false)}></div>
                      <div className="absolute top-full left-0 w-full mt-2 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.15)] z-[120] overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                        {MUSCLE_GROUPS.filter(g => g !== 'Wszystkie').map(g => {
                          const isActive = newExTarget === g;
                          return (
                            <div 
                              key={g} 
                              onClick={() => { setNewExTarget(g); setIsCreateExFilterOpen(false); }} 
                              className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}
                            >
                              <span>{g}</span>
                              {isActive && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">OPIS I WSKAZÓWKI (OPCJONALNIE)</label>
                  <textarea value={newExDescription} onChange={e => setNewExDescription(e.target.value)} placeholder="Zanotuj tu wskazówki techniczne lub ustawienia maszyny..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all min-h-[80px] shadow-inner" />
                </div>
                <button onClick={handleCreateExercise} className="w-full bg-blue-600 dark:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all mt-2 cursor-pointer">Zapisz własne ćwiczenie</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button onClick={() => setShowCreateExercise(true)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all text-center cursor-pointer">+ Stwórz własne ćwiczenie</button>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-md relative z-40">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Szukaj ćwiczenia..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner" />
                
                <div className="relative">
                  <div 
                    onClick={() => setIsExFilterOpen(!isExFilterOpen)}
                    className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold"
                  >
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      {selectedMuscleFilter === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : selectedMuscleFilter}
                    </span>
                    <span className={`text-xs text-gray-500 transition-transform duration-300 ${isExFilterOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                  
                  {isExFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsExFilterOpen(false)}></div>
                      <div className="absolute top-full left-0 w-full mt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.15)] z-[120] overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                        {MUSCLE_GROUPS.map(g => {
                          const isActive = selectedMuscleFilter === g;
                          return (
                            <div 
                              key={g}
                              onClick={() => { setSelectedMuscleFilter(g); setIsExFilterOpen(false); }}
                              className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}
                            >
                              <span>{g === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : g}</span>
                              {isActive && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 relative z-30 pb-6">
                {filteredExercises.map(ex => (
                  <div 
                    key={ex.id} 
                    className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center transition-all duration-300"
                  >
                    <div onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); }} className="flex flex-col flex-1 cursor-pointer">
                      <span className="font-bold text-gray-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{ex.name}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg mt-2 w-max border border-indigo-100 dark:border-indigo-800/50">
                        {ex.target}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setSelectedExerciseDetail(ex); setExerciseSubTab('opis'); }}
                      className="w-8 h-8 rounded-full bg-gray-900 dark:bg-black border border-gray-700 shadow-inner flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 cursor-pointer shrink-0 ml-2"
                    >
                      <span className="font-black italic text-sm leading-none">i</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* --- ZAKŁADKA TRENING (SCHEMATY) --- */}
        {activeTab === 'workout' && (
          !isWorkoutActive && !isCreatingTemplate && (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <button 
                onClick={startWorkout}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                Rozpocznij pusty trening
              </button>
              <button 
                onClick={() => setIsCreatingTemplate(true)} 
                className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-700 font-bold py-3 rounded-2xl shadow-sm transition-colors" 
              >
                + Stwórz własny szablon planu
              </button>
              <div className="flex items-center gap-4 my-2">
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                <span className="text-gray-400 dark:text-gray-500 text-xs font-black tracking-widest uppercase">SZABLONY PLANÓW</span>
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
              </div>
              
              {allTemplates.length === 0 ? (
                <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
                  Brak szablonów. Stwórz swój pierwszy plan!
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-6">
                  {allTemplates.map(tpl => {
                    const totalSets = tpl.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
                    return (
                      <div 
                        key={tpl.id} 
                        className="relative w-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden"
                      >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div onClick={() => startWorkoutFromTemplate(tpl)} className="flex flex-col text-left flex-1 cursor-pointer">
                          <span className="text-lg font-black text-gray-900 dark:text-white mb-1.5 tracking-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{tpl.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">{tpl.exercises.length} ćwiczeń</span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50 shadow-sm">{totalSets} serii</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 relative z-10 shrink-0 ml-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(e, tpl.id); }} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 text-gray-400 dark:bg-black border border-gray-700 shadow-inner cursor-pointer transition-all duration-300 hover:bg-red-600 hover:text-white hover:border-red-500" 
                            title="Usuń szablon"
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); startWorkoutFromTemplate(tpl); }} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 text-gray-400 dark:bg-black border border-gray-700 shadow-inner cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:text-white hover:border-blue-500" 
                            title="Rozpocznij plan"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        )}

        {/* --- ZAKŁADKA TRENING (AKTYWNY) --- */}
        {activeTab === 'workout' && (
          isWorkoutActive && (
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
                      <button 
                        onClick={() => removeExerciseFromWorkout(eIndex)} 
                        className="text-gray-400 hover:text-red-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm"
                      >
                        Usuń
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-[8%_25%_18%_18%_16%_12%] gap-1 mb-3 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center px-2 py-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-xl relative z-10">
                      <div>Ser</div>
                      <div>Ostatnio</div>
                      <div>KG</div>
                      <div>Powt</div>
                      <div>Typ</div>
                      <div>Stat</div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 relative z-10">
                      {exercise.sets.map((set, sIndex) => {
                        const prevSet = prevSets[sIndex];
                        const setType = set.type || 'normal';

                        return (
                          <div key={sIndex} className="flex flex-col">
                            <div className={`grid grid-cols-[8%_25%_18%_18%_16%_12%] gap-1.5 items-center p-2 rounded-2xl transition-all duration-700 ease-out border ${set.isCompleted ? 'bg-green-50/80 dark:bg-green-900/30 border-green-200 dark:border-green-800/40 shadow-[inset_0_0_15px_rgba(34,197,94,0.1)]' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                              
                              <div 
                                className="flex items-center justify-center w-full h-full cursor-pointer"
                                onClick={() => setActiveSetMenu(activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex ? null : {eIndex, sIndex})}
                                title="Zarządzaj serią"
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-inner font-black text-xs transition-colors ${activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400'}`}>
                                  {sIndex + 1}
                                </div>
                              </div>
                              
                              <div className="flex justify-center">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-1 py-1.5 rounded-lg shadow-inner w-full text-center truncate">
                                  {prevSet ? `${prevSet.weight}x${prevSet.reps}` : '-'}
                                </span>
                              </div>
                              
                              <input 
                                type="text" inputMode="decimal" value={set.weight} 
                                onChange={(e) => updateSet(eIndex, sIndex, 'weight', e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'))} 
                                disabled={set.isCompleted} 
                                className={`text-center font-black rounded-xl p-2 w-full outline-none text-xs transition-all border ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400 border-transparent' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner'}`} 
                                placeholder="0" 
                              />
                              
                              <input 
                                type="text" inputMode="numeric" value={set.reps} 
                                onChange={(e) => updateSet(eIndex, sIndex, 'reps', e.target.value.replace(/[^0-9]/g, ''))} 
                                disabled={set.isCompleted} 
                                className={`text-center font-black rounded-xl p-2 w-full outline-none text-xs transition-all border ${set.isCompleted ? 'bg-transparent text-green-700 dark:text-green-400 border-transparent' : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner'}`} 
                                placeholder="0" 
                              />

                              <button
                                onClick={() => updateSet(eIndex, sIndex, 'type', setType === 'normal' ? 'warmup' : setType === 'warmup' ? 'failure' : 'normal')}
                                disabled={set.isCompleted}
                                className={`text-[11px] font-black rounded-xl p-2 w-full uppercase transition-all shadow-sm border flex items-center justify-center
                                ${setType === 'warmup' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50' 
                                : setType === 'failure' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50' 
                                : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                              >
                                {setType === 'warmup' ? 'W' : setType === 'failure' ? 'F' : '—'}
                              </button>
                              
                              <button 
                                onClick={() => toggleSetComplete(eIndex, sIndex)} 
                                className={`w-full flex items-center justify-center h-8 rounded-xl text-sm transition-all shadow-sm border ${set.isCompleted ? 'bg-green-500 text-white border-green-600 shadow-green-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                              >
                                ✓
                              </button>
                            </div>

                            {activeSetMenu?.eIndex === eIndex && activeSetMenu?.sIndex === sIndex && (
                              <div className="flex justify-between items-center bg-gray-800 dark:bg-gray-900 text-white p-2 rounded-xl mt-1 mb-1 animate-fade-in-up shadow-lg">
                                <button onClick={() => moveSet(eIndex, sIndex, -1)} disabled={sIndex === 0} className={`flex-1 font-bold text-xs py-1.5 transition-colors ${sIndex === 0 ? 'opacity-30' : 'hover:text-blue-400'}`}>↑ W górę</button>
                                <div className="w-px h-5 bg-gray-600 mx-2"></div>
                                <button onClick={() => moveSet(eIndex, sIndex, 1)} disabled={sIndex === exercise.sets.length - 1} className={`flex-1 font-bold text-xs py-1.5 transition-colors ${sIndex === exercise.sets.length - 1 ? 'opacity-30' : 'hover:text-blue-400'}`}>↓ W dół</button>
                                <div className="w-px h-5 bg-gray-600 mx-2"></div>
                                <button onClick={() => deleteSet(eIndex, sIndex)} className="flex-1 font-bold text-xs py-1.5 text-red-400 hover:text-red-300 transition-colors">🗑️ Usuń</button>
                              </div>
                            )}
                            
                            <div className={`grid transition-all duration-500 ease-in-out ${
                              timerSource?.exercise === eIndex && timerSource?.set === sIndex && timerActive
                                ? 'grid-rows-[1fr] opacity-100 mt-2' 
                                : 'grid-rows-[0fr] opacity-0 mt-0'
                            }`}>
                              <div className="overflow-hidden">
                                <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="inline" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <button onClick={() => addSet(eIndex)} className="w-full mt-3 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors uppercase tracking-wide border border-blue-100 dark:border-blue-800/50 relative z-10 shadow-sm">
                      + Dodaj serię
                    </button>
                  </div>
                )
              })}
              
              <button onClick={() => setShowExerciseModal(true)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-xl hover:bg-blue-700 hover:shadow-blue-500/20 transition-all mb-2 hover:-translate-y-0.5">
                + Dodaj ćwiczenie
              </button>
              
              <button onClick={cancelWorkout} className="w-full text-red-500 font-bold py-3 rounded-2xl bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm mb-4">
                {editingWorkoutId ? 'Porzuć edycję' : 'Anuluj trening'}
              </button>
            </div>
          )
        )}

        {/* --- ZAKŁADKA KALENDARZ --- */}
        {activeTab === 'calendar' && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 p-5 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
              <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Twój Rok Treningowy</span>
              <h2 className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-1">{yearlyData.year}</h2>
            </div>
            
            {yearlyData.months.map((month, mIdx) => (
              <div key={mIdx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-4">{month.name}</h3>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(d => <div key={d} className="text-[10px] font-black text-gray-400 dark:text-gray-500">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {month.days.map((item, idx) => {
                    if (item === null) return <div key={`blank-${idx}`} className="h-7"></div>
                    return (
                      <div 
                        key={`day-${item.day}`} 
                        className="flex justify-center items-center h-9"
                        onClick={() => item.hasWorkout && handleCalendarClick(item.plDateStr)}
                        style={{ cursor: item.hasWorkout ? 'pointer' : 'default' }}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all duration-300 rounded-lg ${item.hasWorkout ? 'hover:scale-110 shadow-sm border border-transparent' : 'border border-gray-100 dark:border-gray-700'} ${getStreakColorClass(item.streak, item.isToday, item.hasWorkout)}`}>
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

            {/* --- PRZYCISK ZMIANY MOTYWU Z IKONAMI 🌙 I ☀️ --- */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors duration-300">
              <div>
                <h2 className="font-extrabold text-gray-800 dark:text-gray-100 mb-0.5">Motyw aplikacji</h2>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Jasny lub Ciemny</p>
              </div>
              <button 
                onClick={toggleTheme} 
                className={`relative w-16 h-8 rounded-full flex items-center p-1 transition-colors duration-300 shadow-inner border border-gray-200 dark:border-gray-700 cursor-pointer ${isDarkMode ? 'bg-indigo-600 border-indigo-500' : 'bg-blue-100 border-blue-200'}`}
              >
                <div className="absolute w-full left-0 flex justify-between px-2 text-[11px] pointer-events-none z-0 select-none">
                  <span>🌙</span>
                  <span>☀️</span>
                </div>
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                 <h2 className="font-extrabold text-gray-800 dark:text-gray-100">Kalkulator BMI</h2>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Wzrost:</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={userHeight} 
                      onChange={(e) => handleHeightChange(e.target.value.replace(/[^0-9]/g, ''))} 
                      className="w-16 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-1.5 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 shadow-inner" 
                      placeholder="cm" 
                    />
                 </div>
              </div>

              {bmi ? (
                 <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-end mb-1">
                       <span className={`text-4xl font-black tracking-tighter ${bmiColor}`}>{bmi}</span>
                       <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-sm ${bmiColor}`}>{bmiCategory}</span>
                    </div>
                    <div className="relative w-full h-5 mt-3 mb-1">
                      <div className="absolute inset-y-1 left-0 right-0 rounded-full shadow-inner" style={{ background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 17.5%, #22c55e 17.5%, #22c55e 50%, #eab308 50%, #eab308 75%, #ef4444 75%, #ef4444 100%)' }}></div>
                      <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-gray-900 dark:border-white dark:bg-gray-800 rounded-full shadow-md transition-all duration-700 ease-out" style={{ left: `calc(${markerPos}% - 10px)` }}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase mt-1">
                       <span>15</span>
                       <span>18.5</span>
                       <span>25</span>
                       <span>30</span>
                       <span>35+</span>
                    </div>
                 </div>
              ) : (
                 <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 font-medium">Wpisz swój wzrost (wyżej) i dodaj najnowszą wagę w "Pomiarach", aby wygenerować wykres BMI.</div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-extrabold text-gray-800 dark:text-gray-100">Moje Pomiary</h2>
                <div className="flex gap-2">
                  {measurements.length > 0 && (
                    <button 
                      onClick={() => setShowMeasurementHistory(true)}
                      className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all px-3 py-1.5 rounded-xl hover:-translate-y-0.5"
                    >
                      Historia 📈
                    </button>
                  )}
                  <button 
                    onClick={() => setShowMeasurementModal(true)}
                    className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm hover:-translate-y-0.5"
                  >
                    + Dodaj
                  </button>
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
                  <p className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-1">TRENINGI</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{workoutHistory.length}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-[9px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest mb-1">TONAŻ (KG)</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalVolume}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-[9px] text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest mb-1">AKTUALNA SERIA</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.current} dni</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-[9px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest mb-1">REKORD SERII</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{streaks.longest} dni</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-center col-span-2 border border-gray-100 dark:border-gray-700">
                  <p className="text-[9px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest mb-1">UKOŃCZONE SERIE</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalSets}</p>
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
                    <span className={`text-[10px] uppercase tracking-wider transition-colors ${day.isToday ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-gray-400 dark:text-gray-500 font-bold'}`}>
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { if(window.confirm('Czy na pewno chcesz się wylogować?')) supabase.auth.signOut() }}
              className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 font-bold py-3.5 rounded-2xl active:scale-95 transition-all text-sm cursor-pointer mb-8 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              Wyloguj się
            </button>

          </div>
        )}
      </main>

      {/* --- MODAL DO HISTORII POMIARÓW --- */}
      {showMeasurementHistory && (
        <div className="absolute inset-0 z-[110] bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300 animate-fade-in-up">
          <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black dark:text-white tracking-tight">Historia pomiarów</h2>
            <button onClick={() => setShowMeasurementHistory(false)} className="text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-sm">Zamknij</button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
            {['weight', 'waist', 'biceps'].map(metric => {
              const label = metric === 'weight' ? 'Waga (kg)' : metric === 'waist' ? 'Pas (cm)' : 'Biceps (cm)';
              const color = metric === 'weight' ? '#2563eb' : metric === 'waist' ? '#16a34a' : '#dc2626';
              
              const mData = [...measurements].reverse().filter(m => m[metric]).map((m, index) => ({ 
                id: index,
                date: m.date.slice(0, 5), 
                fullDate: m.date,
                value: parseFloat(m[metric].replace(',','.')) 
              }));

              if (mData.length === 0) return null;

              return (
                <div key={metric} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-5 text-sm uppercase tracking-widest">{label}</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mData}>
                        <defs>
                          <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                        <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af', fontWeight: 'bold' }} tickFormatter={(id) => mData.find(d => d.id === id)?.date || ''} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af', fontWeight: 'bold' }} width={30} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#374151', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                          labelStyle={{ fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#9ca3af', letterSpacing: '0.05em' }}
                          labelFormatter={(id) => mData.find(d => d.id === id)?.fullDate || ''}
                          formatter={(value) => [`${value}`, label.split(' ')[0]]}
                        />
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={4} fillOpacity={1} fill={`url(#color${metric})`} dot={{ r: 5, fill: color, stroke: isDarkMode ? '#1f2937' : '#fff', strokeWidth: 3 }} activeDot={{ r: 8, fill: color, stroke: isDarkMode ? '#1f2937' : '#fff', strokeWidth: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODAL DO DODAWANIA POMIARÓW --- */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-[120] bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Nowy pomiar</h2>
              <button onClick={() => setShowMeasurementModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl px-2">✕</button>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Waga (kg)</label>
              <input type="text" inputMode="decimal" value={measForm.weight} onChange={e => setMeasForm({...measForm, weight: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 82.5" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Obwód pasa (cm)</label>
              <input type="text" inputMode="decimal" value={measForm.waist} onChange={e => setMeasForm({...measForm, waist: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 86" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Obwód bicepsa (cm)</label>
              <input type="text" inputMode="decimal" value={measForm.biceps} onChange={e => setMeasForm({...measForm, biceps: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 38.5" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" />
            </div>

            <button onClick={handleSaveMeasurement} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all mt-2 cursor-pointer">
              Zapisz pomiar
            </button>
          </div>
        </div>
      )}

      {/* POZOSTAŁE ELEMENTY PŁYWAJĄCE */}
      {timerActive && activeTab !== 'workout' && !showExerciseModal && !showSummaryModal && !showMeasurementModal && !showMeasurementHistory && (
         <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="compact" />
      )}
      
      {/* MODAL WYBORU ĆWICZEŃ */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-[100] w-full max-w-md mx-auto bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300 shadow-2xl">
          <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black dark:text-white">Wybierz ćwiczenie</h2>
            <button onClick={() => { setShowExerciseModal(false); setSearchQuery(''); setIsModalFilterOpen(false); }} className="text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-sm">Zamknij</button>
          </header>
          
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3 transition-colors duration-300 relative z-[110]">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Szukaj ćwiczenia..." 
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 font-medium shadow-inner transition-colors"
            />
            
            <div className="relative">
              <div 
                onClick={() => setIsModalFilterOpen(!isModalFilterOpen)}
                className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {selectedMuscleFilter === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : selectedMuscleFilter}
                </span>
                <span className={`text-xs text-gray-500 transition-transform duration-300 ${isModalFilterOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>
              
              {isModalFilterOpen && (
                <>
                  <div className="fixed inset-0 z-[115]" onClick={() => setIsModalFilterOpen(false)}></div>
                  <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] dark:shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] z-[120] overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                    {MUSCLE_GROUPS.map(g => {
                      const isActive = selectedMuscleFilter === g;
                      return (
                        <div 
                          key={g}
                          onClick={() => { setSelectedMuscleFilter(g); setIsModalFilterOpen(false); }}
                          className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}
                        >
                          <span>{g === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : g}</span>
                          {isActive && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-6 relative z-[90] bg-gray-50 dark:bg-gray-900 flex flex-col gap-3">
            {filteredExercises.map(ex => (
              <button 
                key={ex.id}
                onClick={() => addExercise(ex)}
                className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md flex justify-between items-center transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ex.name}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg mt-2 w-max border border-indigo-100 dark:border-indigo-800/50">{ex.target}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 shadow-inner flex items-center justify-center transition-colors">
                  <span className="text-blue-500 dark:text-blue-400 font-black text-xl leading-none pb-0.5">+</span>
                </div>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 font-medium bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed mt-4">
                Nie znaleziono ćwiczeń spełniających kryteria.
              </div>
            )}
          </div>
        </div>
      )}
      
      {!showExerciseModal && !showSummaryModal && !showMeasurementHistory && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  )
}

export default App