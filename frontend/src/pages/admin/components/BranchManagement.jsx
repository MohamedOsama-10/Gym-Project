import React, { useState, useEffect } from "react";
import { apiRequest, API_CONFIG } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";

const API_ORIGIN = API_CONFIG.ORIGIN;

export default function BranchManagement() {
  const { addNotification } = useNotifications();
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({ name: "", location: "", phone: "", status: "Active" });

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/gyms/');
      setBranches(data);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadBranches(); }, []);

  const openCreateModal = () => {
    setEditingBranch(null);
    setForm({ name: "", location: "", phone: "", status: "Active" });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBranch) {
        await apiRequest(`/gyms/${editingBranch.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiRequest('/gyms/', { method: 'POST', body: JSON.stringify(form) });
      }
      await loadBranches();
      setIsModalOpen(false);
    } catch (err) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black">Branch Management</h2>
           <p className="opacity-80">{branches.length} Locations</p>
        </div>
        <button onClick={openCreateModal} className="px-6 py-3 bg-white text-green-600 font-bold rounded-2xl">➕ New Branch</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b => (
          <div key={b.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden border border-gray-100 dark:border-gray-700">
             <div className="h-40 bg-gray-100 dark:bg-gray-700">
                {b.image_url && <img src={`${API_ORIGIN}${b.image_url}`} className="w-full h-full object-cover" />}
             </div>
             <div className="p-4">
                <h3 className="font-bold text-xl">{b.name}</h3>
                <p className="text-gray-500 text-sm">{b.location}</p>
                <button onClick={() => { setEditingBranch(b); setForm(b); setIsModalOpen(true); }} className="w-full mt-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl">Edit Location</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
