import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Globe, 
  FolderTree, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Database, 
  Server,
  Activity,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, systemInfo }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appstore', label: 'App Store', icon: ShoppingBag, badge: '1-Click' },
    { id: 'websites', label: 'Websites & SSL', icon: Globe, badge: 'Nginx' },
    { id: 'files', label: 'File Manager', icon: FolderTree },
    { id: 'terminal', label: 'Web SSH Terminal', icon: Terminal, badge: 'Live' },
    { id: 'services', label: 'App & Services', icon: Layers },
    { id: 'firewall', label: 'Security & UFW', icon: ShieldCheck },
    { id: 'databases', label: 'Databases', icon: Database },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20 backdrop-blur-xl">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/60 bg-slate-900/40 relative overflow-hidden group">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30"
          >
            <Server className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                hPanel
              </span>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full uppercase">
                VPS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              v1.0 • Control Engine
            </span>
          </div>

          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        </div>

        {/* Server State Chip */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 my-4 p-3 rounded-xl bg-slate-800/40 border border-slate-750/80 flex items-center gap-3 relative overflow-hidden group hover:border-slate-700 transition-colors"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping"></span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {systemInfo?.os?.hostname || 'vps-node-01'}
            </div>
            <div className="text-[11px] text-slate-400 truncate font-mono">
              {systemInfo?.os?.distro || 'Linux'} ({systemInfo?.os?.arch || 'x64'})
            </div>
          </div>
        </motion.div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 relative">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Control Center
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {/* Sliding active pill background using Framer Motion layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30"
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`relative z-10 text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/30 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Daemon API
          </span>
          <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Online :5000
          </span>
        </div>
        <div className="text-[10px] text-slate-500 text-center font-mono">
          aaPanel Alternative Engine
        </div>
      </div>
    </aside>
  );
}
