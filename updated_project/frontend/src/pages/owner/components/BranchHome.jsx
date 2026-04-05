// frontend/src/pages/owner/components/BranchHome.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../../components/Modal";
import { TotalMembersView, ActiveMembersView, RevenueView } from "../../../components/StatDetailViews";
import { API_CONFIG, API_ORIGIN, apiRequest } from "../../../services/httpClient";

const API_BASE_URL = API_CONFIG.BASE_URL;

const apiGet = (endpoint) => apiRequest(endpoint);

function StatCard({ title, value, icon, color, onClick, clickable = false }) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    pink: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-100 dark:hover:bg-pink-900/30",
  };

  const baseClasses = "p-4 md:p-6 rounded-xl border-2 transition-all duration-300";
  const clickableClasses = clickable ? "cursor-pointer hover:shadow-lg transform hover:-translate-y-1" : "";

  return (
    <div onClick={onClick} className={`${baseClasses} ${colorClasses[color]} ${clickableClasses}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-white dark:bg-gray-800 shadow-sm">{icon}</div>
      </div>
      {clickable && (
        <div className="mt-4 flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
          <span>View Details</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function BranchHome() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [gym, setGym] = useState(null);
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, totalCoaches: 0, todaysCheckins: 0, subscriptionsRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet(`/gyms/${branchId}`)
      .then(gymData => {
        setGym(gymData);
        setLoading(false);
        apiGet(`/gyms/${branchId}/stats`)
          .then(statsData => setStats(statsData))
          .catch(() => {});
      })
      .catch(err => {
        console.error('Failed to load gym:', err);
        setLoading(false);
      });
  }, [branchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Branch not found</p>
        <button onClick={() => navigate('/owner')} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          Back to Branches
        </button>
      </div>
    );
  }

  const imgSrc = gym.image_url
    ? (gym.image_url.startsWith('http') ? gym.image_url : `${API_ORIGIN}${gym.image_url}`)
    : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop';

  return (
    <div className="flex flex-col">
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
        <img src={imgSrc} alt={gym.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
          <div className="px-4 md:px-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{gym.name}</h1>
            <p className="text-white/90 text-lg">{gym.location || ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Members" value={stats.totalMembers} icon="👥" color="blue" clickable={true} onClick={() => setActiveModal('totalMembers')} />
        <StatCard title="Active Members" value={stats.activeMembers} icon="✅" color="green" clickable={true} onClick={() => setActiveModal('activeMembers')} />
        <StatCard title="Training Team" value={stats.totalCoaches} icon="💪" color="purple" clickable={true} onClick={() => navigate(`coaches`)} />
        <StatCard title="Today's Check-ins" value={stats.todaysCheckins} icon="📝" color="orange" clickable={false} />
        <StatCard title="Monthly Revenue" value={`${Number(stats.subscriptionsRevenue).toLocaleString()} EGP`} icon="💰" color="emerald" clickable={true} onClick={() => setActiveModal('revenue')} />
        <StatCard title="Memberships" value="View Plans" icon="🎫" color="pink" clickable={true} onClick={() => navigate(`subscriptions`)} />
      </div>

      <Modal isOpen={activeModal === 'totalMembers'} onClose={() => setActiveModal(null)} title="All Members Details" size="xl">
        <TotalMembersView gymId={branchId} />
      </Modal>
      <Modal isOpen={activeModal === 'activeMembers'} onClose={() => setActiveModal(null)} title="Active Members" size="lg">
        <ActiveMembersView gymId={branchId} />
      </Modal>
      <Modal isOpen={activeModal === 'revenue'} onClose={() => setActiveModal(null)} title="Financial Revenue Details" size="lg">
        <RevenueView gymId={branchId} revenue={stats.subscriptionsRevenue} />
      </Modal>
    </div>
  );
}
