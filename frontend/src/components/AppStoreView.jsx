import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Check, 
  Trash2, 
  Terminal, 
  ExternalLink, 
  Code2, 
  Database, 
  Globe, 
  Box, 
  Cpu, 
  Layers, 
  Package, 
  Shield, 
  HardDrive,
  Zap,
  RotateCw,
  X,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, socket } from '../services/api';

export default function AppStoreView() {
  const [packages, setPackages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingPkg, setInstallingPkg] = useState(null);
  const [installLogs, setInstallLogs] = useState([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const logEndRef = useRef(null);

  const fetchPackages = async () => {
    try {
      const res = await api.getAppStorePackages();
      if (res?.success) {
        setPackages(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  };

  useEffect(() => {
    fetchPackages();

    const handleLog = (data) => {
      setInstallLogs((prev) => [...prev, data.text]);
    };

    const handleComplete = (data) => {
      setInstallingPkg(null);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
      fetchPackages();
    };

    socket.on('appstore:log', handleLog);
    socket.on('appstore:complete', handleComplete);

    return () => {
      socket.off('appstore:log', handleLog);
      socket.off('appstore:complete', handleComplete);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [installLogs]);

  const handleInstall = async (pkg) => {
    try {
      setInstallingPkg(pkg);
      setInstallLogs([`[hPanel] Preparing installation environment for ${pkg.name}...`]);
      setShowLogModal(true);
      await api.installPackage(pkg.id);
    } catch (err) {
      alert('Install failed: ' + err.message);
      setInstallingPkg(null);
    }
  };

  const handleUninstall = async (pkg) => {
    if (window.confirm(`Are you sure you want to uninstall ${pkg.name}?`)) {
      await api.uninstallPackage(pkg.id);
      fetchPackages();
    }
  };

  const categories = [
    { id: 'all', label: 'All Packages' },
    { id: 'runtime', label: 'Runtimes (PHP/Node/Python)' },
    { id: 'webserver', label: 'Web Engines' },
    { id: 'database', label: 'Databases & Cache' },
    { id: 'tools', label: 'Admin Tools (phpMyAdmin)' },
    { id: 'devops', label: 'Docker & DevOps' },
  ];

  const filteredPackages = packages.filter((pkg) => {
    const matchesCat = selectedCategory === 'all' || pkg.category === selectedCategory;
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getPackageIcon = (iconName) => {
    switch (iconName) {
      case 'Code2': return <Code2 className="w-5 h-5 text-indigo-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Database': return <Database className="w-5 h-5 text-cyan-400" />;
      case 'Globe': return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'Box': return <Box className="w-5 h-5 text-blue-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-violet-400" />;
      case 'Layers': return <Layers className="w-5 h-5 text-rose-400" />;
      case 'Terminal': return <Terminal className="w-5 h-5 text-sky-400" />;
      case 'Package': return <Package className="w-5 h-5 text-orange-400" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5 text-teal-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-400" />;
      default: return <Package className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            <span>App Store & Package Manager</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            1-Click automated installation for PHP, Node.js, phpMyAdmin, MySQL, Docker, and DevOps utilities.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PHP, Node, MySQL, phpMyAdmin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-750 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map((pkg) => {
          const isInstalled = pkg.status === 'installed';
          const isInstalling = pkg.status === 'installing';

          return (
            <motion.div
              key={pkg.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`bg-slate-900/70 border rounded-2xl p-5 backdrop-blur-xl transition-all flex flex-col justify-between space-y-4 group ${
                isInstalled 
                  ? 'border-slate-800 hover:border-indigo-500/40' 
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      {getPackageIcon(pkg.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          v{pkg.version}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-sans">By {pkg.author}</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isInstalled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Installed
                    </span>
                  ) : isInstalling ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      <RotateCw className="w-3 h-3 animate-spin text-indigo-400" />
                      Installing
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Available
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-3.5 leading-relaxed line-clamp-2">
                  {pkg.description}
                </p>

                {/* Port / Command Info */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-800/40 border border-slate-750/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[11px] font-sans">Service Port</span>
                  <span className="text-indigo-300 font-semibold">{pkg.port}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <a
                  href={pkg.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors font-medium"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  {/* Special phpMyAdmin Open Button */}
                  {pkg.id === 'phpmyadmin' && isInstalled && (
                    <button
                      onClick={() => window.open('http://localhost:8888', '_blank')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open GUI</span>
                    </button>
                  )}

                  {isInstalled ? (
                    <button
                      onClick={() => handleUninstall(pkg)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Uninstall</span>
                    </button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleInstall(pkg)}
                      disabled={isInstalling}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>1-Click Install</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Installation Log Modal */}
      <AnimatePresence>
        {showLogModal && (
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
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]"
            >
              {/* Modal Titlebar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white font-mono">
                    Installing: {installingPkg?.name || 'Package'}
                  </span>
                  {installingPkg && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Live Terminal Log Stream */}
              <div className="flex-1 p-5 bg-slate-950 font-mono text-xs text-indigo-200 overflow-y-auto space-y-1.5 select-text">
                {installLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className={log.includes('🎉') ? 'text-emerald-400 font-bold' : log.includes('Executing') ? 'text-cyan-300' : 'text-slate-200'}>
                      {log}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-mono">
                  {installingPkg ? 'Compiling & configuring daemon...' : 'Installation finished.'}
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
