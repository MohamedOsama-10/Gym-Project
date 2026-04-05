// src/pages/owner/Reports.jsx
// FIX: card layout extracted into shared <StatsGrid> — previously duplicated
// verbatim between this file and admin/components/Reports.jsx.
import { useState, useEffect } from "react";
import { apiRequest } from "../../services/httpClient";
import PageSpinner from "../../components/PageSpinner";
import StatsGrid from "../../components/StatsGrid";

export default function Reports() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiRequest("/admin/stats")
      .then(data => setStats(data))
      .catch(() => setError("Could not load report data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-2">{error}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Please try refreshing the page.</p>
    </div>
  );

  const cards = [
    { label: "Total Users",          value: stats?.total_users       ?? null, color: "text-blue-500"   },
    { label: "Active Subscriptions", value: stats?.active_members    ?? null, color: "text-green-500"  },
    { label: "Total Coaches",        value: stats?.total_coaches     ?? null, color: "text-purple-500" },
    { label: "Total Branches",       value: stats?.total_branches    ?? null, color: "text-orange-500" },
    { label: "Pending Approvals",    value: stats?.pending_approvals ?? null, color: "text-yellow-500" },
    {
      label: "Revenue This Month",
      value: stats?.total_revenue != null
        ? `${stats.total_revenue.toLocaleString()} EGP`
        : null,
      color: "text-teal-500",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Gym Reports</h2>
      <StatsGrid cards={cards} />
    </div>
  );
}
