import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  FolderOpen, 
  Settings, 
  Code, 
  Check, 
  X,
  Server,
  Save,
  RotateCw,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function WebsitesView({ sites = [], onRefreshSites, setActiveTab, onSelectFolder }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    type: 'Node.js Proxy',
    targetPort: 3000,
    rootPath: '',
    ssl: true
  });
  const [loading, setLoading] = useState(false);

  // Nginx Config Editor State
  const [editingConfigSite, setEditingConfigSite] = useState(null);
  const [configContent, setConfigContent] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState(null);
  const [configSuccess, setConfigSuccess] = useState(false);

  // SSL Toggle Loading
  const [togglingSSL, setTogglingSSL] = useState(null);

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
      const res = await api.createSite(formData);
      if (res?.success) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setShowAddModal(false);
        setFormData({
          domain: '',
          type: 'Node.js Proxy',
          targetPort: 3000,
          rootPath: '',
          ssl: true
        });
        if (onRefreshSites) onRefreshSites();
      } else {
        alert(res?.error || 'Failed to create site');
      }
    } catch (err) {
      alert('Failed to create site: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSite = async (siteId, domain) => {
    if (window.confirm(`Are you sure you want to delete website ${domain}? This will remove its Nginx configuration.`)) {
      await api.deleteSite(siteId);
      if (onRefreshSites) onRefreshSites();
    }
  };

  // Open and edit live Nginx config
  const handleOpenConfigEditor = async (site) => {
    try {
      setEditingConfigSite(site);
      setConfigError(null);
      setConfigSuccess(false);
      setConfigContent('# Loading Nginx configuration...');
      const res = await api.getSiteConfig(site.id);
      if (res?.success) {
        setConfigContent(res.config);
        setConfigPath(res.path || `/etc/nginx/sites-available/${site.domain}.conf`);
      }
    } catch (err) {
      setConfigError('Could not fetch Nginx configuration: ' + err.message);
    }
  };

  const handleSaveConfig = async () => {
    if (!editingConfigSite) return;
    try {
      setSavingConfig(true);
      setConfigError(null);
      setConfigSuccess(false);
      const res = await api.saveSiteConfig(editingConfigSite.id, configContent);
      if (res?.success) {
        setConfigSuccess(true);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        setTimeout(() => setConfigSuccess(false), 3000);
      } else {
        setConfigError(res?.error || 'Failed to apply Nginx configuration.');
      }
    } catch (err) {
      setConfigError(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Interactive SSL ON/OFF Toggle
  const handleToggleSSL = async (site) => {
    try {
      setTogglingSSL(site.id);
      const res = await api.toggleSiteSSL(site.id);
      if (res?.success) {
        if (res.ssl) {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        }
        if (onRefreshSites) onRefreshSites();
      }
    } catch (err) {
      alert('Failed to toggle SSL: ' + err.message);
    } finally {
      setTogglingSSL(null);
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
            Manage domains, Nginx reverse proxy routes, SSL toggle certificates, and edit vhost configurations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Website</span>
        </button>
      </div>

      {/* Sites Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Domain & Host</th>
                <th className="px-6 py-4">Application Type</th>
                <th className="px-6 py-4">SSL Security Toggle</th>
                <th className="px-6 py-4">Document / Proxy Target</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {sites.map((site) => {
                const isSSLBusy = togglingSSL === site.id;

                return (
                  <tr key={site.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-sans font-medium text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-100 flex items-center gap-1.5 font-semibold">
                            {site.domain}
                            <a 
                              href={`${site.ssl ? 'https' : 'http'}://${site.domain}`} 
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
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                        {site.type}
                      </span>
                    </td>

                    {/* Interactive SSL ON/OFF Toggle */}
                    <td className="px-6 py-4 font-sans">
                      <button
                        onClick={() => handleToggleSSL(site)}
                        disabled={isSSLBusy}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all group ${
                          site.ssl
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                        }`}
                        title="Click to toggle SSL / HTTPS certificate"
                      >
                        {isSSLBusy ? (
                          <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : site.ssl ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
                        )}
                        <span>{site.ssl ? 'SSL ON (HTTPS)' : 'SSL OFF (HTTP)'}</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {site.type === 'Node.js Proxy' ? (
                        <span className="text-indigo-400 font-semibold">http://127.0.0.1:{site.targetPort}</span>
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
                        {/* Edit Nginx Config Button */}
                        <button
                          onClick={() => handleOpenConfigEditor(site)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors flex items-center gap-1.5 text-xs font-medium"
                          title="Edit Nginx Configuration"
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Config</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onSelectFolder) onSelectFolder(site.rootPath);
                            if (setActiveTab) setActiveTab('files');
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
                );
              })}
              {sites.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-sans">
                    No websites configured yet. Click "Add New Website" above to host a domain!
                  </td>
                </tr>
              )}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
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
                    Automatically issue & configure SSL (Let's Encrypt)
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

      {/* In-Browser Nginx Configuration Editor Modal */}
      <AnimatePresence>
        {editingConfigSite && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-4xl h-[650px] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <span>Nginx Config Editor: {editingConfigSite.domain}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {configPath}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md transition-all"
                  >
                    {savingConfig ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{savingConfig ? 'Testing & Saving...' : 'Save & Reload Nginx'}</span>
                  </button>

                  <button 
                    onClick={() => setEditingConfigSite(null)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Alert Banners */}
              {configError && (
                <div className="px-6 py-2.5 bg-rose-950/60 border-b border-rose-800/60 text-xs text-rose-300 font-mono flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="px-6 py-2.5 bg-emerald-950/60 border-b border-emerald-800/60 text-xs text-emerald-300 font-mono flex items-center gap-2 shrink-0">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Nginx configuration tested (nginx -t) and reloaded successfully!</span>
                </div>
              )}

              {/* Code Editor Textarea */}
              <div className="flex-1 p-3 bg-slate-950 font-mono text-xs overflow-hidden">
                <textarea
                  value={configContent}
                  onChange={(e) => setConfigContent(e.target.value)}
                  className="w-full h-full p-4 bg-slate-950 text-indigo-200 resize-none focus:outline-none border border-slate-800/60 rounded-xl leading-relaxed tracking-wide font-mono selection:bg-indigo-600 selection:text-white"
                  spellCheck="false"
                />
              </div>

              {/* Editor Footer */}
              <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0 text-xs text-slate-400 font-mono">
                <span>Tip: Edit proxy routes, custom headers, buffers, or caching. Syntax is tested before reloading.</span>
                <button
                  onClick={() => setEditingConfigSite(null)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
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
