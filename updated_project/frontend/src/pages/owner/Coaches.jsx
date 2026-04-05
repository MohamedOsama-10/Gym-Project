// src/pages/owner/Coaches.jsx
import { useState, useEffect } from "react";
import { apiRequest, API_CONFIG, API_ORIGIN } from "../../services/httpClient";
import PageSpinner from "../../components/PageSpinner";


export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiRequest("/admin/users/?role=coach")
      .then(data => setCoaches(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setError("Could not load coaches."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-2">{error}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Please try refreshing the page.</p>
    </div>
  );

  if (coaches.length === 0) return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Coaches</h2>
      <p className="text-gray-500 dark:text-gray-400">No coaches found.</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Coaches</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coaches.map((coach) => {
          const avatarUrl = coach.avatar_url
            ? (coach.avatar_url.startsWith("http") ? coach.avatar_url : `${API_ORIGIN}${coach.avatar_url}`)
            : null;
          const initials = (coach.full_name || coach.email || "C")
            .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div key={coach.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt={coach.full_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{coach.full_name || "—"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{coach.email}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  coach.status === "Active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}>
                  {coach.status || "Unknown"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
