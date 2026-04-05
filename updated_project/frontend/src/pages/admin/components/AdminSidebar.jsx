import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../../../context/ChatContext";
import { useProfile } from "../../../context/ProfileContext";
import ThemeToggle from "../../../components/ThemeToggle";
import { apiRequest } from "../../../services/httpClient";

// ─── Shared nav definitions ───────────────────────────────────────────────────
// Single source of truth — both desktop and mobile sidebars map over this array.
// Badges are injected at render time via the badgeMap prop.
const NAV_ITEMS = [
  { path: "/admin",              icon: "🏠", label: "Dashboard",              end: true },
  { path: "/admin/users",        icon: "👥", label: "User Management" },
  { path: "/admin/branches",     icon: "🏢", label: "Branches" },
  { path: "/admin/coaches",      icon: "💪", label: "Coaches Directory" },
  { path: "/admin/memberships",  icon: "🎫", label: "Memberships",            badgeKey: "coachPkgs" },
  { path: "/admin/subscriptions",icon: "💰", label: "Finance & Subscriptions", badgeKey: "subRequests" },
  { path: "/admin/reports",      icon: "📊", label: "Reports & Analytics" },
  { path: "/admin/chat",         icon: "💬", label: "Messages",               badgeKey: "messages" },
  { path: "/admin/profile",      icon: "👤", label: "My Profile" },
];

function NavLink({ to, end, icon, label, badge }) {
  const { pathname } = useLocation();
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(to + '/');

  const linkClass = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
    isActive
      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
      : "text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 hover:text-white"
  }`;

  return (
    <Link to={to} className={linkClass}>
      <span className="text-lg w-5 text-center">{icon}</span>
      <span className="font-medium whitespace-nowrap flex-1">{label}</span>
      {badge > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
          isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"
        }`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function MobileAdminSidebar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-xl shadow-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />}
      <aside className={`md:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 dark:bg-gray-950 text-white flex flex-col z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div><h1 className="text-xl font-bold text-white">Admin Panel</h1></div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              <span className="text-lg w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => window.location.href = '/logout'}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminSidebar() {
  const navigate = useNavigate();
  // Use ProfileContext exclusively — no direct localStorage reads for user data
  const { profile } = useProfile();
  const { conversations } = useChat();

  const sidebarName     = profile?.name || profile?.full_name || 'Admin';
  const sidebarInitials = sidebarName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const sidebarRole     = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'Administrator';
  const sidebarAvatar   = profile?.avatar || profile?.avatar_url || null;

  const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const [pendingSubRequests, setPendingSubRequests] = useState(0);
  const [pendingCoachPkgs,   setPendingCoachPkgs]   = useState(0);

  useEffect(() => {
    const fetchCounts = () => {
      apiRequest('/admin/subscription-requests')
        .then(data => setPendingSubRequests(Array.isArray(data) ? data.filter(r => r.status === 'pending').length : 0))
        .catch(() => {});

      apiRequest('/admin/coach-packages?status=pending')
        .then(data => setPendingCoachPkgs(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Badge values keyed by NAV_ITEMS.badgeKey
  const badgeMap = {
    coachPkgs:   pendingCoachPkgs,
    subRequests: pendingSubRequests,
    messages:    totalUnreadMessages,
  };

  return (
    <aside className="hidden md:flex w-72 bg-gray-900 dark:bg-gray-950 text-white min-h-screen flex-col transition-colors duration-300">
      <div className="p-6 border-b border-gray-800 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-xs text-gray-400">Management System</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-800 dark:border-gray-800">
        <Link to="/admin/profile" className="flex items-center gap-3 px-2 hover:opacity-80 transition">
          {sidebarAvatar ? (
            <img src={sidebarAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-lg" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              {sidebarInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{sidebarName}</p>
            <p className="text-xs text-gray-400 capitalize">{sidebarRole}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            icon={item.icon}
            label={item.label}
            badge={item.badgeKey ? badgeMap[item.badgeKey] : 0}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-gray-800/50 dark:bg-gray-800/50">
          <span className="text-sm text-gray-300">Dark Mode</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => navigate('/logout')}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
