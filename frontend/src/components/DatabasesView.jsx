import React, { useState } from 'react';
import { Database, Plus, Trash2, Key, HardDrive, Table, Check, X } from 'lucide-react';
import { api } from '../services/api';

export default function DatabasesView({ databases, onRefreshDatabases }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    user: 'root',
    engine: 'MySQL 8.0'
  });
  const [loading, setLoading] = useState(false);

  const handleCreateDb = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      setLoading(true);
      await api.createDatabase(formData);
      setShowAddModal(false);
      setFormData({ name: '', user: 'root', engine: 'MySQL 8.0' });
      onRefreshDatabases();
    } catch (err) {
      alert('Failed to create database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            <span>Database Engines & Instances</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create MySQL / PostgreSQL databases, manage users, and inspect table storage.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Database</span>
        </button>
      </div>

      {/* Database List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {databases.map((db) => (
          <div 
            key={db.id}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-sm transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono">{db.name}</h3>
                    <span className="text-[11px] text-slate-400 font-sans">{db.engine}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-750">
                  <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Size</span>
                  <span className="text-white font-bold">{db.size}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-750">
                  <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Tables</span>
                  <span className="text-white font-bold">{db.tables}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                <span className="flex items-center gap-1 text-[11px]">
                  <Key className="w-3 h-3 text-indigo-400" /> User:
                </span>
                <span className="text-slate-300 font-semibold">{db.user}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Collation: utf8mb4_unicode_ci</span>
              <button 
                onClick={() => alert(`Database management actions for ${db.name}`)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Database Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Create Database</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDb} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Database Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ecommerce_db"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Database Engine</label>
                <select
                  value={formData.engine}
                  onChange={(e) => setFormData(prev => ({ ...prev, engine: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="MySQL 8.0">MySQL 8.0</option>
                  <option value="PostgreSQL 16">PostgreSQL 16</option>
                  <option value="Redis 7.2">Redis 7.2 (Key-Value Store)</option>
                  <option value="SQLite 3">SQLite 3 File</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Database User</label>
                <input
                  type="text"
                  placeholder="e.g. app_user"
                  value={formData.user}
                  onChange={(e) => setFormData(prev => ({ ...prev, user: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
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
                  {loading ? 'Creating...' : 'Create Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
