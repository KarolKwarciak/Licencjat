import React from 'react'

export default function CalendarTab({
  yearlyData,
  handleCalendarClick,
  getStreakColorClass
}) {
  return (
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
                <div key={`day-${item.day}`} className="flex justify-center items-center h-9" onClick={() => item.hasWorkout && handleCalendarClick(item.plDateStr)} style={{ cursor: item.hasWorkout ? 'pointer' : 'default' }}>
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all duration-300 rounded-lg ${item.hasWorkout ? 'hover:scale-110 shadow-sm border border-transparent' : 'border border-gray-100 dark:border-gray-700'} ${getStreakColorClass(item.streak, item.isToday, item.hasWorkout)}`}>{item.day}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}