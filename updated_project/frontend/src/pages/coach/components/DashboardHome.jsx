// frontend/src/pages/coach/components/DashboardHome.jsx
import React from "react";

export default function DashboardHome({
  coachData,
  streak,
  showStreakAnimation,
  calculateProgress,
  getProgressColor,
  getStreakMessage
}) {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-4 md:p-8 lg:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg animate-bounce-slow">
                  👨‍🏫
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
                    Welcome back, {coachData.name}!
                  </h1>
                  <p className="text-indigo-100 flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {coachData.rating} Rating • {coachData.totalClients} Clients
                  </p>
                </div>
              </div>
            </div>

            <div className={`relative group ${showStreakAnimation ? 'animate-streak-pop' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition animate-pulse-slow"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-2xl transform group-hover:scale-105 transition">
                <div className="text-center">
                  <div className="text-5xl mb-2 animate-fire">🔥</div>
                  <div className="text-4xl font-black text-white mb-1">
                    {streak}
                  </div>
                  <div className="text-orange-100 text-sm font-semibold uppercase tracking-wider">
                    {getStreakMessage(streak)}
                  </div>
                </div>
                {showStreakAnimation && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg animate-bounce">
                    +1
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Coaching Streak Progress</h3>
        <div className="relative">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 transition-all duration-1000"
              style={{ width: `${((streak % 7 || 7) / 7) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Day {streak % 7 || 7}/7</span>
            <span>{streak % 7 === 0 ? "Weekly bonus reached! 🎉" : `${7 - (streak % 7)} days to weekly bonus`}</span>
          </div>
          <div className="flex justify-between mt-4">
            {[7, 30, 100, 365].map((milestone) => (
              <div key={milestone} className={`text-center ${streak >= milestone ? 'text-orange-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${streak >= milestone ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {streak >= milestone ? '🔥' : '🔒'}
                </div>
                <span className="text-xs font-medium">{milestone}d</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Clients */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-800 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">👥</span>
                <span className="text-xs font-bold px-2 py-1 bg-blue-500 text-white rounded-full">
                  {coachData.activeThisMonth || 0} this month
                </span>
              </div>
              <div className="mb-2">
                <div className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Total Clients</div>
                <div className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {coachData.totalClients}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  {coachData.activeThisMonth || 0} active this month
                </div>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-800 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">💰</span>
                <span className="text-xs font-bold px-2 py-1 bg-purple-500 text-white rounded-full">
                  {coachData.earningsThisMonth > 0 ? 'EGP' : '—'}
                </span>
              </div>
              <div className="mb-2">
                <div className="text-sm text-purple-700 dark:text-purple-300 font-semibold mb-1">Earnings</div>
                <div className="text-2xl md:text-3xl font-black text-purple-600 dark:text-purple-400">
                  {coachData.earningsThisMonth}
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                  This month (EGP)
                </div>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-800 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🏆</span>
                <span className="text-xs font-bold px-2 py-1 bg-amber-500 text-white rounded-full">
                  {coachData.successRate}%
                </span>
              </div>
              <div className="mb-2">
                <div className="text-sm text-amber-700 dark:text-amber-300 font-semibold mb-1">Success Rate</div>
                <div className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {coachData.successRate}%
                </div>
                <div className="text-xs text-amber-600/70 dark:text-amber-400/70">
                  Completed sessions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coach's Note */}
        {coachData.successRate > 90 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  💬 Coach's Insight
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Excellent performance this month! Keep up the great work with your clients.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* My Trainees Card */}
        <button onClick={() => window.location.hash = '/coach/users'} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-10 transition"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <span className="text-3xl">👥</span>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">My Trainees</h3>
            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">
              {coachData.totalClients}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor(calculateProgress(coachData.totalClients, 150))} transition-all duration-1000`}
                  style={{ width: `${calculateProgress(coachData.totalClients, 150)}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                {Math.round(calculateProgress(coachData.totalClients, 150))}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">of 150 client goal</p>
          </div>
        </button>

        {/* Bookings Card */}
        <button onClick={() => window.location.hash = '/coach/bookings'} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 transition"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <span className="text-3xl">📅</span>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Bookings</h3>
            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">
              Manage
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and manage sessions
            </p>
          </div>
        </button>

        {/* Chat Card */}
        <button onClick={() => window.location.hash = '/coach/chat'} className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left">
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <span className="text-3xl">💬</span>
              </div>
              <svg className="w-6 h-6 text-white/80 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Messages</h3>
            <p className="text-2xl font-black text-white mb-2">
              {coachData.unreadMessages}
            </p>
            <p className="text-sm text-emerald-100">
              Unread messages from clients
            </p>
          </div>
        </button>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        @keyframes fire {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }
        @keyframes streak-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-fire { animation: fire 2s ease-in-out infinite; }
        .animate-streak-pop { animation: streak-pop 0.5s ease-out; }
      `}</style>
    </div>
  );
}
