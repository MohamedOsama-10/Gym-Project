// frontend/src/pages/coach/components/MyPackagesPage.jsx
import React, { useState, useEffect } from "react";
import { API_CONFIG, apiRequest as httpRequest } from "../../../services/httpClient";

const API_BASE_URL = API_CONFIG.BASE_URL;

async function coachApiRequest(endpoint, options = {}) {
  return httpRequest(endpoint, options);
}

const STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const COLORS = ['blue', 'green', 'purple', 'orange', 'red'];

const EMPTY_FORM = {
  package_name: '',
  sessions: '',
  price: '',
  period: '',
  original_price: '',
  features: '',
  is_popular: false,
  color: 'blue',
};

export default function MyPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [modal, setModal]       = useState(null); // null | { mode:'add'|'edit', pkg? }
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await coachApiRequest('/coaches/me/packages');
      setPackages(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setModal({ mode: 'add' }); };
  const openEdit = (pkg) => {
    setForm({
      package_name:   pkg.package_name ?? '',
      sessions:       pkg.sessions ?? '',
      price:          pkg.price ?? '',
      period:         pkg.period ?? '',
      original_price: pkg.original_price ?? '',
      features:       Array.isArray(pkg.features) ? pkg.features.join(', ') : '',
      is_popular:     pkg.is_popular ?? false,
      color:          pkg.color ?? 'blue',
    });
    setModal({ mode: 'edit', pkg });
  };
  const closeModal = () => { setModal(null); setSaving(false); };

  const handleSave = async () => {
    if (!form.package_name.trim() || !form.sessions || !form.price) {
      showToast('Package name, sessions, and price are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        package_name:   form.package_name,
        sessions:       parseInt(form.sessions),
        price:          parseFloat(form.price),
        period:         form.period || null,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        features:       form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
        is_popular:     form.is_popular,
        color:          form.color,
      };
      if (modal.mode === 'add') {
        await coachApiRequest('/coaches/me/packages', { method: 'POST', body: JSON.stringify(body) });
        showToast('Package created — pending admin approval');
      } else {
        await coachApiRequest(`/coaches/me/packages/${modal.pkg.id}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Package updated — pending re-approval');
      }
      closeModal();
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await coachApiRequest(`/coaches/me/packages/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Package removed');
      setDeleteTarget(null);
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-4 md:p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1">My Packages</h2>
            <p className="text-blue-100 text-sm">New packages require admin approval before becoming visible to members</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition-all hover:scale-105 active:scale-95">
            <span className="text-xl">+</span> Add Package
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-2xl shadow-2xl text-white font-semibold flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}>
          <span>{toast.type === 'error' ? '✗' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      {/* Packages grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No packages yet</p>
          <p className="text-gray-400 mb-6">Create your first coaching package to offer to members</p>
          <button onClick={openAdd} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            Add Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{pkg.package_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.period || 'No period'} · {pkg.sessions} sessions</p>
                  </div>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 ${STATUS_BADGE[pkg.status] || STATUS_BADGE.pending}`}>
                    {pkg.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{pkg.price} EGP</span>
                    {pkg.original_price && (
                      <span className="text-sm text-gray-400 line-through">{pkg.original_price} EGP</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <span className="text-blue-500 text-sm">👥</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pkg.subscriber_count ?? 0}</span>
                    <span className="text-xs text-blue-400 dark:text-blue-500">members</span>
                  </div>
                </div>

                {pkg.price_per_session && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{pkg.price_per_session} EGP / session</p>
                )}

                {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        <span className="text-emerald-500">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                )}

                {pkg.status === 'rejected' && pkg.rejection_reason && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Rejection reason:</p>
                    <p className="text-xs text-red-500 dark:text-red-300">{pkg.rejection_reason}</p>
                  </div>
                )}

                {pkg.status === 'pending' && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting admin approval</p>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/30">
                <button onClick={() => openEdit(pkg)}
                  className="flex-1 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition">
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(pkg)}
                  className="flex-1 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                {modal.mode === 'add' ? 'Add New Package' : 'Edit Package'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Package Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Package Name *</label>
                <input type="text" value={form.package_name} onChange={e => setForm(f => ({ ...f, package_name: e.target.value }))}
                  placeholder="e.g. Premium Monthly"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
              </div>
              {/* Sessions & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sessions *</label>
                  <input type="number" min="1" value={form.sessions} onChange={e => setForm(f => ({ ...f, sessions: e.target.value }))}
                    placeholder="e.g. 12"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (EGP) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 1200"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                </div>
              </div>
              {/* Period & Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Period</label>
                  <input type="text" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    placeholder="e.g. 1 Month"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Original Price</label>
                  <input type="number" min="0" step="0.01" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" />
                </div>
              </div>
              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Features (comma-separated)</label>
                <textarea rows={3} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                  placeholder="e.g. Nutrition plan, Weekly check-in, Custom workouts"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none" />
              </div>
              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: { blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', orange: '#f97316', red: '#ef4444' }[c] }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              {/* Popular toggle */}
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, is_popular: !f.is_popular }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.is_popular ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_popular ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Popular</span>
              </div>

              <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                New packages require admin approval before becoming visible to members.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3 justify-end">
              <button onClick={closeModal}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {modal.mode === 'add' ? 'Create Package' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🗑️</div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Package?</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This will deactivate <span className="font-bold text-gray-900 dark:text-white">{deleteTarget.package_name}</span> and hide it from members.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2">
                {deleting && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
      `}</style>
    </div>
  );
}
