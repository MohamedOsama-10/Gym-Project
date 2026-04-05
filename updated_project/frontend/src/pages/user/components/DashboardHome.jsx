// frontend/src/pages/user/components/DashboardHome.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const NutritionCard = React.memo(function NutritionCard({
  icon,
  label,
  current,
  goal,
  unit = 'g',
  colorScheme
}) {
  const percentage = useMemo(() => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  }, [current, goal]);

  const colors = {
    orange: {
      bg: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      accent: 'bg-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      subtext: 'text-orange-600/70 dark:text-orange-400/70',
      bar: 'from-orange-500 to-red-500',
      bgBar: 'bg-orange-200 dark:bg-orange-900'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      subtext: 'text-blue-600/70 dark:text-blue-400/70',
      bar: 'from-blue-500 to-indigo-500',
      bgBar: 'bg-blue-200 dark:bg-blue-900'
    },
    emerald: {
      bg: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      accent: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      subtext: 'text-emerald-600/70 dark:text-emerald-400/70',
      bar: 'from-emerald-500 to-green-500',
      bgBar: 'bg-emerald-200 dark:bg-emerald-900'
    },
    amber: {
      bg: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      accent: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      subtext: 'text-amber-600/70 dark:text-amber-400/70',
      bar: 'from-amber-500 to-yellow-500',
      bgBar: 'bg-amber-200 dark:bg-amber-900'
    }
  };

  const theme = colors[colorScheme] || colors.orange;
  const remaining = goal - current;
  const isOver = current > goal;

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl p-4 md:p-5 border-2 ${theme.border} hover:shadow-xl hover:scale-105 transition-all duration-300`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${theme.accent}/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl" role="img">{icon}</span>
          <span className={`text-xs font-bold px-2 py-1 ${isOver ? 'bg-red-500' : theme.accent} text-white rounded-full`}>
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="mb-2">
          <div className={`text-sm ${theme.subtext} font-semibold mb-1`}>{label}</div>
          <div className={`text-xl md:text-2xl font-black ${theme.text} truncate`}>{current}{unit}</div>
          <div className={`text-xs ${theme.subtext}`}>of {goal}{unit}</div>
        </div>
        <div className={`h-2.5 ${theme.bgBar} rounded-full overflow-hidden shadow-inner`}>
          <div className={`h-full bg-gradient-to-r ${isOver ? 'from-red-500 to-red-600' : theme.bar} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="mt-2 text-xs font-medium">
          {percentage >= 100 ? (
            <span className="text-green-600 dark:text-green-400">Goal reached! {isOver ? `+${Math.round(current - goal)}${unit} over` : ''}</span>
          ) : (
            <span className={theme.subtext}>{Math.round(remaining)}{unit} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
});

const QuickActionCard = React.memo(function QuickActionCard({ to, icon, title, subtitle, value, colorScheme = 'blue', isSpecial = false }) {
  const colors = {
    orange: 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
    blue: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
    purple: 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
    emerald: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
  };

  const content = (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className={`w-11 h-11 md:w-14 md:h-14 rounded-2xl ${isSpecial ? 'bg-white/20' : `bg-gradient-to-br ${colors[colorScheme]}`} flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
          <span className="text-2xl md:text-3xl">{icon}</span>
        </div>
        <svg className={`w-5 h-5 ${isSpecial ? 'text-white/80' : 'text-gray-400'} group-hover:text-white transition`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h3 className={`text-base md:text-lg font-bold ${isSpecial ? 'text-white' : 'text-gray-900 dark:text-white'} mb-1 truncate`}>{title}</h3>
      <p className={`text-xl md:text-3xl font-black ${isSpecial ? 'text-white' : 'text-gray-900 dark:text-white'} mb-1 truncate`}>{value}</p>
      <p className={`text-xs md:text-sm ${isSpecial ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'} line-clamp-2`}>{subtitle}</p>
    </div>
  );

  return (
    <Link to={to} className={`group relative overflow-hidden ${isSpecial ? `bg-gradient-to-br ${colors[colorScheme]}` : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 block`}>
      {!isSpecial && <div className={`absolute inset-0 bg-gradient-to-br ${colors[colorScheme]} opacity-0 group-hover:opacity-10 transition`}></div>}
      {isSpecial && <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>}
      {content}
    </Link>
  );
});

export default function DashboardHome({
  userData,
  streak,
  showStreakAnimation,
  getStreakMessage,
  bookings,
  getStatusColor
}) {
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-5 md:p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg animate-bounce-slow">👋</div>
                <div>
                  <h1 className="text-2xl md:text-3xl xl:text-4xl font-black text-white tracking-tight break-words">Welcome back, {userData.name}!</h1>
                  <p className="text-indigo-100 flex items-center gap-2 mt-1">
                    Coached by <span className="font-bold text-white">{userData.coachName}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className={`relative group ${showStreakAnimation ? 'animate-streak-pop' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 md:p-6 shadow-2xl transform group-hover:scale-105 transition">
                <div className="text-center">
                  <div className="text-3xl md:text-5xl mb-1 md:mb-2 animate-fire">🔥</div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1">{streak}</div>
                  <div className="text-orange-100 text-xs md:text-sm font-semibold uppercase tracking-wider">{getStreakMessage(streak)}</div>
                </div>
                {showStreakAnimation && <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg animate-bounce">+1</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {bookings.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Sessions</h3>
            <Link to="bookings" className="text-blue-600 hover:text-blue-500 text-sm font-medium">View All →</Link>
          </div>
          <div className="space-y-3">
            {bookings.filter(b => ['PENDING', 'CONFIRMED', 'UPCOMING'].includes(b.status?.toUpperCase())).slice(0, 3).map(booking => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">🗓️</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.session_date && new Date(`${booking.session_date}T${booking.session_time}`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">with Coach {booking.trainer_name || 'TBD'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Today's Nutrition Goals</h3>
          <Link to="meals" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">Log Meals →</Link>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
          <NutritionCard icon="🔥" label="Calories" current={userData.todaysNutrition.calories} goal={userData.nutritionGoals.calories} unit="" colorScheme="orange" />
          <NutritionCard icon="💪" label="Protein" current={userData.todaysNutrition.protein} goal={userData.nutritionGoals.protein} colorScheme="blue" />
          <NutritionCard icon="🌾" label="Carbs" current={userData.todaysNutrition.carbs} goal={userData.nutritionGoals.carbs} colorScheme="emerald" />
          <NutritionCard icon="🥑" label="Fats" current={userData.todaysNutrition.fats} goal={userData.nutritionGoals.fats} colorScheme="amber" />
        </div>
        {userData.nutritionGoals.notes && (
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 md:p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">💬</div>
              <div>
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1">Coach's Note</div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{userData.nutritionGoals.notes}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <QuickActionCard to="meals" icon="🍽️" title="Today's Meals" value={userData.todaysNutrition.calories} subtitle={`of ${userData.nutritionGoals.calories} kcal goal`} colorScheme="orange" />
        <QuickActionCard to="workouts" icon="💪" title="This Week" value={`${userData.weekStats.workoutsCompleted}/${userData.weekStats.workoutsGoal}`} subtitle="workouts completed" colorScheme="blue" />
        <QuickActionCard to="progress" icon="📈" title="Your Progress" value="View Stats" subtitle="View detailed stats & analytics" colorScheme="purple" />
        <QuickActionCard to="chat" icon="💬" title="Chat with Coach" value={userData.coachName} subtitle="Get instant support & guidance" colorScheme="emerald" isSpecial={true} />
      </section>
    </div>
  );
}
