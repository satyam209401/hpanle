import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  Layers, 
  Globe, 
  Database, 
  Terminal, 
  RotateCw,
  Server,
  Shield,
  ExternalLink,
  CheckCircle,
  Plus,
  Zap,
  Radio
} from 'lucide-react';
import NetworkWaveCanvas from './NetworkWaveCanvas';
import confetti from 'canvas-confetti';

export default function DashboardView({ 
  systemInfo, 
  liveMetrics, 
  metricsHistory = [], 
  services = [], 
  sites = [], 
  databases = [],
  setActiveTab,
  onRestartService
}) {
  const cpuPercent = liveMetrics?.cpu ?? 12;
  const memPercent = liveMetrics?.mem ?? systemInfo?.memory?.usedPercent ?? 38;
  const diskPercent = systemInfo?.disk?.usedPercent ?? 42;
  const netRx = liveMetrics?.networkRx ?? 45;
  const netTx = liveMetrics?.networkTx ?? 28;

  const memUsedGb = ((systemInfo?.memory?.used || 0) / (1024 * 1024 * 1024)).toFixed(2);
  const memTotalGb = ((systemInfo?.memory?.total || 0) / (1024 * 1024 * 1024)).toFixed(2);
  const diskUsedGb = ((systemInfo?.disk?.used || 0) / (1024 * 1024 * 1024)).toFixed(1);
  const diskTotalGb = ((systemInfo?.disk?.size || 0) / (1024 * 1024 * 1024)).toFixed(1);

  const triggerCelebration = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#06b6d4', '#a855f7', '#10b981']
    });
  };

  // Radial Gauge Component with Rotating Glow Indicator
  const RadialGauge = ({ percentage, color, title, subtitle, icon: Icon, extra, glowClass }) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const rotationDeg = (percentage / 100) * 360 - 90;

    return (
      <motion.div 
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl group hover:border-slate-700 transition-all ${glowClass}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-xl bg-slate-800/80 ${color.icon} border border-slate-750 shadow-inner`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{subtitle}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700">
            {extra}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Radial progress ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800/60"
                strokeWidth="9"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${color.stroke} transition-all duration-1000 ease-out`}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Center percentage label */}
            <div className="absolute flex flex-col items-center select-none">
              <motion.span 
                key={percentage}
                initial={{ scale: 0.85, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xl font-extrabold font-mono text-white tracking-tight"
              >
                {percentage}%
              </motion.span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Load</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-right font-mono">
            <div className="text-xs text-slate-400 font-sans">Condition</div>
            <div className={`text-sm font-bold flex items-center justify-end gap-1 ${
              percentage > 85 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${percentage > 85 ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
              {percentage > 85 ? 'Heavy Load' : 'Healthy'}
            </div>
            <div className="text-[11px] text-slate-500">
              Dynamic Stream
            </div>
          </div>
        </div>

        {/* Shimmer sweep effect on card */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-full h-full animate-shimmer" />
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="p-8 space-y-8 max-w-7xl mx-auto relative z-10"
    >
      {/* Top Mission Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>VPS Mission Control</span>
            </h1>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Daemons Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time automated control engine, system telemetry, and reverse proxy mesh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerCelebration();
              setActiveTab('websites');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Website</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('terminal')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-750 transition-all backdrop-blur-md"
          >
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Open Shell</span>
          </motion.button>
        </div>
      </div>

      {/* 4 Core Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <RadialGauge
          percentage={cpuPercent}
          title="CPU Core Load"
          subtitle={`${systemInfo?.cpu?.cores || 2} vCPU Cores`}
          extra={`${systemInfo?.cpu?.speed || 2.4} GHz`}
          icon={Cpu}
          color={{ stroke: 'stroke-indigo-500', icon: 'text-indigo-400' }}
          glowClass="hover:neon-glow-indigo"
        />

        <RadialGauge
          percentage={memPercent}
          title="Memory RAM"
          subtitle={`${memUsedGb} GB / ${memTotalGb || '8.00'} GB`}
          extra="DDR4"
          icon={Activity}
          color={{ stroke: 'stroke-cyan-500', icon: 'text-cyan-400' }}
          glowClass="hover:neon-glow-cyan"
        />

        <RadialGauge
          percentage={diskPercent}
          title="Storage NVMe"
          subtitle={`${diskUsedGb} GB / ${diskTotalGb || '50'} GB`}
          extra={systemInfo?.disk?.mount || '/'}
          icon={HardDrive}
          color={{ stroke: 'stroke-purple-500', icon: 'text-purple-400' }}
          glowClass="hover:neon-glow-indigo"
        />

        {/* Live Network Bandwidth Wave Visualizer */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl group hover:border-slate-700 transition-all hover:neon-glow-cyan flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-750">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Network Telemetry</h3>
                <p className="text-[11px] text-slate-400 font-mono">Real-Time Wave</p>
              </div>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-400 border border-cyan-500/30">
              Live
            </span>
          </div>

          {/* Interactive Wave Canvas */}
          <NetworkWaveCanvas rx={netRx} tx={netTx} />
        </motion.div>
      </div>

      {/* Real-time Load Activity Stream Visualizer */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Continuous Telemetry Stream</span>
            </h2>
            <p className="text-xs text-slate-400">High-resolution live metrics streaming via Socket.io daemon</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> CPU: {cpuPercent}%
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> Memory: {memPercent}%
            </span>
          </div>
        </div>

        {/* Dynamic bar chart / sparkline visualization */}
        <div className="h-36 flex items-end gap-1.5 pt-6 pb-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden relative">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-x-0 top-1/4 border-b border-white/[0.04] pointer-events-none" />
          <div className="absolute inset-x-0 top-2/4 border-b border-white/[0.04] pointer-events-none" />
          <div className="absolute inset-x-0 top-3/4 border-b border-white/[0.04] pointer-events-none" />

          {metricsHistory.map((m, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative z-10">
              {/* CPU bar */}
              <motion.div 
                initial={{ height: '0%' }}
                animate={{ height: `${Math.max(10, m.cpu)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`w-full rounded-t-sm transition-all duration-300 opacity-80 group-hover:opacity-100 ${
                  m.cpu > 75 
                    ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm shadow-rose-500' 
                    : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400'
                }`}
              />
              {/* Hover Tooltip */}
              <div className="absolute -top-9 hidden group-hover:flex bg-slate-800/90 border border-slate-700 text-[10px] text-white px-2 py-1 rounded shadow-xl whitespace-nowrap z-30 font-mono backdrop-blur-md">
                CPU: {m.cpu}% | {m.time}
              </div>
            </div>
          ))}

          {metricsHistory.length === 0 && (
            <div className="w-full text-center text-xs text-slate-500 py-10 font-mono">
              Listening for real-time WebSocket metrics pulse...
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Monitored Services & System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitored Services (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Monitored Linux Daemons</span>
              </h2>
              <p className="text-xs text-slate-400">Automated service supervision and failure restart</p>
            </div>
            <button
              onClick={() => setActiveTab('services')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Manage All Services</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {services.slice(0, 6).map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ scale: 1.015 }}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-750/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-400/50"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/40 animate-ping absolute inset-0"></span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{service.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">Port: {service.port}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileTap={{ rotate: 180 }}
                    onClick={() => onRestartService(service.id)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
                    title={`Restart ${service.name}`}
                  >
                    <RotateCw className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Server Specs Card (1 Col) */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">System Hardware</h2>
          </div>

          <div className="space-y-3 text-xs pt-1 font-mono">
            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Node Name</span>
              <span className="text-slate-200 font-semibold">{systemInfo?.os?.hostname || 'vps-server'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">OS Distro</span>
              <span className="text-slate-200">{systemInfo?.os?.distro || 'Linux'} {systemInfo?.os?.release || ''}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Arch</span>
              <span className="text-slate-200">{systemInfo?.os?.arch || 'x86_64'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Processor</span>
              <span className="text-slate-200 truncate max-w-[150px]">{systemInfo?.cpu?.brand || 'Intel Xeon / AMD EPYC'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Engine</span>
              <span className="text-emerald-400">Nginx 1.24 Active</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 font-sans">Daemon</span>
              <span className="text-indigo-400">v1.0 (Node.js agent)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
