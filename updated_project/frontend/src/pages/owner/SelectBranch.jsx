// src/pages/owner/SelectBranch.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/httpClient";
import PageSpinner from "../../components/PageSpinner";

export default function SelectBranch() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBranches = useCallback(() => {
    setError(null);
    setLoading(true);
    apiRequest("/owner/branches")
      .then(data => setBranches(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setError("Could not load branches. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadBranches(); }, [loadBranches]);

  if (loading) return <PageSpinner />;

  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={loadBranches}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Choose Branch</h1>

      {branches.length === 0 ? (
        <p className="text-gray-500">No branches found. Add a branch from the admin panel.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div
              key={branch.id}
              onClick={() => navigate(`/owner/${branch.id}`)}
              className="cursor-pointer bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{branch.name}</h2>
              {branch.location && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{branch.location}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
