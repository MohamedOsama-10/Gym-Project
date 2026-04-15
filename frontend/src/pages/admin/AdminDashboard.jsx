import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { ChatProvider } from "../../context/ChatContext";
import ChatNotificationBridge from "../../components/chat/ChatNotificationBridge";
import NotificationCenter from "../../components/NotificationCenter";
import { useProfile } from "../../context/ProfileContext";
import { apiRequest, API_CONFIG } from "../../services/httpClient";

// Modularized Components
import { MobileAdminSidebar, AdminSidebar } from "./components/AdminSidebar";
import AdminHome from "./components/AdminHome";
import UserManagement from "./components/UserManagement";

// Lazy load larger components
const ChatPage = React.lazy(() => import("../../components/chat/ChatPage"));
const AdminProfile = React.lazy(() => import("./AdminProfile"));
const CoachesPage = React.lazy(() => import("./components/CoachesPage"));
const MembershipsPage = React.lazy(() => import("./components/MembershipsPage"));
const BranchManagement = React.lazy(() => import("./components/BranchManagement"));
const FinanceSubscriptionsPage = React.lazy(() => import("./components/FinanceSubscriptionsPage"));
const Reports = React.lazy(() => import("./components/Reports"));

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useProfile();
  const navigate = useNavigate();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const displayName = profile?.name || currentUser.full_name || currentUser.name || 'Admin';
  const displayEmail = profile?.email || currentUser.email || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const headerAvatar = profile?.avatar || profile?.avatar_url || null;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [userData, statsData] = await Promise.all([
          apiRequest('/admin/users/'),
          apiRequest('/admin/stats'),
        ]);
        setUsers(userData);
        setServerStats(statsData);
      } catch (err) { console.error("Error loading dashboard:", err); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const activities = [...users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)
    .map(u => ({
      id: u.id,
      icon: u.role === 'coach' ? '💪' : u.role === 'admin' ? '🛡️' : u.role === 'owner' ? '🏢' : '👤',
      user: u.full_name,
      action: 'joined as',
      target: u.role === 'user' ? 'Member' : u.role.charAt(0).toUpperCase() + u.role.slice(1),
      time: new Date(u.created_at).toLocaleDateString(),
    }));

  const stats = {
    totalUsers: serverStats?.total_users ?? users.length,
    activeMembers: serverStats?.active_members ?? users.filter(u => u.status === 'Active' && u.role === 'user').length,
    totalRevenue: serverStats?.total_revenue ?? 0,
    branches: serverStats?.total_branches ?? 0,
    coaches: serverStats?.total_coaches ?? users.filter(u => u.role === 'coach').length,
    pendingApprovals: serverStats?.pending_approvals ?? users.filter(u => u.status === 'Pending').length,
    activities,
  };

  return (
    <ChatProvider>
      <ChatNotificationBridge />
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
        <MobileAdminSidebar />
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-16 md:pt-0">
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
              </div>
              <div className="flex items-center gap-4">
                <NotificationCenter />
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayEmail}</p>
                  </div>
                  {headerAvatar ? (
                    <img src={headerAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-lg" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">{initials}</div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Routes>
                <Route index element={<AdminHome stats={stats} />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="branches" element={<BranchManagement />} />
                <Route path="coaches" element={<CoachesPage />} />
                <Route path="memberships" element={<MembershipsPage />} />
                <Route path="subscriptions" element={<FinanceSubscriptionsPage />} />
                <Route path="reports" element={<Reports />} />
                <Route path="chat" element={<ChatPage userRole="admin" />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </React.Suspense>
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
