import React, { useState, useEffect } from "react";
import { apiRequest, API_CONFIG, API_ORIGIN } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";


export default function CoachesPage() {
  const { addNotification } = useNotifications();
  const [coaches, setCoaches] = useState([]);
  const [gyms, setGyms]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [maxTraineesEdit, setMaxTraineesEdit] = useState({});
  const [profileModal, setProfileModal] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEdit, setProfileEdit] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  const EMPTY_FORM = {
    full_name: "", staff_id: "", experience_years: "",
    hourly_rate: "", gym_id: "", specialization: "", status: "Active",
  };
  const [form, setForm] = useState(EMPTY_FORM);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([
        apiRequest("/admin/coaches/"),
        apiRequest("/gyms/"),
      ]);
      setCoaches(c);
      setGyms(g);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setModal({ mode: "add" }); };
  const openEdit = (c) => {
    setForm({
      full_name: c.full_name ?? "",
      staff_id: c.staff_id ?? "",
      experience_years: c.experience_years ?? "",
      hourly_rate: c.hourly_rate ?? "",
      gym_id: c.gym_id ?? "",
      specialization: c.specialization ?? "",
      status: c.status ?? "Active",
    });
    setModal({ mode: "edit", coach: c });
  };
  const openDelete = (c) => setModal({ mode: "delete", coach: c });
  const closeModal = () => { setModal(null); setSaving(false); };

  const openProfile = async (c) => {
    setProfileLoading(true);
    setProfileModal({ loading: true, full_name: c.full_name, avatar_url: c.avatar_url });
    try {
      const data = await apiRequest(`/admin/coaches/${c.id}/profile`);
      setProfileModal(data);
      setProfileEdit({
        full_name: data.full_name ?? "",
        experience_years: data.experience_years ?? "",
        hourly_rate: data.hourly_rate ?? "",
        specialization: data.specialty ?? "",
        status: data.is_available ? "Active" : "Inactive",
      });
    } catch (e) {
      showToast(e.message, "error");
      setProfileModal(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const saveProfileEdit = async () => {
    if (!profileModal?.id) return;
    setProfileSaving(true);
    try {
      await apiRequest(`/admin/coaches/${profileModal.id}`, {
        method: "PUT",
        body: JSON.stringify({
          full_name: profileEdit.full_name || null,
          experience_years: profileEdit.experience_years !== "" ? +profileEdit.experience_years : null,
          hourly_rate: profileEdit.hourly_rate !== "" ? +profileEdit.hourly_rate : null,
          specialization: profileEdit.specialization || null,
          status: profileEdit.status || null,
        }),
      });
      setProfileModal(prev => ({
        ...prev,
        full_name: profileEdit.full_name,
        experience_years: profileEdit.experience_years !== "" ? +profileEdit.experience_years : null,
        hourly_rate: profileEdit.hourly_rate !== "" ? +profileEdit.hourly_rate : null,
        specialty: profileEdit.specialization,
        is_available: profileEdit.status === "Active",
      }));
      showToast("Coach updated successfully");
      addNotification({ title: "Coach Updated", message: `Coach profile updated successfully` });
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await apiRequest("/admin/coaches/", {
          method: "POST",
          body: JSON.stringify({
            full_name: form.full_name,
            staff_id: form.staff_id,
            experience_years: form.experience_years ? +form.experience_years : null,
            hourly_rate: form.hourly_rate ? +form.hourly_rate : null,
            gym_id: form.gym_id ? +form.gym_id : null,
            specialization: form.specialization || null,
            status: form.status,
          }),
        });
        showToast("Coach added successfully");
        addNotification({ title: "Coach Added", message: `Coach "${form.full_name}" was added to the directory` });
      } else {
        await apiRequest(`/admin/coaches/${modal.coach.id}`, {
          method: "PUT",
          body: JSON.stringify({
            full_name: form.full_name || null,
            experience_years: form.experience_years ? +form.experience_years : null,
            hourly_rate: form.hourly_rate ? +form.hourly_rate : null,
            gym_id: form.gym_id ? +form.gym_id : null,
            specialization: form.specialization || null,
            status: form.status || null,
          }),
        });
        showToast("Coach updated — notification sent to coach");
        addNotification({ title: "Coach Updated", message: `Coach "${form.full_name}" was updated` });
      }
      closeModal();
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await apiRequest(`/admin/coaches/${modal.coach.id}`, { method: "DELETE" });
      showToast("Coach removed — notification sent to coach", "warning");
      addNotification({ title: "Coach Removed", message: `Coach "${modal.coach.full_name}" was removed from the directory` });
      closeModal();
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const saveMaxTrainees = async (coachId) => {
    const val = maxTraineesEdit[coachId];
    if (val === undefined || val === "") return;
    try {
      await apiRequest(`/admin/coaches/${coachId}/max-trainees`, {
        method: "PUT",
        body: JSON.stringify({ max_clients: parseInt(val) }),
      });
      showToast("Max trainees updated");
      addNotification({ title: "Max Trainees Updated", message: `Coach's maximum trainees limit was updated to ${val}` });
      setMaxTraineesEdit(prev => { const n = { ...prev }; delete n[coachId]; return n; });
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const filtered = coaches.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.gym_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => {
    const map = { Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                  Inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                  Pending:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
    return map[s] || map.Inactive;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl shadow-2xl p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">Coach Directory</h2>
            <p className="text-purple-100">Add, edit or remove coaches — changes notify each coach automatically</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-bold rounded-2xl shadow-lg hover:bg-purple-50 transition-all hover:scale-105 active:scale-95">
            <span className="text-xl">➕</span> Add Coach
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl text-white font-semibold flex items-center gap-3 transition-all ${
          toast.type === "error" ? "bg-red-500" : toast.type === "warning" ? "bg-amber-500" : "bg-emerald-500"
        }`}>
          <span>{toast.type === "error" ? "❌" : toast.type === "warning" ? "⚠️" : "✅"}</span>
          {toast.msg}
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
        <div className="relative">
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search coaches by name, email or branch…"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white" />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 overflow-hidden hover:shadow-2xl transition-all duration-300 border-gray-200 dark:border-gray-700">
              <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-600 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden">
                    {c.avatar_url ? (
                      <img src={c.avatar_url.startsWith('/') ? `${API_ORIGIN}${c.avatar_url}` : c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                    ) : (
                      (c.full_name || "?")[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-1 truncate">{c.full_name}</h3>
                    <p className="text-sm opacity-90 mb-2 truncate">{c.specialization || c.specialty || "General Fitness"}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(c.status)}`}>
                      {c.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                 <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <p className="text-lg font-bold">{c.experience_years ?? "—"}</p>
                       <p className="text-[10px] text-gray-500 uppercase">Years</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <p className="text-lg font-bold">${c.hourly_rate ?? "—"}</p>
                       <p className="text-[10px] text-gray-500 uppercase">Rate</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                       <p className="text-lg font-bold">{c.current_clients ?? 0}</p>
                       <p className="text-[10px] text-gray-500 uppercase">Clients</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-sm">Edit</button>
                    <button onClick={() => openDelete(c)} className="py-2 px-3 bg-red-50 text-red-600 rounded-xl">🗑️</button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
