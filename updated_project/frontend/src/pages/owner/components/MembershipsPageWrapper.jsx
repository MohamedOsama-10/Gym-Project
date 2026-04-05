// src/pages/owner/components/MembershipsPageWrapper.jsx
// Extracted from OwnerDashboard — previously defined inline in the dashboard file.

import { useNavigate, useParams } from 'react-router-dom';
import Memberships from '../../user/Memberships';

export default function MembershipsPageWrapper() {
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
        <div className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
          <h2 className="text-2xl font-bold">Memberships &amp; Subscriptions</h2>
          <p>Owner Mode: You can edit gym subscriptions and view coach packages</p>
        </div>
        <div className="p-6">
          <Memberships userRole="owner" />
        </div>
      </div>
    </div>
  );
}
