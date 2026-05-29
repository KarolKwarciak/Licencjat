import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    if (!email.trim() || !password.trim() || (isRegister && !username.trim())) {
      setMessage({ text: 'Wypełnij wszystkie pola!', type: 'error' })
      setLoading(false)
      return
    }

    try {
      if (isRegister) {
        // Rejestracja z przekazaniem nazwy użytkownika w metadanych
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username.trim()
            }
          }
        })
        if (error) throw error
        setMessage({ text: 'Rejestracja pomyślna! Sprawdź maila, aby potwierdzić konto.', type: 'success' })
      } else {
        // Logowanie (wymaga tylko maila i hasła)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage({ text: error.localizedDescription || error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-gray-50 dark:bg-gray-950 flex flex-col justify-center p-6 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-6">
        
        {/* LOGO / NAGŁÓWEK */}
        <div className="text-center">
          <span className="text-4xl">💪</span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
            {isRegister ? 'Stwórz konto' : 'Witaj w FitApp'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {isRegister ? 'Zabezpiecz swoje treningi w chmurze' : 'Zaloguj się, aby synchronizować progres'}
          </p>
        </div>

        {/* KOMUNIKATY BŁĘDÓW / SUKCESÓW */}
        {message.text && (
          <div className={`p-3 rounded-xl text-xs font-bold text-center border ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400' 
              : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* FORMULARZ */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* POLE NAZWY UŻYTKOWNIKA (TYLKO REJESTRACJA) */}
          {isRegister && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Nazwa użytkownika</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Twój nick"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Adres E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj.email@gmail.com"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Hasło</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-sm mt-2 flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              isRegister ? 'Zarejestruj się' : 'Zaloguj się'
            )}
          </button>
        </form>

        {/* PRZEŁĄCZNIK WIDOKU */}
        <div className="text-center">
          <button 
            onClick={() => {
              setIsRegister(!isRegister)
              setMessage({ text: '', type: '' })
            }}
            className="text-xs text-blue-500 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {isRegister ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się za darmo'}
          </button>
        </div>

      </div>
    </div>
  )
}