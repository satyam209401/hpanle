import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import AppStoreView from './components/AppStoreView';
import WebsitesView from './components/WebsitesView';
import FileManagerView from './components/FileManagerView';
import TerminalView from './components/TerminalView';
import ServicesView from './components/ServicesView';
import FirewallView from './components/FirewallView';
import DatabasesView from './components/DatabasesView';
import AnimatedBackground from './components/AnimatedBackground';
import { api, socket } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemInfo, setSystemInfo] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [sites, setSites] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [selectedFolderForFiles, setSelectedFolderForFiles] = useState('');

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      const [sysRes, srvRes, siteRes, fwRes, dbRes] = await Promise.all([
        api.getSystemOverview().catch(() => null),
        api.getServices().catch(() => null),
        api.getSites().catch(() => null),
        api.getFirewallRules().catch(() => null),
        api.getDatabases().catch(() => null)
      ]);

      if (sysRes?.success) setSystemInfo(sysRes.data);
      if (srvRes?.success) setServices(srvRes.data);
      if (siteRes?.success) setSites(siteRes.data);
      if (fwRes?.success) setFirewallRules(fwRes.data);
      if (dbRes?.success) setDatabases(dbRes.data);
    } catch (err) {
      console.error('Initial data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Socket.io live performance metrics stream
    socket.on('system:live_metrics', (data) => {
      setLiveMetrics(data);
      setMetricsHistory((prev) => {
        const next = [...prev, { cpu: data.cpu, mem: data.mem, time: data.timestamp }];
        return next.slice(-24); // Keep last 24 intervals
      });
    });

    return () => {
      socket.off('system:live_metrics');
    };
  }, []);

  const handleRestartService = async (serviceId) => {
    await api.serviceAction(serviceId, 'restart');
    const srvRes = await api.getServices();
    if (srvRes?.success) setServices(srvRes.data);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Dynamic Ambient Background */}
      <AnimatedBackground />

      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemInfo={systemInfo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Top Navbar */}
        <Header
          systemInfo={systemInfo}
          liveMetrics={liveMetrics}
          setActiveTab={setActiveTab}
        />

        {/* Animated View Router */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  systemInfo={systemInfo}
                  liveMetrics={liveMetrics}
                  metricsHistory={metricsHistory}
                  services={services}
                  sites={sites}
                  databases={databases}
                  setActiveTab={setActiveTab}
                  onRestartService={handleRestartService}
                />
              )}

              {activeTab === 'appstore' && (
                <AppStoreView />
              )}

              {activeTab === 'websites' && (
                <WebsitesView
                  sites={sites}
                  onRefreshSites={fetchAllData}
                  setActiveTab={setActiveTab}
                  onSelectFolder={setSelectedFolderForFiles}
                />
              )}

              {activeTab === 'files' && (
                <FileManagerView
                  initialPath={selectedFolderForFiles}
                />
              )}

              {activeTab === 'terminal' && (
                <TerminalView />
              )}

              {activeTab === 'services' && (
                <ServicesView
                  services={services}
                  onRefreshServices={fetchAllData}
                />
              )}

              {activeTab === 'firewall' && (
                <FirewallView
                  rules={firewallRules}
                  onRefreshRules={fetchAllData}
                />
              )}

              {activeTab === 'databases' && (
                <DatabasesView
                  databases={databases}
                  onRefreshDatabases={fetchAllData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
