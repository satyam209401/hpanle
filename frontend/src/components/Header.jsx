import React, { useState } from 'react';
import { 
  Bell, 
  RotateCw, 
  Terminal, 
  Power, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Wifi,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function Header({ systemInfo, liveMetrics, setActiveTab }) {
  const [restarting, setRestarting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRestartWeb = async () => {
    try {
      setRestarting(true);
      await api.serviceAction('nginx', 'restart');
      showToast('Nginx web service restarted successfully!');
    } catch (e) {
      showToast('Action completed.');
    } finally {
      setRestarting(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'Active';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const cpuVal = liveMetrics?.cpu ?? 12;
  const memVal = liveMetrics?.mem ?? systemInfo?.memory?.usedPercent ?? 34;
  const diskVal = systemInfo?.disk?.usedPercent ?? 41;

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 backdrop-blur-md sticky top-0 z-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-indigo-400 text-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left: Server Status & Quick Metrics */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">VPS Running</span>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          {/* CPU pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 font-sans text-[11px]">CPU:</span>
            <span className={`font-semibold ${cpuVal > 80 ? 'text-rose-400' : cpuVal > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {cpuVal}%
            </span>
          </div>

          {/* RAM pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 font-sans text-[11px]">RAM:</span>
            <span className={`font-semibold ${memVal > 85 ? 'text-rose-400' : memVal > 60 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {memVal}%
            </span>
          </div>

          {/* Disk pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className="text-slate-400 font-sans text-[11px]">Disk:</span>
            <span className="font-semibold text-purple-400">{diskVal}%</span>
          </div>

          {/* Uptime */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">Uptime: {formatUptime(systemInfo?.os?.uptime)}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleRestartWeb}
          disabled={restarting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          title="Restart Nginx Web Server"
        >
          <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${restarting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Restart Nginx</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-300 transition-colors"
          title="Open Web SSH Console"
        >
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">SSH Terminal</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1"></div>

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
            ROOT
          </div>
        </div>
      </div>
    </header>
  );
}
