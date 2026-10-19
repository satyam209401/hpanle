import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  FolderOpen, 
  Settings, 
  Code, 
  Check, 
  X,
  Server
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function WebsitesView({ sites, onRefreshSites, setActiveTab, onSelectFolder }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSiteForConfig, setSelectedSiteForConfig] = useState(null);
  const [formData, setFormData] = useState({
    domain: '',
    type: 'Node.js Proxy',
    targetPort: 3000,
    rootPath: '',
    ssl: true
  });
  const [loading, setLoading] = useState(false);

  const handleDomainChange = (e) => {
    const domain = e.target.value;
    setFormData(prev => ({
      ...prev,
      domain,
      rootPath: domain ? `/var/www/${domain}` : ''
    }));
  };

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!formData.domain) return;
    try {
      setLoading(true);
      await api.createSite(formData);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setShowAddModal(false);
      setFormData({
        domain: '',
        type: 'Node.js Proxy',
        targetPort: 3000,
        rootPath: '',
        ssl: true
      });
      onRefreshSites();
    } catch (err) {
      alert('Failed to create site: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (siteId, domain) => {
    if (window.confirm(`Are you sure you want to delete website ${domain}? This will remove its Nginx configuration.`)) {
      await api.deleteSite(siteId);
      onRefreshSites();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" />
            <span>Websites & Virtual Hosts</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your domains, Nginx reverse proxy routes, SSL certificates, and web roots.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Website</span>
        </button>
      </div>

      {/* Sites Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Domain & Host</th>
                <th className="px-6 py-4">Application Type</th>
                <th className="px-6 py-4">SSL Security</th>
                <th className="px-6 py-4">Document / Proxy Target</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-sans font-medium text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-100 flex items-center gap-1.5">
                          {site.domain}
                          <a 
                            href={`http://${site.domain}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-500 hover:text-indigo-400"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">Added: {site.createdAt || '2026-10-18'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-sans">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
                      {site.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-sans">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Let's Encrypt (Active)</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-300">
                    {site.type === 'Node.js Proxy' ? (
                      <span className="text-indigo-400">http://127.0.0.1:{site.targetPort}</span>
                    ) : (
                      <span className="text-slate-400 truncate block max-w-xs">{site.rootPath}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 font-sans">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Running
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedSiteForConfig(site)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Nginx Config"
                      >
                        <Code className="w-4 h-4 text-slate-400 hover:text-indigo-400" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectFolder(site.rootPath);
                          setActiveTab('files');
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Open in File Manager"
                      >
                        <FolderOpen className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                      </button>

                      <button
                        onClick={() => handleDeleteSite(site.id, site.domain)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Website"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Website Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Create New Website</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <form onSubmit={handleCreateSite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Domain Name (FQDN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. app.myvps.com or mydomain.com"
                  value={formData.domain}
                  onChange={handleDomainChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Website Deployment Mode
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-sans"
                >
                  <option value="Node.js Proxy">Node.js / Python / Docker (Reverse Proxy)</option>
                  <option value="Static / HTML">Static Website (HTML/CSS/React Build)</option>
                  <option value="PHP-FPM">PHP-FPM 8.2 Application</option>
                </select>
              </div>

              {formData.type === 'Node.js Proxy' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Local Port (e.g., PM2 or Docker port)
                  </label>
                  <input
                    type="number"
                    value={formData.targetPort}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetPort: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Root Directory Path on Server
                </label>
                <input
                  type="text"
                  value={formData.rootPath}
                  onChange={(e) => setFormData(prev => ({ ...prev, rootPath: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sslCheck"
                  checked={formData.ssl}
                  onChange={(e) => setFormData(prev => ({ ...prev, ssl: e.target.checked }))}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-800"
                />
                <label htmlFor="sslCheck" className="text-xs text-slate-300 select-none">
                  Automatically request Free SSL Certificate (Let's Encrypt)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {loading ? 'Creating...' : 'Create Website'}
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nginx Config Preview Modal */}
      <AnimatePresence>
        {selectedSiteForConfig && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-semibold text-white flex items-center gap-2 font-mono text-sm">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span>/etc/nginx/sites-available/{selectedSiteForConfig.domain}.conf</span>
                </h3>
                <button 
                  onClick={() => setSelectedSiteForConfig(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
{`server {
    listen 80;
    listen [::]:80;
    server_name ${selectedSiteForConfig.domain};

    # Auto SSL Let's Encrypt Redirect
    # return 301 https://$host$request_uri;

    location / {
${selectedSiteForConfig.type === 'Node.js Proxy' ? `        proxy_pass http://127.0.0.1:${selectedSiteForConfig.targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;` : `        root ${selectedSiteForConfig.rootPath};
        index index.html index.htm;
        try_files $uri $uri/ /index.html;`}
    }
}`}
                </pre>
              </div>

              <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-900/50">
                <button
                  onClick={() => setSelectedSiteForConfig(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
