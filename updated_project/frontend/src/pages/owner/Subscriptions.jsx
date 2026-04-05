// src/pages/owner/Subscriptions.jsx
import { useState, useEffect } from "react";
import { apiRequest } from "../../services/httpClient";
import PageSpinner from "../../components/PageSpinner";

export default function Subscriptions() {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiRequest("/admin/membership-plans")
      .then(data => setPlans(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setError("Could not load subscription plans."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-2">{error}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Please try refreshing the page.</p>
    </div>
  );

  if (plans.length === 0) return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Plans</h2>
      <p className="text-gray-500 dark:text-gray-400">No subscription plans found.</p>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{plan.duration_days ? `${plan.duration_days} days` : plan.duration || ""}</p>
            <p className="text-green-600 dark:text-green-400 font-bold text-xl mt-2">
              {plan.price != null ? `${Number(plan.price).toLocaleString()} EGP` : "—"}
            </p>
            {plan.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{plan.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
