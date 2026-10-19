import { io } from 'socket.io-client';

const API_BASE = '/api';

export const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
});

export const api = {
  // System
  getSystemOverview: async () => {
    const res = await fetch(`${API_BASE}/system/overview`);
    return res.json();
  },

  // Services
  getServices: async () => {
    const res = await fetch(`${API_BASE}/services`);
    return res.json();
  },
  serviceAction: async (serviceId, action) => {
    const res = await fetch(`${API_BASE}/services/${serviceId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return res.json();
  },

  // Sites
  getSites: async () => {
    const res = await fetch(`${API_BASE}/sites`);
    return res.json();
  },
  createSite: async (siteData) => {
    const res = await fetch(`${API_BASE}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    });
    return res.json();
  },
  deleteSite: async (siteId) => {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Files
  getFiles: async (targetPath = '') => {
    const query = targetPath ? `?path=${encodeURIComponent(targetPath)}` : '';
    const res = await fetch(`${API_BASE}/files${query}`);
    return res.json();
  },
  getFileContent: async (filePath) => {
    const res = await fetch(`${API_BASE}/files/content?path=${encodeURIComponent(filePath)}`);
    return res.json();
  },
  saveFileContent: async (filePath, content) => {
    const res = await fetch(`${API_BASE}/files/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content })
    });
    return res.json();
  },
  createFileOrFolder: async (targetDir, name, isFolder) => {
    const res = await fetch(`${API_BASE}/files/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir, name, isFolder })
    });
    return res.json();
  },

  // Firewall
  getFirewallRules: async () => {
    const res = await fetch(`${API_BASE}/firewall`);
    return res.json();
  },
  addFirewallRule: async (ruleData) => {
    const res = await fetch(`${API_BASE}/firewall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData)
    });
    return res.json();
  },
  deleteFirewallRule: async (ruleId) => {
    const res = await fetch(`${API_BASE}/firewall/${ruleId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Databases
  getDatabases: async () => {
    const res = await fetch(`${API_BASE}/databases`);
    return res.json();
  },
  createDatabase: async (dbData) => {
    const res = await fetch(`${API_BASE}/databases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbData)
    });
    return res.json();
  },

  // App Store / Software Manager
  getAppStorePackages: async () => {
    const res = await fetch(`${API_BASE}/appstore/packages`);
    return res.json();
  },
  installPackage: async (packageId) => {
    const res = await fetch(`${API_BASE}/appstore/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId })
    });
    return res.json();
  },
  uninstallPackage: async (packageId) => {
    const res = await fetch(`${API_BASE}/appstore/uninstall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId })
    });
    return res.json();
  }
};

