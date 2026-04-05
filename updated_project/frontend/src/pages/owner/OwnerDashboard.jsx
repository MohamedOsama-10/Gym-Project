// src/pages/owner/OwnerDashboard.jsx
import React, { useState, Suspense, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { ChatProvider } from "../../context/ChatContext";
import ChatNotificationBridge from "../../components/chat/ChatNotificationBridge";
import { useProfile } from "../../context/ProfileContext";
import NotificationCenter from "../../components/NotificationCenter";
import OwnerProfile from "./OwnerProfile";
import DashboardErrorBoundary from "../../components/DashboardErrorBoundary";
import PageSpinner from "../../components/PageSpinner";

// Extracted header sub-components (previously inline in this file)
import ProfileAvatar from "./components/ProfileAvatar";
import WelcomeHeader from "./components/WelcomeHeader";

// Lazy load modular components
const ChatPage = React.lazy(() => import("../../components/chat/ChatPage"));
const Branches = React.lazy(() => import("./components/Branches"));
const BranchHome = React.lazy(() => import("./components/BranchHome"));
const AdminManagement = React.lazy(() => import("./components/AdminManagement"));
const CoachesPageWrapper = React.lazy(() => import("./components/CoachesPageWrapper"));
const MembershipsPageWrapper = React.lazy(() => import("./components/MembershipsPageWrapper"));

function DashboardContent() {
  const { profile, loading, isReady, error, refreshProfile } = useProfile();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !isReady) {
      const timer = setTimeout(() => setTimeoutReached(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [loading, isReady]);

  if ((loading || !isReady) && !timeoutReached) return <PageSpinner />;
  if (timeoutReached || error || !profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Problem loading profile</h2>
        <button
          onClick={() => { setTimeoutReached(false); refreshProfile?.(); }}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg mr-2"
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route index element={<Branches />} />
          <Route path="profile" element={<OwnerProfile />} />
          <Route path=":branchId" element={<BranchHome />} />
          <Route path=":branchId/coaches" element={<CoachesPageWrapper />} />
          <Route path=":branchId/subscriptions" element={<MembershipsPageWrapper />} />
          <Route path=":branchId/admins" element={<AdminManagement />} />
          <Route path="chat" element={<ChatPage userRole="owner" />} />
          <Route path="*" element={<Navigate to="/owner" replace />} />
        </Routes>
      </Suspense>
    </DashboardErrorBoundary>
  );
}

export default function OwnerDashboard() {
  return (
    <ChatProvider>
      <ChatNotificationBridge />
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <WelcomeHeader />
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <ProfileAvatar />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto relative">
            <DashboardContent />
          </main>
        </div>
      </div>
    </ChatProvider>
  );
}
