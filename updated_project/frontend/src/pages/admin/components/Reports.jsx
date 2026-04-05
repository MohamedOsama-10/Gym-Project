import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, finData, usersData, coachesData] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/financial-stats'),
        apiRequest('/admin/users/'),
        apiRequest('/admin/coaches/'),
      ]);
      setData({ statsData, finData, usersData, coachesData });
      setRefreshedAt(new Date());
    } catch (e) { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = data?.statsData ?? {};
  const fin = data?.finData ?? {};
  const users = data?.usersData ?? [];
  const coaches = data?.coachesData ?? [];

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const statusCounts = users.reduce((acc, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {});
  const availableCoaches = coaches.filter(c => c.status === 'Active').length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRegs = users.filter(u => u.created_at && new Date(u.created_at) > sevenDaysAgo).length;
  const branches = fin.branches ?? [];

  // FIX: Null-coalesce to null (not 0 or users.length) so the UI shows "—"
  // when the stats endpoint is down, rather than silently displaying wrong figures.
  const statCards = [
    { label: 'Total Users',          value: stats.total_users        ?? null,                                                           color: 'blue',    icon: '👥' },
    { label: 'Active Members',       value: stats.active_members     ?? null,                                                           color: 'green',   icon: '✅' },
    { label: 'Total Coaches',        value: stats.total_coaches      ?? null,                                                           color: 'purple',  icon: '🏋️' },
    { label: 'Total Branches',       value: stats.total_branches     ?? null,                                                           color: 'orange',  icon: '🏢' },
    { label: 'Total Revenue',        value: fin.total_revenue != null ? `${fin.total_revenue.toLocaleString()} EGP` : null,             color: 'emerald', icon: '💰' },
    { label: 'Active Subscriptions', value: fin.active_subscriptions ?? null,                                                           color: 'teal',    icon: '🎫' },
    { label: 'New This Week',        value: recentRegs,                                                                                 color: 'indigo',  icon: '🆕' },
    { label: 'Pending Approvals',    value: stats.pending_approvals  ?? null,                                                           color: 'yellow',  icon: '⏳' },
  ];

  const colorMap = {
    blue: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-blue-800 text-purple-600 dark:text-purple-400',
    orange: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    emerald: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    teal: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400',
    indigo: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
    yellow: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl shadow-2xl p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Reports & Analytics</h2>
            <p className="text-orange-100">Live system overview{refreshedAt && <span className="ml-2 opacity-70 text-sm">· Updated {refreshedAt.toLocaleTimeString()}</span>}</p>
          </div>
          <button onClick={load} disabled={loading} className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition shadow-lg flex items-center gap-2">
            🔄 {loading ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${colorMap[card.color]} rounded-2xl p-5 border-2 hover:shadow-lg transition-all`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-black">{card.value}</div>
            <div className="text-xs font-semibold opacity-60 mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
