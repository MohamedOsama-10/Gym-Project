// src/pages/coach/CoachDashboard.jsx
import React, { Suspense, useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ChatProvider } from "../../context/ChatContext";
import NotificationCenter from "../../components/NotificationCenter";
import ChatNotificationBridge from "../../components/chat/ChatNotificationBridge";
import coachAPI from "../../services/coachAPI";
import { apiRequest as httpRequest } from "../../services/httpClient";
import { useStreak, getStreakMessage } from "../../hooks/useStreak";
import DashboardErrorBoundary from "../../components/DashboardErrorBoundary";
import PageSpinner from "../../components/PageSpinner";
// FIX: Chat search extracted into its own component
import ChatSearch from "./components/ChatSearch";

// Lazy load components
const Users = React.lazy(() => import('./Users'));
const Bookings = React.lazy(() => import('./Bookings'));
const ChatPage = React.lazy(() => import('../../components/chat/ChatPage'));
const CoachProfile = React.lazy(() => import('./CoachProfile'));
const Programs = React.lazy(() => import('./Programs'));
const ProgramDetails = React.lazy(() => import('./ProgramDetails'));
const NewProgram = React.lazy(() => import('./NewProgram'));
const DashboardHome = React.lazy(() => import('./components/DashboardHome'));
const MyPackagesPage = React.lazy(() => import('./components/MyPackagesPage'));

export default React.memo(function CoachDashboard() {
  const navigate = useNavigate();

  const [coachData, setCoachData] = useState({
    name: "Loading...",
    rating: 0,
    totalClients: 0,
    unreadMessages: 0,
    earningsThisMonth: 0,
    successRate: 0,
    isLoading: true,
    error: null
  });

  // FIX: pass coachData.id so streak is scoped per user
  const { streak, showStreakAnimation } = useStreak(coachData.id);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const profile = await coachAPI.getProfile();
        const bookings = await coachAPI.getBookings({ limit: 200 });

        const totalClients = profile.total_clients || 0;
        const completedSessions = bookings.filter(b => b.status === 'attended').length;
        const decidedSessions   = bookings.filter(b => ['attended','cancelled','missed'].includes(b.status)).length;
        const successRate = decidedSessions > 0 ? Math.round((completedSessions / decidedSessions) * 100) : 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyCompleted = bookings.filter(b => {
          const bookingDate = new Date(b.session_date);
          return bookingDate >= startOfMonth && b.status === 'attended';
        });
        const earningsThisMonth = monthlyCompleted.reduce(
          (sum, b) => sum + (b.price || profile.hourly_rate || 0), 0
        );

        const activeThisMonth = new Set(
          bookings
            .filter(b => {
              const d = new Date(b.session_date);
              return d >= startOfMonth && ['confirmed', 'attended', 'upcoming'].includes(b.status);
            })
            .map(b => b.customer_id)
        ).size;

        let unreadMessages = 0;
        try {
          const convs = await httpRequest('/chat/conversations');
          unreadMessages = (convs || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        } catch (_) {}

        setCoachData({
          name: profile.name || profile.email,
          rating: profile.rating || 0,
          totalClients,
          activeThisMonth,
          unreadMessages,
          earningsThisMonth,
          successRate,
          isLoading: false,
          error: null,
          ...profile
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setCoachData(prev => ({ ...prev, isLoading: false, error: error.message }));
      }
    };

    fetchDashboardData();
  }, []);

  const calculateProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  const getProgressColor = (percentage) => {
    if (percentage < 50) return "from-red-500 to-red-600";
    if (percentage < 85) return "from-amber-500 to-orange-600";
    if (percentage <= 100) return "from-emerald-500 to-green-600";
    return "from-blue-500 to-indigo-600";
  };

  if (coachData.isLoading) return <PageSpinner />;

  if (coachData.error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Error loading dashboard</p>
          <p>{coachData.error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <ChatNotificationBridge />
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <Sidebar />
        <div className="flex-1 pt-16 md:pt-0 flex flex-col min-h-screen">
          <header className="relative z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Coach Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {coachData.name}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* FIX: Chat search is now a self-contained component */}
              <ChatSearch selfId={coachData.id} />
              <NotificationCenter />
              <button onClick={() => navigate('/coach/profile')} className="relative group">
                {coachData.avatar_url && <img src={coachData.avatar_url} alt={coachData.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500" onError={e => e.target.style.display='none'} />}
                <div className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center text-white text-sm font-bold ${coachData.avatar_url ? 'hidden' : 'flex'}`}>
                  {coachData.name ? coachData.name.charAt(0).toUpperCase() : 'C'}
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <DashboardErrorBoundary>
              <Suspense fallback={<PageSpinner />}>
                <Routes>
                  <Route index element={
                    <DashboardHome
                      coachData={coachData}
                      streak={streak}
                      showStreakAnimation={showStreakAnimation}
                      calculateProgress={calculateProgress}
                      getProgressColor={getProgressColor}
                      // FIX: use shared getStreakMessage instead of a local duplicate
                      getStreakMessage={getStreakMessage}
                    />
                  } />
                  <Route path="users" element={<Users coachData={coachData} />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="chat" element={<ChatPage userRole="coach" />} />
                  <Route path="profile" element={<CoachProfile coachData={coachData} />} />
                  <Route path="programs" element={<Programs />} />
                  <Route path="programs/new" element={<NewProgram />} />
                  <Route path="programs/:id" element={<ProgramDetails />} />
                  <Route path="packages" element={<MyPackagesPage />} />
                </Routes>
              </Suspense>
            </DashboardErrorBoundary>
          </main>
        </div>
      </div>
    </ChatProvider>
  );
});
