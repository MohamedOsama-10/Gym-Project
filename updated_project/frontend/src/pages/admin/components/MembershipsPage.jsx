import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";

export default function MembershipsPage() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState("gym");
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const [packages, setPackages]         = useState([]);
  const [pkgLoading, setPkgLoading]     = useState(false);
  const [pkgStatusFilter, setPkgStatusFilter] = useState("all");

  const EMPTY = { name: "", description: "", price: "", duration_days: "", features: "", status: "Active" };
  const [form, setForm]         = useState(EMPTY);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/membership-plans/");
      setPlans(data);
    } catch (e) { setPlans([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadPackages = async () => {
    setPkgLoading(true);
    try {
      const qs = pkgStatusFilter !== "all" ? `?status=${pkgStatusFilter}` : "";
      const data = await apiRequest(`/admin/coach-packages${qs}`);
      setPackages(data);
    } catch (e) { showToast(e.message, "error"); }
    finally { setPkgLoading(false); }
  };
  useEffect(() => { if (activeTab === "packages") loadPackages(); }, [activeTab, pkgStatusFilter]);

  const handleApprovePkg = async (pkg) => {
    try {
      await apiRequest(`/admin/coach-packages/${pkg.id}/approve`, { method: "PUT" });
      showToast(`"${pkg.package_name}" approved`);
      addNotification({ title: "Package Approved", message: `Coach package "${pkg.package_name}" was approved` });
      loadPackages();
    } catch (e) { showToast(e.message, "error"); }
  };

  const openAdd  = () => { setForm(EMPTY); setModal({ mode: "add" }); };
  const openEdit = (p) => {
    setForm({
      name: p.name ?? "",
      description: p.description ?? "",
      price: p.price ?? "",
      duration_days: p.duration_days ?? "",
      features: Array.isArray(p.features) ? p.features.join(", ") : (p.features ?? ""),
      status: p.status ?? "Active",
    });
    setModal({ mode: "edit", plan: p });
  };
  const closeModal = () => { setModal(null); setSaving(false); };

  const buildPayload = () => ({
    name: form.name,
    description: form.description || null,
    price: form.price ? +form.price : 0,
    duration_days: form.duration_days ? +form.duration_days : 30,
    features: form.features ? form.features.split(",").map(f => f.trim()).filter(Boolean) : [],
    status: form.status,
  });

  const handleSave = async () => {
    if (!form.name || !form.price) { showToast("Name and price are required", "error"); return; }
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await apiRequest("/admin/membership-plans/", { method: "POST", body: JSON.stringify(buildPayload()) });
        showToast("Membership plan created");
      } else {
        await apiRequest(`/admin/membership-plans/${modal.plan.id}`, { method: "PUT", body: JSON.stringify(buildPayload()) });
        showToast("Membership plan updated");
      }
      closeModal(); load();
    } catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`relative overflow-hidden rounded-3xl shadow-2xl p-8 bg-gradient-to-r ${activeTab === "gym" ? "from-pink-600 to-rose-600" : "from-indigo-600 to-purple-600"}`}>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4 text-white">
          <div>
            <h2 className="text-3xl font-black mb-1">Membership Management</h2>
            <p className="opacity-80">{activeTab === "gym" ? "Define gym membership plans" : "Review coach-submitted packages"}</p>
          </div>
          {activeTab === "gym" && (
            <button onClick={openAdd} className="px-6 py-3 bg-white text-pink-700 font-bold rounded-2xl shadow-lg hover:bg-pink-50 transition">
              ➕ Add Plan
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab("gym")} className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === "gym" ? "bg-pink-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200"}`}>Gym Plans</button>
        <button onClick={() => setActiveTab("packages")} className={`px-6 py-2 rounded-xl font-bold text-sm ${activeTab === "packages" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200"}`}>Coach Packages</button>
      </div>

      {activeTab === "gym" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {plans.map(p => (
             <div key={p.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-xl mb-2">{p.name}</h3>
                <p className="text-3xl font-black text-pink-600 mb-4">{p.price} EGP</p>
                <button onClick={() => openEdit(p)} className="w-full py-2 bg-pink-50 text-pink-700 font-bold rounded-xl">Edit</button>
             </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
           <p className="text-gray-500 text-center py-10">Coach package management UI...</p>
        </div>
      )}
    </div>
  );
}
