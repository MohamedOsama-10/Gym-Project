// src/pages/owner/components/WelcomeHeader.jsx
// Extracted from OwnerDashboard — previously defined inline in the dashboard file.

import { useProfile } from '../../../context/ProfileContext';

export default function WelcomeHeader() {
  const { profile, loading, isReady } = useProfile();

  if (loading || !isReady)
    return <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Welcome back, {profile?.name || 'Owner'}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Manage your gym branches</p>
    </div>
  );
}
