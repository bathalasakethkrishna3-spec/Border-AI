import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  Key, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Operator',
    full_name: '',
    badge_number: '',
  });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await usersAPI.create(formData);
      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'Operator',
        full_name: '',
        badge_number: '',
      });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user account.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to revoke and delete account '${username}'?`)) {
      try {
        await usersAPI.delete(userId);
        await fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user.');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 rounded-xl surveillance-panel border border-[#1a2c47] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              OPERATOR ACCESS CONTROL & USER DIRECTORY
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              ROLE-BASED PERMISSIONS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authenticated border command operators, security analysts, and system administrators.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>PROVISION OPERATOR</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[#09101e] border border-[#1a2c47] flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search operator by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-[#1a2c47] text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="surveillance-panel rounded-xl border border-[#1a2c47] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080e1a] border-b border-[#1a2c47] text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Username / ID</th>
                <th className="px-4 py-3">Duty Role</th>
                <th className="px-4 py-3">Badge ID</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2c47]/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">Loading operator directory...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">No operators found matching query.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleUpper = (u.role || '').toUpperCase();
                  const isAdmin = roleUpper === 'ADMINISTRATOR' || roleUpper === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-sans font-bold text-white">{u.full_name || u.username}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-bold">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isAdmin ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{u.badge_number || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800 flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[10px]">
                        {u.created_at?.substring(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="p-1.5 rounded bg-red-950/60 text-red-400 border border-red-900/60 hover:bg-red-900/80 transition-colors"
                            title="Revoke Operator Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="surveillance-panel rounded-2xl p-6 border border-[#1a2c47] max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" /> Provision Operator Account
            </h3>

            {error && (
              <div className="p-2.5 rounded bg-red-950 text-red-300 text-xs font-mono border border-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. jdoe"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Sgt. John Doe"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jdoe@borderai.mil"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Duty Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-2.5 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Badge ID</label>
                  <input
                    type="text"
                    value={formData.badge_number}
                    onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                    placeholder="e.g. OPS-5012"
                    className="w-full px-3 py-2 rounded bg-slate-900 border border-[#1a2c47] text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1a2c47] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 text-white font-bold"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
