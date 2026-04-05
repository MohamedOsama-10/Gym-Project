// src/pages/owner/components/CoachesPageWrapper.jsx
// Extracted from OwnerDashboard — previously defined inline in the dashboard file.

import { useNavigate, useParams } from 'react-router-dom';
import CoachDirectory from '../../user/CoachDirectory';

export default function CoachesPageWrapper() {
  const navigate = useNavigate();
  const { branchId } = useParams();

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/owner/${branchId}`)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
      >
        Back
      </button>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold">Coach Directory</h2>
          <p>Browse and manage coaches for this branch</p>
        </div>
        <div className="p-6">
          <CoachDirectory />
        </div>
      </div>
    </div>
  );
}
