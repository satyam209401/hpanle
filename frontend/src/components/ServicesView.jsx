import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  Square, 
  RotateCw, 
  CheckCircle, 
  AlertCircle, 
  Server, 
  Cpu, 
  HardDrive,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function ServicesView({ services, onRefreshServices }) {
  const [loadingService, setLoadingService] = useState(null);

  const handleAction = async (serviceId, action) => {
    try {
      setLoadingService(`${serviceId}-${action}`);
      await api.serviceAction(serviceId, action);
      onRefreshServices();
    } catch (err) {
      alert(`Failed to ${action} service: ${err.message}`);
    } finally {
      setLoadingService(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>App & Service Manager</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control Linux systemd services, web engines, database daemons, and containers.
          </p>
        </div>

        <button
          onClick={onRefreshServices}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
        >
          <RotateCw className="w-4 h-4 text-indigo-400" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => {
          const isRestarting = loadingService === `${service.id}-restart`;
          const isStopping = loadingService === `${service.id}-stop`;
          const isStarting = loadingService === `${service.id}-start`;

          return (
            <div 
              key={service.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-sm transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">Port: {service.port}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Running
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {service.description}
                </p>

                {/* Resource usage pills */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-750 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-sans">CPU</span>
                    <span className="text-slate-200 font-semibold">{service.cpuUsage}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-750 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] font-sans">RAM</span>
                    <span className="text-slate-200 font-semibold">{service.memUsage}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleAction(service.id, 'restart')}
                  disabled={isRestarting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${isRestarting ? 'animate-spin' : ''}`} />
                  <span>Restart</span>
                </button>

                <button
                  onClick={() => handleAction(service.id, 'stop')}
                  disabled={isStopping}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  title="Stop Service"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleAction(service.id, 'start')}
                  disabled={isStarting}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 border border-slate-700 transition-colors"
                  title="Start Service"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
