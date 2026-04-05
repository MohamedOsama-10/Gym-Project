import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../services/httpClient";
import { useNotifications } from "../../../context/NotificationContext";

export default function UserManagement() {
  const { addNotification } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([]);

  const [newUser, setNewUser] = useState({
    name: "", membershipId: "", staffId: "", status: "Active", role: "Member", gym_id: "", plan_id: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "", membershipId: "", role: "Member", status: "Active", gym_id: ""
  });
  const [editErrors, setEditErrors] = useState({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { loadUsers(); loadBranches(); }, []);
  useEffect(() => { loadUsers(); }, [filter, searchQuery]);

  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      const [gymsData, gymInfo, plansData] = await Promise.all([
        apiRequest('/gyms/'),
        apiRequest('/admin/me/gym').catch(() => ({ gym_id: null })),
        apiRequest('/admin/membership-plans/').catch(() => []),
      ]);
      setBranches(gymsData);
      setMembershipPlans(Array.isArray(plansData) ? plansData.filter(p => p.is_active !== false) : []);
      if (gymInfo.gym_id) {
        setNewUser(prev => ({ ...prev, gym_id: String(gymInfo.gym_id) }));
      }
    } catch (err) { console.error("Error loading branches:", err); setBranches([]); }
    finally { setIsLoadingBranches(false); }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true); setError(null);
      const params = {};
      if (filter !== 'all') params.role = filter;
      if (searchQuery) params.search = searchQuery;
      const queryString = new URLSearchParams(params).toString();
      const data = await apiRequest(`/admin/users/?${queryString}`);
      setUsers(data);
    } catch (err) { setError(err.message); console.error("Error loading users:", err); }
    finally { setIsLoading(false); }
  };

  const validateForm = () => {
    const errors = {};
    if (!newUser.name.trim()) errors.name = "Full name is required";
    else if (newUser.name.length < 3) errors.name = "Name must be at least 3 characters";
    if (newUser.role === 'Member') {
      if (!newUser.membershipId.trim()) errors.membershipId = "Membership ID is required for members";
    } else {
      if (!newUser.staffId.trim()) errors.staffId = "Staff ID is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const roleMap = { 'Member': 'user', 'Coach': 'coach', 'Owner': 'owner', 'Admin': 'admin' };
      const backendRole = roleMap[newUser.role] || 'user';
      let createdUser;
      if (backendRole === 'coach') {
        createdUser = await apiRequest('/admin/coaches/', {
          method: 'POST',
          body: JSON.stringify({
            full_name: newUser.name,
            staff_id: newUser.staffId,
            status: newUser.status,
            ...(newUser.gym_id && { gym_id: parseInt(newUser.gym_id) }),
          }),
        });
      } else {
        const idField = newUser.role === 'Member' ? newUser.membershipId : newUser.staffId;
        createdUser = await apiRequest('/admin/users/', {
          method: 'POST',
          body: JSON.stringify({
            full_name: newUser.name,
            role: backendRole,
            status: newUser.status,
            ...(idField && { membership_id: idField }),
            ...(newUser.gym_id && { gym_id: parseInt(newUser.gym_id) }),
          }),
        });
      }
      if (newUser.role === 'Member' && newUser.plan_id && createdUser?.id) {
        try { await apiRequest('/admin/subscriptions', { method: 'POST', body: JSON.stringify({ user_id: createdUser.id, plan_id: parseInt(newUser.plan_id) }) }); }
        catch (subErr) { console.warn("Subscription creation failed:", subErr.message); }
      }
      await loadUsers();
      setNewUser(prev => ({ name: "", membershipId: "", staffId: "", status: "Active", role: "Member", gym_id: prev.gym_id, plan_id: "", }));
      setIsModalOpen(false);
      const assignedId = newUser.role === 'Member' ? newUser.membershipId : newUser.staffId;
      const msg = newUser.role === 'Member' ? `Member "${newUser.name}" created! ID: ${assignedId}` : `${newUser.role} "${newUser.name}" created! ID: ${assignedId}`;
      setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 5000);
      addNotification({ title: "User Created", message: msg });
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('membership id')) setFormErrors({ membershipId: msg });
      else if (msg.toLowerCase().includes('staff id')) setFormErrors({ staffId: msg });
      else setFormErrors({ submit: msg });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null); await loadUsers();
      setSuccessMessage(`User "${deleteTarget.full_name}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      addNotification({ title: "User Deleted", message: `User "${deleteTarget.full_name}" was removed` });
    } catch (error) { setSuccessMessage("Failed to delete: " + error.message); setTimeout(() => setSuccessMessage(""), 4000); }
    finally { setIsDeleting(false); }
  };

  const roleToLabel = { 'user': 'Member', 'coach': 'Coach', 'owner': 'Owner', 'admin': 'Admin' };
  const labelToRole = { 'Member': 'user', 'Coach': 'coach', 'Owner': 'owner', 'Admin': 'admin' };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.full_name, membershipId: user.membership_id || "", role: roleToLabel[user.role] || "Member", status: user.status || "Active", gym_id: user.gym_id ? String(user.gym_id) : "" });
    setEditErrors({}); setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) { setEditErrors({name: "Name required"}); return; }
    setIsEditSubmitting(true);
    try {
      await apiRequest(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ full_name: editForm.name, membership_id: editForm.membershipId || null, role: labelToRole[editForm.role] || 'user', status: editForm.status, gym_id: editForm.gym_id ? parseInt(editForm.gym_id) : null }),
      });
      await loadUsers(); setIsEditModalOpen(false); setEditingUser(null);
      setSuccessMessage(`User "${editForm.name}" updated successfully!`);
      addNotification({ title: "User Updated", message: `User "${editForm.name}" was updated` });
    } catch (error) { setEditErrors({ submit: error.message }); }
    finally { setIsEditSubmitting(false); }
  };

  if (isLoading && users.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-fadeIn">
          <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <p className="font-semibold">{successMessage}</p>
            <button onClick={() => setSuccessMessage("")} className="ml-2 text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">User Management</h2>
            <p className="text-indigo-100">Manage all users across the system</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-lg flex items-center gap-2">
            ➕ Add New User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white">
            <option value="all">All Roles</option>
            <option value="user">Members</option>
            <option value="coach">Coaches</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                    <p className="text-sm text-gray-500">{user.email || 'Not registered'}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{user.membership_id || '—'}</td>
                  <td className="px-6 py-4 text-sm">{user.gym_name || '—'}</td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4">{user.status}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEditModal(user)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => setDeleteTarget(user)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit/Delete modals would go here... (Condensed for this snippet) */}
    </div>
  );
}
