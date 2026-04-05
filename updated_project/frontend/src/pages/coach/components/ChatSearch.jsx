// src/pages/coach/components/ChatSearch.jsx
// Extracted from CoachDashboard — previously ~60 lines of debounced search
// logic + dropdown UI sitting inline in the main dashboard component.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, API_ORIGIN, apiRequest as httpRequest } from '../../../services/httpClient';


/**
 * @param {{ selfId: string|number }} props
 */
export default function ChatSearch({ selfId }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (q) => {
    setQuery(q);
    setShowDropdown(true);
    clearTimeout(timeoutRef.current);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const [admins, users] = await Promise.all([
          httpRequest(`/admin/users/?role=admin&search=${encodeURIComponent(q)}`).catch(() => []),
          httpRequest(`/admin/users/?search=${encodeURIComponent(q)}`).catch(() => []),
        ]);
        const seen = new Set();
        const merged = [
          ...(Array.isArray(admins) ? admins : []),
          ...(Array.isArray(users) ? users : []),
        ]
          .filter(u => {
            if (u.id === selfId) return false;
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          })
          .slice(0, 8)
          .map(u => ({
            id: u.id,
            name: u.full_name || u.email || '',
            email: u.email || '',
            role: u.role || 'user',
            avatarSrc: u.avatar_url
              ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${API_ORIGIN}${u.avatar_url}`)
              : null,
          }));
        setResults(merged);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const openChat = (result) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    navigate('/coach/chat', {
      state: {
        openUserId: result.id,
        openUserName: result.name,
        openUserAvatar: result.avatarSrc,
      },
    });
  };

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <input
        type="text"
        placeholder="Search admins, clients..."
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => query && setShowDropdown(true)}
        className="w-56 pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <svg
        className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {showDropdown && query.trim() && (
        <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-3">No users found</p>
          ) : (
            results.map(r => (
              <button
                key={r.id}
                onClick={() => openChat(r)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {r.avatarSrc
                    ? <img
                        src={r.avatarSrc}
                        alt={r.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerText = r.name.slice(0, 2).toUpperCase();
                        }}
                      />
                    : r.name.slice(0, 2).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  r.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {r.role}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
