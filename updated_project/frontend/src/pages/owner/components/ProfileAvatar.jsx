// src/pages/owner/components/ProfileAvatar.jsx
// Extracted from OwnerDashboard — previously defined inline in the dashboard file.

import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../../context/ProfileContext';

export default function ProfileAvatar() {
  const { profile, loading, isReady } = useProfile();
  const navigate = useNavigate();

  if (loading || !isReady)
    return <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />;

  if (!profile)
    return (
      <button
        onClick={() => navigate('/owner/profile')}
        className="w-10 h-10 rounded-full bg-gray-400 text-white font-bold"
      >
        ?
      </button>
    );

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <button onClick={() => navigate('/owner/profile')} className="relative group">
      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-orange-500/50">
        {profile.avatar
          ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
        }
      </div>
    </button>
  );
}
