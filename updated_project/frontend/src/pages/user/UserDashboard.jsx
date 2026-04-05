// src/pages/user/UserDashboard.jsx
import React, { Suspense, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import Sidebar from "../../components/Sidebar";
import { ChatProvider } from "../../context/ChatContext";
import NotificationCenter from "../../components/NotificationCenter";
import ChatNotificationBridge from "../../components/chat/ChatNotificationBridge";
import Memberships from "./Memberships";
import CoachDirectory from "./CoachDirectory";
import DashboardErrorBoundary from "../../components/DashboardErrorBoundary";
import PageSpinner from "../../components/PageSpinner";
import { useStreak, getStreakMessage } from "../../hooks/useStreak";
import { readCompletedWorkoutDays } from "../../services/workoutStorage";

// Lazy load sub-pages
const Workouts = React.lazy(() => import('./Workouts'));
const Bookings = React.lazy(() => import('./Bookings'));
const Progress = React.lazy(() => import('./Progress'));
const Meals = React.lazy(() => import('./Meals'));
const ChatPage = React.lazy(() => import('../../components/chat/ChatPage'));
const UserProfile = React.lazy(() => import('./UserProfile'));
const DashboardHome = React.lazy(() => import('./components/DashboardHome'));

function toLocalDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default React.memo(function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, apiRequest } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [bookings, setBookings] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [workoutStats, setWorkoutStats] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { streak, showStreakAnimation } = useStreak(user?.id);
  const isFirstRender = useRef(true);

  const defaultNutrition = useMemo(() => ({
    goals: { calories: 2500, protein: 150, carbs: 300, fats: 80, notes: "Stay consistent!" },
    today: { calories: 0, protein: 0, carbs: 0, fats: 0 }
  }), []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, nutritionRes, workoutRes] = await Promise.all([
        apiRequest('/bookings/my-bookings').catch(() => []),
        apiRequest('/meals/logs/today').catch(() => null),
        apiRequest('/workouts/my-workouts/history?days=7').catch(() => null)
      ]);
      setBookings(bookingsRes || []);
      setNutrition(nutritionRes ? { goals: nutritionRes.goal || defaultNutrition.goals, today: nutritionRes.totals || defaultNutrition.today } : defaultNutrition);

      // FIX: Use server count when available; only fall back to localStorage
      // when the API returned nothing. Never add them — they track the same
      // events and summing causes double-counting.
      const serverWeekCount = workoutRes?.stats?.thisWeek ?? null;
      let weekCompleted = serverWeekCount;
      if (weekCompleted === null) {
        try {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
          startOfWeek.setHours(0, 0, 0, 0);
          const stored = readCompletedWorkoutDays(user?.id);
          weekCompleted = Object.values(stored).filter(
            v => v.completedAt && new Date(v.completedAt) >= startOfWeek
          ).length;
        } catch {
          weekCompleted = 0;
        }
      }
      setWorkoutStats({ completed: weekCompleted, total: workoutRes?.history?.length || 0 });
    } catch (err) { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, [apiRequest, defaultNutrition, user?.id]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const isDashboardHome = location.pathname === '/user' || location.pathname === '/user/';
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (isDashboardHome) loadDashboardData();
  }, [isDashboardHome, loadDashboardData]);

  const handleLogout = useCallback(async () => { await logout(); navigate("/login"); }, [logout, navigate]);

  const getStatusColor = (status) => {
    const colors = { 'PENDING': 'bg-yellow-500/20 text-yellow-400', 'CONFIRMED': 'bg-green-500/20 text-green-400', 'COMPLETED': 'bg-blue-500/20 text-blue-400', 'CANCELLED': 'bg-red-500/20 text-red-400', 'UPCOMING': 'bg-purple-500/20 text-purple-400', 'ATTENDED': 'bg-emerald-500/20 text-emerald-400' };
    return colors[status?.toUpperCase()] || 'bg-gray-500/20 text-gray-400';
  };

  const userData = useMemo(() => ({
    name: user?.full_name || "User",
    coachName: profile?.assigned_coach_name || "Not Assigned",
    nutritionGoals: nutrition?.goals || defaultNutrition.goals,
    todaysNutrition: nutrition?.today || defaultNutrition.today,
    weekStats: { workoutsCompleted: workoutStats.completed, workoutsGoal: 5 }
  }), [user?.full_name, profile, nutrition, workoutStats, defaultNutrition]);

  if (loading || profileLoading) return <PageSpinner />;

  return (
    <ChatProvider>
      <ChatNotificationBridge />
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <Sidebar />
        <div className="flex-1 pt-16 md:pt-0 flex flex-col min-h-screen">
          <header className="relative z-50 flex items-center justify-between gap-3 px-4 md:px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back!</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <button onClick={() => navigate('/user/profile')} className="relative group">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">{user?.full_name?.charAt(0) || 'U'}</div>}
              </button>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">Logout</button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <DashboardErrorBoundary>
              <Suspense fallback={<PageSpinner />}>
                <Routes>
                  <Route index element={
                    <DashboardHome
                      userData={userData}
                      streak={streak}
                      showStreakAnimation={showStreakAnimation}
                      getStreakMessage={getStreakMessage}
                      bookings={bookings}
                      getStatusColor={getStatusColor}
                    />
                  } />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="workouts" element={<Workouts />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="progress" element={<Progress />} />
                  <Route path="meals" element={<Meals />} />
                  <Route path="memberships" element={<Memberships />} />
                  <Route path="coaches" element={<CoachDirectory />} />
                  <Route path="chat" element={<ChatPage userRole="user" />} />
                </Routes>
              </Suspense>
            </DashboardErrorBoundary>
          </main>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </ChatProvider>
  );
});
