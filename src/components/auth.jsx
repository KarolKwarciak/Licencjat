import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  // Pobieranie zapamiętanych danych przy starcie
  useEffect(() => {
    const savedEmail = localStorage.getItem('fitAppSavedEmail')
    const savedPassword = localStorage.getItem('fitAppSavedPassword')
    if (savedEmail && savedPassword) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    // Zapamiętywanie usera i hasła
    if (rememberMe) {
      localStorage.setItem('fitAppSavedEmail', email)
      localStorage.setItem('fitAppSavedPassword', password)
    } else {
      localStorage.removeItem('fitAppSavedEmail')
      localStorage.removeItem('fitAppSavedPassword')
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Rejestracja pomyślna! W celu pełnej aktywacji sprawdź swoją skrzynkę email.')
      }
    } catch (error) {
      setErrorMsg(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full relative z-10 animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg mx-auto flex items-center justify-center mb-4 transform -rotate-6">
            <span className="text-3xl">💪</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">FitApp</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            {isLogin ? 'Zaloguj się, aby kontynuować' : 'Zbuduj swoją formę z nami'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner"
              placeholder="twoj@email.com"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center mt-1 ml-1 cursor-pointer w-max" onClick={() => setRememberMe(!rememberMe)}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
              {rememberMe && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <span className="ml-2 text-xs font-bold text-gray-600 dark:text-gray-400 select-none">Nie wylogowuj mnie (zapamiętaj)</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all mt-4 disabled:opacity-70 cursor-pointer"
          >
            {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Stwórz konto')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
          </button>
        </div>

      </div>
    </div>
  )
}