import { useState, useEffect, memo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { EXERCISES_DB } from './data/exercises'
import { supabase } from './supabaseClient'

// Importujemy nasze wydzielone komponenty
import BottomNav from './components/BottomNav'
import RestTimer from './components/RestTimer'
import Auth from './components/Auth'

// Importujemy widoki z nowego folderu 'views'
import HistoryTabRaw from './views/HistoryTab'
import ExercisesTabRaw from './views/ExercisesTab'
import WorkoutTab from './views/WorkoutTab' 
import CalendarTabRaw from './views/CalendarTab'
import ProfileTabRaw from './views/ProfileTab'

// PUNKT 3: Optymalizacja re-renderów przy użyciu React.memo
const HistoryTab = memo(HistoryTabRaw)
const ExercisesTab = memo(ExercisesTabRaw)
const CalendarTab = memo(CalendarTabRaw)
const ProfileTab = memo(ProfileTabRaw)

const MUSCLE_GROUPS = ['Wszystkie', 'Klatka piersiowa', 'Plecy', 'Nogi', 'Barki', 'Biceps', 'Triceps', 'Brzuch', 'Łydki', 'Inne']

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('workout')
  const [loadingData, setLoadingData] = useState(false)
  
  // PUNKT 2: Stan blokady przycisków (Loading state dla operacji asynchronicznych)
  const [isSaving, setIsSaving] = useState(false)
  
  // --- SYSTEM TOASTÓW ---
  const [toast, setToast] = useState(null); 
  const showToast = (message, type = 'info') => setToast({ message, type });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast])

  // --- SYSTEM MODALI ---
  const [confirmModal, setConfirmModal] = useState(null);
  const showConfirmationModal = (message, onConfirm, confirmText = 'Zatwierdź', cancelText = 'Anuluj', onCancel = null) => {
    setConfirmModal({ message, onConfirm, confirmText, cancelText, onCancel });
  }

  // --- STANY APLIKACJI ---
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [highlightedWorkoutId, setHighlightedWorkoutId] = useState(null)
  const [activeSetMenu, setActiveSetMenu] = useState(null) 
  
  const [timerActive, setTimerActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [defaultRestTime, setDefaultRestTime] = useState(180) 
  const [timerSource, setTimerSource] = useState(null)
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

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

  const [customTemplates, setCustomTemplates] = useState([])
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateExercises, setNewTemplateExercises] = useState([])

  const [isDarkMode, setIsDarkMode] = useState(false)
  const [measurements, setMeasurements] = useState([])
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)
  const [showMeasurementHistory, setShowMeasurementHistory] = useState(false)
  const [measForm, setMeasForm] = useState({ weight: '', waist: '', biceps: '' })
  const [userHeight, setUserHeight] = useState('') 
  
  const [showSummaryModal, setShowSummaryModal] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')

  const [isExFilterOpen, setIsExFilterOpen] = useState(false)
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false)
  const [isCreateExFilterOpen, setIsCreateExFilterOpen] = useState(false)

  const allExercises = [...EXERCISES_DB, ...customExercises]
  const allTemplates = [...customTemplates]

  // --- EFEKTY POBIERANIA ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    const fetchCloudData = async () => {
      setLoadingData(true);
      try {
        const { data: cloudWorkouts, error: wError } = await supabase.from('workouts').select('*').order('id', { ascending: false });
        if (wError) throw wError;
        if (cloudWorkouts) {
          setWorkoutHistory(cloudWorkouts);
          localStorage.setItem(`fitAppHistory_${uid}`, JSON.stringify(cloudWorkouts));
        }

        const { data: cloudTemplates, error: tError } = await supabase.from('templates').select('*');
        if (tError) throw tError;
        if (cloudTemplates) {
          setCustomTemplates(cloudTemplates);
          localStorage.setItem(`fitAppTemplates_${uid}`, JSON.stringify(cloudTemplates));
        }

        const { data: cloudMeasurements, error: mError } = await supabase.from('measurements').select('*').order('id', { ascending: false });
        if (mError) throw mError;
        if (cloudMeasurements) {
          setMeasurements(cloudMeasurements);
          localStorage.setItem(`fitAppMeasurements_${uid}`, JSON.stringify(cloudMeasurements));
        }

        const { data: cloudProfile } = await supabase.from('profiles').select('height').maybeSingle();
        if (cloudProfile) {
          setUserHeight(cloudProfile.height || '');
          localStorage.setItem(`fitAppHeight_${uid}`, cloudProfile.height || '');
        }
        
        showToast("Zsynchronizowano z chmurą! ☁️", "success");
      } catch (err) {
        console.error("Błąd sieci:", err);
        const savedHistory = localStorage.getItem(`fitAppHistory_${uid}`)
        if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory))
        const savedTemplates = localStorage.getItem(`fitAppTemplates_${uid}`)
        if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates))
        const savedMeasurements = localStorage.getItem(`fitAppMeasurements_${uid}`)
        if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements))
        const savedHeight = localStorage.getItem(`fitAppHeight_${uid}`)
        if (savedHeight) setUserHeight(savedHeight)
        showToast("Działasz w trybie offline 📴", "info");
      } finally {
        setLoadingData(false);
      }
    };
    fetchCloudData();

    const savedExercises = localStorage.getItem(`fitAppExercises_${uid}`)
    setCustomExercises(savedExercises ? JSON.parse(savedExercises) : [])
  }, [session?.user?.id])

  useEffect(() => {
    const savedTheme = localStorage.getItem('fitAppTheme')
    if (savedTheme === 'dark') { setIsDarkMode(true); document.documentElement.classList.add('dark'); }
  }, [])

  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft > 0) interval = setInterval(() => { setTimeLeft(prev => prev - 1) }, 1000)
    else if (timeLeft === 0) { setTimerActive(false); clearInterval(interval); }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  useEffect(() => {
    let interval = null
    if (isWorkoutActive && workoutStartTime) interval = setInterval(() => { setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000)) }, 1000)
    return () => clearInterval(interval)
  }, [isWorkoutActive, workoutStartTime])

  const toggleTheme = () => {
    if (isDarkMode) { document.documentElement.classList.remove('dark'); localStorage.setItem('fitAppTheme', 'light'); setIsDarkMode(false); }
    else { document.documentElement.classList.add('dark'); localStorage.setItem('fitAppTheme', 'dark'); setIsDarkMode(true); }
  }

  // --- ZARZĄDZANIE DANYMI ---
  const handleSaveMeasurement = async () => {
    if (!measForm.weight && !measForm.waist && !measForm.biceps) return showToast("Wpisz przynajmniej jedną wartość!", "error");
    
    setIsSaving(true); // WŁĄCZONA BLOKADA ZAPISU POMIARU
    try {
      const uid = session?.user?.id;
      const newMeas = { user_id: uid, date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), ...measForm };
      const updated = [newMeas, ...measurements];
      setMeasurements(updated);
      if (uid) {
        localStorage.setItem(`fitAppMeasurements_${uid}`, JSON.stringify(updated));
        const { error } = await supabase.from('measurements').insert(newMeas);
        if (error) showToast("Błąd zapisu w chmurze: " + error.message, "error");
        else showToast("Pomiary zapisane w chmurze! 📈", "success");
      }
      setMeasForm({ weight: '', waist: '', biceps: '' }); setShowMeasurementModal(false);
    } catch(e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  }

  const handleHeightChange = async (val) => {
    setUserHeight(val); const uid = session?.user?.id;
    if (uid) {
      localStorage.setItem(`fitAppHeight_${uid}`, val);
      await supabase.from('profiles').upsert({ id: uid, height: val });
    }
  }

  const handleSaveTemplateCloud = async (newTemplate) => {
    const updated = [...customTemplates, newTemplate]; setCustomTemplates(updated); const uid = session?.user?.id;
    if (uid) {
      localStorage.setItem(`fitAppTemplates_${uid}`, JSON.stringify(updated));
      const { error } = await supabase.from('templates').insert(newTemplate);
      if (error) showToast("Błąd chmury: " + error.message, "error");
      else showToast("Szablon planu zapisany! 📋", "success");
    }
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // --- TRENING LOGIKA ---
  const startWorkout = () => {
    setEditingWorkoutId(null); setIsWorkoutActive(true); setTimerSource(null); setWorkoutStartTime(Date.now()); setElapsedTime(0);
  }

  const startWorkoutFromTemplate = (template) => {
    setEditingWorkoutId(null); setCurrentWorkout(JSON.parse(JSON.stringify(template.exercises))); setIsWorkoutActive(true); setTimerSource(null); setWorkoutStartTime(Date.now()); setElapsedTime(0);
  }

  const cancelWorkout = () => {
    const msg = editingWorkoutId ? 'Czy chcesz porzucić edycję tego treningu?' : 'Czy na pewno chcesz anulować trening? Postęp zostanie utracony.';
    showConfirmationModal(msg, () => {
      setIsWorkoutActive(false); setCurrentWorkout([]); setTimerActive(false); setEditingWorkoutId(null); setTimerSource(null); setWorkoutStartTime(null); setElapsedTime(0);
    });
  }

  const finishWorkout = async () => {
    if (currentWorkout.length === 0) return showToast('Trening jest pusty! 🏋️‍♂️', 'error');

    const hasIncompleteSets = currentWorkout.some(ex => ex.sets.some(s => !s.isCompleted && (s.weight !== '' || s.reps !== '')));

    if (hasIncompleteSets) {
      showConfirmationModal(
        'Masz odznaczone serie z wpisanymi wartościami.\n\nCzy chcesz je automatycznie zatwierdzić i zapisać?',
        () => completeWorkoutSaving(true),
        'Zatwierdź i zapisz',
        'Odrzuć je i zapisz',
        () => completeWorkoutSaving(false)
      );
      return; 
    }
    completeWorkoutSaving(false);
  }

  const completeWorkoutSaving = async (wantsToComplete) => {
    let finalWorkoutData = [...currentWorkout];
    
    finalWorkoutData = finalWorkoutData.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => (!s.isCompleted && (s.weight !== '' || s.reps !== '')) ? (wantsToComplete ? { ...s, isCompleted: true } : s) : s).filter(s => s.isCompleted) 
    })).filter(ex => ex.sets.length > 0);

    if (finalWorkoutData.length === 0) {
      showToast('Brak ukończonych serii! Trening niezapisany.', 'error');
      setIsWorkoutActive(false); setCurrentWorkout([]); setTimerActive(false); setWorkoutStartTime(null); setElapsedTime(0); return;
    }

    let newPRsCount = 0; let workoutVolume = 0;
    finalWorkoutData.forEach(ex => {
      let currentMax1RM = -1;
      ex.sets.forEach(set => {
        const wgt = parseFloat(set.weight) || 0; const rps = parseInt(set.reps) || 0;
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
                const wgt = parseFloat(set.weight) || 0; const rps = parseInt(set.reps) || 0;
                const oneRM = wgt === 0 ? rps : wgt * (1 + rps / 30);
                if (oneRM > historicalMax1RM) historicalMax1RM = oneRM;
              }
            });
          }
        });
        if (currentMax1RM > historicalMax1RM) newPRsCount++;
      }
    });
    
    const uid = session?.user?.id; let updatedHistory = [...workoutHistory]; let finalWorkoutObj = null;

    if (editingWorkoutId) {
      updatedHistory = workoutHistory.map(w => w.id === editingWorkoutId ? { ...w, exercises: finalWorkoutData, duration: elapsedTime, prs: newPRsCount } : w);
      finalWorkoutObj = updatedHistory.find(w => w.id === editingWorkoutId);
    } else {
      finalWorkoutObj = { id: Date.now(), user_id: uid, date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }), duration: elapsedTime, prs: newPRsCount, exercises: finalWorkoutData };
      updatedHistory = [finalWorkoutObj, ...workoutHistory];
    }
    
    setWorkoutHistory(updatedHistory);
    if(uid) localStorage.setItem(`fitAppHistory_${uid}`, JSON.stringify(updatedHistory));

    if (uid && finalWorkoutObj) {
      setIsSaving(true); // WŁĄCZONA BLOKADA ZAPISU TRENINGU
      try {
        const { error } = await supabase.from('workouts').upsert(finalWorkoutObj);
        if (error) showToast(`Zapisano lokalnie. Błąd chmury: ${error.message}`, "error");
        else showToast("Trening potężnie zapisany w chmurze! 🚀", "success");
      } catch(e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }

    if (!editingWorkoutId) setShowSummaryModal({ duration: elapsedTime, volume: workoutVolume, prs: newPRsCount, exerciseCount: finalWorkoutData.length });
    setIsWorkoutActive(false); setCurrentWorkout([]); setTimerActive(false); setTimerSource(null); setWorkoutStartTime(null); setElapsedTime(0); setActiveSetMenu(null); setActiveTab('history');
  }

  const addExercise = (exercise) => {
    const defaultSet = [{ weight: '', reps: '', type: 'normal', isCompleted: false }]
    if (isCreatingTemplate) setNewTemplateExercises([...newTemplateExercises, { ...exercise, sets: defaultSet }])
    else setCurrentWorkout([...currentWorkout, { ...exercise, sets: defaultSet }])
    setShowExerciseModal(false); setSearchQuery('');
  }

  const removeExerciseFromWorkout = (indexToRemove) => {
    showConfirmationModal('Czy usunąć to ćwiczenie z treningu?', () => {
      setCurrentWorkout(currentWorkout.filter((_, idx) => idx !== indexToRemove))
      if (timerSource?.exercise === indexToRemove) { setTimerActive(false); setTimerSource(null); }
      else if (timerSource?.exercise > indexToRemove) setTimerSource({ exercise: timerSource.exercise - 1, set: timerSource.set })
    });
  }

  const handleCreateExercise = () => {
    if (!newExName.trim()) return;
    const newEx = { id: Date.now().toString(), name: newExName, target: newExTarget, description: newExDescription.trim() || undefined }
    const updatedCustom = [...customExercises, newEx]; const uid = session?.user?.id;
    setCustomExercises(updatedCustom);
    if(uid) localStorage.setItem(`fitAppExercises_${uid}`, JSON.stringify(updatedCustom))
    setNewExName(''); setNewExDescription(''); setShowCreateExercise(false); showToast("Własne ćwiczenie utworzone!", "success");
  }

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return showToast('Wpisz nazwę szablonu!', 'error');
    if (newTemplateExercises.length === 0) return showToast('Dodaj przynajmniej jedno ćwiczenie!', 'error');
    const newTemplate = { id: 'custom-' + Date.now(), user_id: session?.user?.id, name: newTemplateName, exercises: newTemplateExercises }
    handleSaveTemplateCloud(newTemplate); setNewTemplateName(''); setNewTemplateExercises([]); setIsCreatingTemplate(false);
  }

  const handleDeleteTemplate = async (e, templateId) => {
    e.stopPropagation()
    showConfirmationModal('Czy chcesz usunąć ten szablon?', async () => {
      const updated = customTemplates.filter(t => t.id !== templateId); setCustomTemplates(updated); const uid = session?.user?.id;
      if (uid) {
        localStorage.setItem(`fitAppTemplates_${uid}`, JSON.stringify(updated));
        const { error } = await supabase.from('templates').delete().eq('id', templateId);
        if(error) showToast(`Błąd chmury: ${error.message}`, "error"); else showToast("Szablon usunięty.", "info");
      }
    });
  }

  const handleEditPastWorkout = (workout) => {
    setEditingWorkoutId(workout.id); setCurrentWorkout(JSON.parse(JSON.stringify(workout.exercises))); setIsWorkoutActive(true); setWorkoutStartTime(null); setElapsedTime(workout.duration || 0); setActiveTab('workout');
  }

  const handleDeletePastWorkout = async (workoutId) => {
    showConfirmationModal('Czy na pewno bezpowrotnie usunąć ten trening?', async () => {
      const updated = workoutHistory.filter(w => w.id !== workoutId); setWorkoutHistory(updated); const uid = session?.user?.id;
      if (uid) {
        localStorage.setItem(`fitAppHistory_${uid}`, JSON.stringify(updated));
        const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
        if(error) showToast(`Błąd chmury: ${error.message}`, "error"); else showToast("Trening usunięty z historii.", "info");
      }
    });
  }

  const addSet = (eIndex) => {
    const newWorkout = [...currentWorkout]; newWorkout[eIndex].sets.push({ weight: '', reps: '', type: 'normal', isCompleted: false }); setCurrentWorkout(newWorkout);
  }

  const updateSet = (eIndex, sIndex, field, value) => {
    const newWorkout = [...currentWorkout]; newWorkout[eIndex].sets[sIndex][field] = value; setCurrentWorkout(newWorkout);
  }

  const toggleSetComplete = (eIndex, sIndex) => {
    const newWorkout = [...currentWorkout]; const isNowCompleted = !newWorkout[eIndex].sets[sIndex].isCompleted;
    newWorkout[eIndex].sets[sIndex].isCompleted = isNowCompleted; setCurrentWorkout(newWorkout);
    if (isNowCompleted) { setTimeLeft(defaultRestTime); setTimerActive(true); setTimerSource({ exercise: eIndex, set: sIndex }); } 
    else { if (timerSource?.exercise === eIndex && timerSource?.set === sIndex) { setTimerActive(false); setTimerSource(null); } }
  }

  const moveSet = (eIndex, sIndex, direction) => {
    const newWorkout = [...currentWorkout]; const sets = [...newWorkout[eIndex].sets];
    if (sIndex + direction < 0 || sIndex + direction >= sets.length) return;
    const temp = sets[sIndex]; sets[sIndex] = sets[sIndex + direction]; sets[sIndex + direction] = temp;
    newWorkout[eIndex].sets = sets; setCurrentWorkout(newWorkout); setActiveSetMenu(null);
  }

  const deleteSet = (eIndex, sIndex) => {
    showConfirmationModal('Czy usunąć tę serię?', () => {
      const newWorkout = [...currentWorkout]; newWorkout[eIndex].sets.splice(sIndex, 1);
      setCurrentWorkout(newWorkout); setActiveSetMenu(null);
    });
  }

  const addSetToTemplate = (eIndex) => {
    const newExs = [...newTemplateExercises]; newExs[eIndex].sets.push({ weight: '', reps: '', type: 'normal', isCompleted: false }); setNewTemplateExercises(newExs);
  }

  const handleUpdateName = async () => {
    if (!editNameValue.trim()) return setIsEditingName(false);
    try {
      const { error } = await supabase.auth.updateUser({ data: { username: editNameValue.trim() } })
      if (error) throw error
      setIsEditingName(false); showToast("Zmieniono nazwę profilu!", "success");
    } catch (error) { showToast('Błąd zmiany nazwy: ' + error.message, 'error'); }
  }

  const handleCalendarClick = (plDateStr) => {
    const targetWorkout = workoutHistory.find(w => w.date.startsWith(plDateStr));
    if (targetWorkout) {
      setActiveTab('history'); setHighlightedWorkoutId(targetWorkout.id);
      setTimeout(() => { const el = document.getElementById(`workout-${targetWorkout.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
      setTimeout(() => { setHighlightedWorkoutId(null); }, 2500);
    }
  }

  // --- ZABEZPIECZONE FUNKCJE OBLICZENIOWE (Derived State) ---
  let totalVolume = 0; let totalSets = 0
  workoutHistory.forEach(workout => {
    workout.exercises.forEach(ex => { ex.sets.forEach(set => { if (set.isCompleted && set.weight !== '' && set.reps !== '') { totalVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0); totalSets += 1; } }) })
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
      showToast("Twoja przeglądarka nie wspiera tej funkcji, ale zrób screena!", "info");
    }
  }

  const calculateStreaks = () => {
    if (workoutHistory.length === 0) return { current: 0, longest: 0 }
    const uniqueDates = Array.from(new Set(workoutHistory.map(w => { const d = new Date(w.id); d.setHours(0, 0, 0, 0); return d.getTime(); }))).sort((a, b) => b - a)
    if (uniqueDates.length === 0) return { current: 0, longest: 0 }
    let currentStreak = 0; const today = new Date(); today.setHours(0, 0, 0, 0); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const hasToday = uniqueDates.includes(today.getTime()); const hasYesterday = uniqueDates.includes(yesterday.getTime());
    if (hasToday || hasYesterday) {
      let checkTime = hasToday ? today.getTime() : yesterday.getTime()
      while (uniqueDates.includes(checkTime)) { currentStreak++; const nextDate = new Date(checkTime); nextDate.setDate(nextDate.getDate() - 1); checkTime = nextDate.getTime(); }
    }
    const chronological = [...uniqueDates].sort((a, b) => a - b); let maxStreak = 0; let currentCount = 0; let lastTime = null;
    chronological.forEach(time => {
      if (lastTime === null) { currentCount = 1 } else {
        const expectedNext = new Date(lastTime); expectedNext.setDate(expectedNext.getDate() + 1);
        if (time === expectedNext.getTime()) { currentCount++ } else if (time > expectedNext.getTime()) { currentCount = 1 }
      }
      if (currentCount > maxStreak) maxStreak = currentCount; lastTime = time;
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
      const dateOfThisDay = new Date(startOfWeek); dateOfThisDay.setDate(startOfWeek.getDate() + index); const dateStr = dateOfThisDay.toDateString()
      let blockLength = 0
      if (workoutDatesSet.has(dateStr)) {
        let fDate = new Date(dateOfThisDay); let bDate = new Date(dateOfThisDay); let bCount = 0, fCount = 0
        while(workoutDatesSet.has(bDate.toDateString())) { bCount++; bDate.setDate(bDate.getDate() - 1) }
        fDate.setDate(fDate.getDate() + 1)
        while(workoutDatesSet.has(fDate.toDateString())) { fCount++; fDate.setDate(fDate.getDate() + 1) }
        blockLength = bCount + fCount
      }
      return { dayName, hasWorkout: blockLength > 0, isToday: index === adjustedDay, streak: blockLength }
    })
  }

  const getYearlyCalendar = () => {
    const year = new Date().getFullYear(); const monthsData = []; const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate(); const firstDay = new Date(year, m, 1).getDay(); const startingBlanks = firstDay === 0 ? 6 : firstDay - 1; const days = []
      for (let i = 0; i < startingBlanks; i++) days.push(null)
      for (let i = 1; i <= daysInMonth; i++) {
        const dateOfThisDay = new Date(year, m, i); const dateStr = dateOfThisDay.toDateString(); const plDateStr = dateOfThisDay.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
        let blockLength = 0
        if (workoutDatesSet.has(dateStr)) {
          let fDate = new Date(dateOfThisDay); let bDate = new Date(dateOfThisDay); let bCount = 0, fCount = 0
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

  const selectedExObject = selectedExerciseDetail ? (allExercises.find(e => String(e.id) === String(selectedExerciseDetail.id) || e.name === selectedExerciseDetail.name) || selectedExerciseDetail) : null;

  const get1RMData = (exObj) => {
    if (!exObj) return []
    const data = []; const sortedHistory = [...workoutHistory].sort((a, b) => a.id - b.id) 
    sortedHistory.forEach(workout => {
      const ex = workout.exercises.find(e => String(e.id) === String(exObj.id) || e.name === exObj.name)
      if (ex) {
        let max1RM = 0
        ex.sets.forEach(set => {
          if (set.isCompleted && set.weight !== '' && set.reps !== '') {
            const wgt = parseFloat(set.weight) || 0; const rps = parseInt(set.reps) || 0;
            const oneRM = wgt === 0 ? rps : wgt * (1 + rps / 30);
            if (oneRM > max1RM) max1RM = oneRM
          }
        })
        if (max1RM > 0) { const shortDate = workout.date.split(' ').slice(0, 2).join(' '); data.push({ date: shortDate, '1RM': Math.round(max1RM) }) }
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
            const wgt = parseFloat(set.weight) || 0; const rps = parseInt(set.reps) || 0;
            const rm = wgt === 0 ? rps : wgt * (1 + rps / 30); const vol = wgt * rps;
            if (wgt > wMax) { wMax = wgt; maxWeightStr = `${wgt} kg × ${rps}`; } 
            else if (wgt === 0 && wMax <= 0) { if (wMax === -1 || rps > parseInt(maxWeightStr.split('×')[1] || 0)) { wMax = wgt; maxWeightStr = `${wgt} kg × ${rps}`; } }
            if (rm > rmMax) { rmMax = rm; max1RMStr = wgt === 0 ? `${rps} powt. (BW)` : `${Math.round(rm)} kg`; }
            if (vol > vMax) { vMax = vol; maxVolStr = `${vol} kg`; } 
            else if (wgt === 0 && vMax <= 0) { if (vMax === -1 || rps > vMax) { vMax = 0; maxVolStr = `${rps} powt. (BW)`; } }
          }
        });
      }
    });
  }

  const displayName = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Użytkownik';

  if (!session) return <Auth />

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col font-sans shadow-2xl relative overflow-hidden transition-colors duration-300">
      
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[85%] max-w-sm rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-fade-in-up border backdrop-blur-xl bg-opacity-95 ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-red-50' : toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-50' : 'bg-gray-900/90 border-gray-700 text-white'}`}>
          <span className="text-xl">{toast.type === 'success' ? '🔥' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span className="text-xs font-black tracking-wide leading-relaxed">{toast.message}</span>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[250] bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm flex flex-col gap-4 transform transition-all scale-100">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500 text-xl">⚠️</div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Zaraz, zaraz...</h3>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-xl px-2 cursor-pointer">✕</button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-pre-line leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => { if (confirmModal.onCancel) confirmModal.onCancel(); setConfirmModal(null); }} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">{confirmModal.cancelText}</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 cursor-pointer">{confirmModal.confirmText}</button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 transition-colors duration-300">
        <div className="flex flex-col">
          <h1 className="font-black text-gray-900 dark:text-white tracking-tight text-2xl flex items-center gap-2">
            {activeTab === 'history' && 'Historia'}
            {activeTab === 'exercises' && (selectedExerciseDetail ? 'Szczegóły' : 'Baza ćwiczeń')}
            {activeTab === 'workout' && !isWorkoutActive && !isCreatingTemplate && 'Trening'}
            {activeTab === 'workout' && isWorkoutActive && (editingWorkoutId ? 'Edycja' : 'Trwa trening')}
            {activeTab === 'workout' && isCreatingTemplate && 'Nowy szablon'}
            {activeTab === 'calendar' && 'Twój Rok'}
            {activeTab === 'profile' && 'Profil'}
            {loadingData && <span className="text-sm animate-spin">⏳</span>}
          </h1>
          {activeTab === 'workout' && isWorkoutActive && !editingWorkoutId && (
            <span className="text-xs font-bold text-blue-500 mt-0.5 flex items-center gap-1"><span className="animate-pulse">⏱️</span> {formatTime(elapsedTime)}</span>
          )}
        </div>
        {activeTab === 'workout' && isWorkoutActive && (
          <button disabled={isSaving} onClick={finishWorkout} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Mielenie...' : 'Zapisz'}
          </button>
        )}
        {activeTab === 'workout' && isCreatingTemplate && (
          <button disabled={isSaving} onClick={handleSaveTemplate} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            Zapisz
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-32 p-4 animate-fade-in-up relative">
        
        {showSummaryModal && (
          <div className="absolute inset-0 z-50 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col justify-center items-center p-6 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full text-center flex flex-col gap-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Trening Zakończony!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Dobra robota, {displayName}!</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col"><span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Czas</span><span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatTime(showSummaryModal.duration)}</span></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col"><span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Tonaż</span><span className="text-xl font-black text-green-600 dark:text-green-400">{showSummaryModal.volume} kg</span></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl flex flex-col col-span-2 border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10">
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase">Nowe Rekordy (PR)</span>
                  <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">🏆 {showSummaryModal.prs}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex gap-3">
                  <button onClick={shareWorkout} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    Udostępnij
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(`Właśnie ukończyłem trening w FitApp!\n⏱ Czas: ${formatTime(showSummaryModal.duration)}\n🏋️‍♂️ Tonaż: ${showSummaryModal.volume} kg\n🏆 Rekordy: ${showSummaryModal.prs}\nLecimy po więcej! 🔥`); showToast("Skopiowano! Wklej na IG/FB 📝", "success"); }} className="flex-1 bg-gray-900 dark:bg-black text-white font-bold py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Kopiuj
                  </button>
                </div>
                <button onClick={() => setShowSummaryModal(null)} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all cursor-pointer">Zamknij</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && !showSummaryModal && (
          <HistoryTab 
            workoutHistory={workoutHistory}
            highlightedWorkoutId={highlightedWorkoutId}
            handleEditPastWorkout={handleEditPastWorkout}
            handleDeletePastWorkout={handleDeletePastWorkout}
            formatTime={formatTime}
            setSelectedExerciseDetail={setSelectedExerciseDetail}
            setExerciseSubTab={setExerciseSubTab}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'exercises' && (
          <ExercisesTab 
            selectedExerciseDetail={selectedExerciseDetail}
            setSelectedExerciseDetail={setSelectedExerciseDetail}
            selectedExObject={selectedExObject}
            exerciseSubTab={exerciseSubTab}
            setExerciseSubTab={setExerciseSubTab}
            detailedChartData={detailedChartData}
            isDarkMode={isDarkMode}
            maxWeightStr={maxWeightStr}
            max1RMStr={max1RMStr}
            maxVolStr={maxVolStr}
            showCreateExercise={showCreateExercise}
            setShowCreateExercise={setShowCreateExercise}
            newExName={newExName}
            setNewExName={setNewExName}
            newExTarget={newExTarget}
            setNewExTarget={setNewExTarget}
            isCreateExFilterOpen={isCreateExFilterOpen}
            setIsCreateExFilterOpen={setIsCreateExFilterOpen}
            MUSCLE_GROUPS={MUSCLE_GROUPS}
            newExDescription={newExDescription}
            setNewExDescription={setNewExDescription}
            handleCreateExercise={handleCreateExercise}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isExFilterOpen={isExFilterOpen}
            setIsExFilterOpen={setIsExFilterOpen}
            selectedMuscleFilter={selectedMuscleFilter}
            setSelectedMuscleFilter={setSelectedMuscleFilter}
            filteredExercises={filteredExercises}
            addExercise={addExercise}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutTab 
            isWorkoutActive={isWorkoutActive}
            isCreatingTemplate={isCreatingTemplate}
            setIsCreatingTemplate={setIsCreatingTemplate}
            currentWorkout={currentWorkout}
            workoutHistory={workoutHistory}
            editingWorkoutId={editingWorkoutId}
            activeSetMenu={activeSetMenu}
            setActiveSetMenu={setActiveSetMenu}
            timerActive={timerActive}
            timerSource={timerSource}
            timeLeft={timeLeft}
            setTimeLeft={setTimeLeft}
            setTimerActive={setTimerActive}
            formatTime={formatTime}
            allTemplates={allTemplates}
            newTemplateName={newTemplateName}
            setNewTemplateName={setNewTemplateName}
            newTemplateExercises={newTemplateExercises}
            setNewTemplateExercises={setNewTemplateExercises}
            setShowExerciseModal={setShowExerciseModal}
            startWorkout={startWorkout}
            startWorkoutFromTemplate={startWorkoutFromTemplate}
            cancelWorkout={cancelWorkout}
            handleDeleteTemplate={handleDeleteTemplate}
            removeExerciseFromWorkout={removeExerciseFromWorkout}
            addSet={addSet}
            updateSet={updateSet}
            toggleSetComplete={toggleSetComplete}
            moveSet={moveSet}
            deleteSet={deleteSet}
            addSetToTemplate={addSetToTemplate}
            showConfirmationModal={showConfirmationModal}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab 
            yearlyData={yearlyData}
            handleCalendarClick={handleCalendarClick}
            getStreakColorClass={getStreakColorClass}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab 
            isEditingName={isEditingName}
            editNameValue={editNameValue}
            setEditNameValue={setEditNameValue}
            handleUpdateName={handleUpdateName}
            setIsEditingName={setIsEditingName}
            displayName={displayName}
            session={session}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            userHeight={userHeight}
            handleHeightChange={handleHeightChange}
            bmi={bmi}
            bmiColor={bmiColor}
            bmiCategory={bmiCategory}
            markerPos={markerPos}
            measurements={measurements}
            setShowMeasurementHistory={setShowMeasurementHistory}
            setShowMeasurementModal={setShowMeasurementModal}
            workoutHistory={workoutHistory}
            totalVolume={totalVolume}
            streaks={streaks}
            totalSets={totalSets}
            weeklyActivity={weeklyActivity}
            getStreakColorClass={getStreakColorClass}
            showConfirmationModal={showConfirmationModal}
            supabase={supabase}
          />
        )}
      </main>

      {/* GLOBALNE MODALE SZEFA */}
      {showMeasurementHistory && (
        <div className="absolute inset-0 z-[110] bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300 animate-fade-in-up">
          <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black dark:text-white tracking-tight">Historia pomiarów</h2>
            <button onClick={() => setShowMeasurementHistory(false)} className="text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-sm cursor-pointer">Zamknij</button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-10">
            {['weight', 'waist', 'biceps'].map(metric => {
              const label = metric === 'weight' ? 'Waga (kg)' : metric === 'waist' ? 'Pas (cm)' : 'Biceps (cm)';
              const color = metric === 'weight' ? '#2563eb' : metric === 'waist' ? '#16a34a' : '#dc2626';
              const mData = [...measurements].reverse().filter(m => m[metric]).map((m, index) => ({ id: index, date: m.date.slice(0, 5), fullDate: m.date, value: parseFloat(m[metric].replace(',','.')) }));
              if (mData.length === 0) return null;
              return (
                <div key={metric} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-extrabold text-gray-800 dark:text-gray-100 mb-5 text-sm uppercase tracking-widest">{label}</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mData}>
                        <defs><linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.5}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                        <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af', fontWeight: 'bold' }} tickFormatter={(id) => mData.find(d => d.id === id)?.date || ''} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#9ca3af', fontWeight: 'bold' }} width={30} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#374151', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }} labelStyle={{ fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', color: '#9ca3af', letterSpacing: '0.05em' }} labelFormatter={(id) => mData.find(d => d.id === id)?.fullDate || ''} formatter={(value) => [`${value}`, label.split(' ')[0]]} />
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

      {showMeasurementModal && (
        <div className="fixed inset-0 z-[120] bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md flex flex-col justify-center items-center p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Nowy pomiar</h2>
              <button onClick={() => setShowMeasurementModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl px-2 cursor-pointer">✕</button>
            </div>
            <div><label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Waga (kg)</label><input type="text" inputMode="decimal" value={measForm.weight} onChange={e => setMeasForm({...measForm, weight: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 82.5" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" /></div>
            <div><label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Obwód pasa (cm)</label><input type="text" inputMode="decimal" value={measForm.waist} onChange={e => setMeasForm({...measForm, waist: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 86" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" /></div>
            <div><label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Obwód bicepsa (cm)</label><input type="text" inputMode="decimal" value={measForm.biceps} onChange={e => setMeasForm({...measForm, biceps: e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')})} placeholder="np. 38.5" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all shadow-inner" /></div>
            
            <button disabled={isSaving} onClick={handleSaveMeasurement} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? 'Zapisywanie... ⏳' : 'Zapisz pomiar'}
            </button>
          </div>
        </div>
      )}

      {timerActive && activeTab !== 'workout' && !showExerciseModal && !showSummaryModal && !showMeasurementModal && !showMeasurementHistory && (
         <RestTimer timeLeft={timeLeft} setTimeLeft={setTimeLeft} setTimerActive={setTimerActive} formatTime={formatTime} variant="compact" />
      )}
      
      {showExerciseModal && (
        <div className="fixed inset-0 z-[100] w-full max-w-md mx-auto bg-white dark:bg-gray-900 flex flex-col transition-colors duration-300 shadow-2xl">
          <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black dark:text-white">Wybierz ćwiczenie</h2>
            <button onClick={() => { setShowExerciseModal(false); setSearchQuery(''); setIsModalFilterOpen(false); }} className="text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-sm cursor-pointer">Zamknij</button>
          </header>
          
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3 transition-colors duration-300 relative z-[110]">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Szukaj ćwiczenia..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-400 font-medium shadow-inner transition-colors" />
            <div className="relative">
              <div onClick={() => setIsModalFilterOpen(!isModalFilterOpen)} className="w-full bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 flex justify-between items-center cursor-pointer shadow-sm hover:shadow-md transition-all font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{selectedMuscleFilter === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : selectedMuscleFilter}</span>
                <span className={`text-xs text-gray-500 transition-transform duration-300 ${isModalFilterOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {isModalFilterOpen && (
                <><div className="fixed inset-0 z-[115]" onClick={() => setIsModalFilterOpen(false)}></div>
                  <div className="absolute top-full left-0 w-full mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] dark:shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] z-[120] overflow-hidden animate-fade-in-up p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                    {MUSCLE_GROUPS.map(g => {
                      const isActive = selectedMuscleFilter === g;
                      return (
                        <div key={g} onClick={() => { setSelectedMuscleFilter(g); setIsModalFilterOpen(false); }} className={`flex items-center justify-between px-4 py-3 text-sm font-bold cursor-pointer transition-all duration-300 rounded-xl border ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-800 shadow-sm'}`}>
                          <span>{g === 'Wszystkie' ? 'Wszystkie partie mięśniowe' : g}</span>{isActive && <span className="text-blue-500 dark:text-blue-400 text-lg leading-none">✓</span>}
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
              <div key={ex.id} className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center transition-all duration-300 animate-fade-in-up">
                <div className="flex flex-col flex-1" onClick={() => addExercise(ex)}>
                  <span className="font-bold text-gray-900 dark:text-white text-base">{ex.name}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg mt-2 w-max border border-indigo-100 dark:border-indigo-800/50">{ex.target}</span>
                </div>
                <button onClick={() => addExercise(ex)} className="w-8 h-8 rounded-full bg-gray-900 dark:bg-black border border-gray-700 shadow-inner flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 cursor-pointer shrink-0 ml-2">
                  <span className="text-xl font-black leading-none pb-0.5">+</span>
                </button>
              </div>
            ))}
            {filteredExercises.length === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 font-medium bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-dashed mt-4">Nie znaleziono ćwiczeń spełniających kryteria.</div>
            )}
          </div>
        </div>
      )}
      
      {!showExerciseModal && !showSummaryModal && !showMeasurementHistory && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  )
}

export default App