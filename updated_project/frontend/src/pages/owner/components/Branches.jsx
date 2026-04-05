// frontend/src/pages/owner/components/Branches.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, API_ORIGIN, apiRequest } from "../../../services/httpClient";

const API_BASE_URL = API_CONFIG.BASE_URL;

const apiGet = (endpoint) => apiRequest(endpoint);

export default function Branches() {
  const navigate = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet('/gyms/')
      .then(data => { setGyms(data); setLoading(false); })
      .catch(err => {
        if (err.message.includes('401')) { navigate('/login'); return; }
        setError(err.message);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <p className="text-red-500 mb-4">Failed to load gyms: {error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  if (gyms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="text-6xl mb-4">🏢</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Branches Yet</h2>
        <p className="text-gray-500 dark:text-gray-400">Ask an admin to add gym branches from the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4">
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4">Select Your Branch</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Choose a branch to manage its operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
        {gyms.map((gym) => {
          const imgSrc = gym.image_url
            ? (gym.image_url.startsWith('http') ? gym.image_url : `${API_ORIGIN}${gym.image_url}`)
            : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop';
          return (
            <div
              key={gym.id}
              onClick={() => navigate(`/owner/${gym.id}`)}
              className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={imgSrc} alt={gym.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-1">{gym.name}</h2>
                  <p className="text-white/90 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {gym.location || 'No location set'}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{gym.description || 'No description available.'}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{gym.total_members ?? 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Members</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{gym.total_coaches ?? 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Coaches</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block mb-4 ${
                  gym.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {gym.status}
                </div>
                <button className="w-full py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-semibold group-hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                  Manage Branch
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
