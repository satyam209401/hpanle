import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Lock, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';

export default function FirewallView({ rules, onRefreshRules }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    port: '',
    proto: 'tcp',
    action: 'ALLOW',
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!formData.port) return;
    try {
      setLoading(true);
      await api.addFirewallRule(formData);
      setShowAddModal(false);
      setFormData({ port: '', proto: 'tcp', action: 'ALLOW', comment: '' });
      onRefreshRules();
    } catch (err) {
      alert('Failed to add rule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Delete this firewall rule?')) {
      await api.deleteFirewallRule(ruleId);
      onRefreshRules();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Firewall & Security Rules</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure Linux UFW rules, open ports for new apps, and block unauthorized traffic.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Port Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800 font-sans">
              <tr>
                <th className="px-6 py-4">Port Number</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Policy Action</th>
                <th className="px-6 py-4">Description / Purpose</th>
                <th className="px-6 py-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-white font-bold text-sm">
                    {rule.port}
                  </td>
                  <td className="px-6 py-4 text-slate-400 uppercase">
                    {rule.proto}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      rule.action === 'ALLOW' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {rule.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-sans">
                    {rule.comment}
                  </td>
                  <td className="px-6 py-4 text-right font-sans">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Open New Port Rule</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Port (or Range)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8080 or 3000-3010"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Protocol</label>
                <select
                  value={formData.proto}
                  onChange={(e) => setFormData(prev => ({ ...prev, proto: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="both">TCP & UDP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Policy</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALLOW">ALLOW (Open to Internet)</option>
                  <option value="DENY">DENY (Block Traffic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Description Note</label>
                <input
                  type="text"
                  placeholder="e.g. Microservice backend API"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {loading ? 'Adding...' : 'Apply Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
