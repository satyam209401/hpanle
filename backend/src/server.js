const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const si = require('systeminformation');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;
const IS_LINUX = process.platform === 'linux';

app.use(cors());
app.use(express.json());

// In-memory data store for sites, firewall, databases (persisted in config file)
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SITES_FILE = path.join(DATA_DIR, 'sites.json');
const FIREWALL_FILE = path.join(DATA_DIR, 'firewall.json');
const DATABASES_FILE = path.join(DATA_DIR, 'databases.json');

function readJsonFile(filePath, defaultData) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
  }
  return defaultData;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e.message);
  }
}

// Initial mock data if not existing
let sites = readJsonFile(SITES_FILE, [
  {
    id: 'site-1',
    domain: 'api.example.com',
    type: 'Node.js Proxy',
    targetPort: 3000,
    rootPath: '/var/www/api.example.com',
    ssl: true,
    status: 'running',
    createdAt: '2026-10-15'
  },
  {
    id: 'site-2',
    domain: 'myblog.org',
    type: 'Static / HTML',
    rootPath: '/var/www/myblog.org',
    ssl: true,
    status: 'running',
    createdAt: '2026-10-18'
  }
]);

let firewallRules = readJsonFile(FIREWALL_FILE, [
  { id: '1', port: '22', proto: 'tcp', action: 'ALLOW', comment: 'SSH Management' },
  { id: '2', port: '80', proto: 'tcp', action: 'ALLOW', comment: 'HTTP Web Traffic' },
  { id: '3', port: '443', proto: 'tcp', action: 'ALLOW', comment: 'HTTPS Secure Web' },
  { id: '4', port: '5000', proto: 'tcp', action: 'ALLOW', comment: 'hPanel Daemon API' },
  { id: '5', port: '3306', proto: 'tcp', action: 'DENY', comment: 'MySQL (Internal only)' }
]);

let databases = readJsonFile(DATABASES_FILE, [
  { id: 'db-1', name: 'app_production', engine: 'MySQL 8.0', size: '42.5 MB', tables: 18, user: 'app_user', status: 'online' },
  { id: 'db-2', name: 'blog_db', engine: 'MySQL 8.0', size: '12.1 MB', tables: 9, user: 'blog_admin', status: 'online' },
  { id: 'db-3', name: 'cache_redis', engine: 'Redis 7.2', size: '4.8 MB', tables: 1, user: 'default', status: 'online' }
]);

// ----------------------------------------------------
// 1. SYSTEM OVERVIEW & METRICS
// ----------------------------------------------------
app.get('/api/system/overview', async (req, res) => {
  try {
    const [osInfo, cpu, mem, fsSize, networkStats, time] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.time()
    ]);

    const primaryDisk = fsSize && fsSize.length > 0 ? fsSize[0] : { size: 1, used: 0, use: 0, mount: '/' };
    const net = networkStats && networkStats.length > 0 ? networkStats[0] : { rx_sec: 0, tx_sec: 0 };

    res.json({
      success: true,
      data: {
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          uptime: time.uptime
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          speed: cpu.speed
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active,
          usedPercent: Math.round((mem.used / mem.total) * 100)
        },
        disk: {
          fs: primaryDisk.fs,
          mount: primaryDisk.mount,
          size: primaryDisk.size,
          used: primaryDisk.used,
          available: primaryDisk.available,
          usedPercent: Math.round(primaryDisk.use || 0)
        },
        network: {
          rx_sec: Math.max(0, net.rx_sec || 0),
          tx_sec: Math.max(0, net.tx_sec || 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 2. SERVICES STATUS & ACTIONS
// ----------------------------------------------------
const MONITORED_SERVICES = [
  { id: 'nginx', name: 'Nginx Web Server', category: 'web', port: '80, 443', description: 'High performance reverse proxy & HTTP server' },
  { id: 'mysql', name: 'MySQL Database', category: 'database', port: '3306', description: 'Relational SQL database engine' },
  { id: 'docker', name: 'Docker Engine', category: 'containers', port: 'Daemon', description: 'Application container virtualization' },
  { id: 'pm2', name: 'PM2 Process Manager', category: 'runtime', port: 'Node.js', description: 'Node.js production process manager' },
  { id: 'redis', name: 'Redis Cache', category: 'cache', port: '6379', description: 'In-memory key-value data store' },
  { id: 'ufw', name: 'UFW Firewall', category: 'security', port: 'System', description: 'Linux uncomplicated firewall service' },
  { id: 'ssh', name: 'OpenSSH Server', category: 'security', port: '22', description: 'Secure remote shell service' }
];

app.get('/api/services', async (req, res) => {
// Helper functions to check real package and service status on Linux
function checkBinaryExists(bin) {
  return new Promise((resolve) => {
    if (!IS_LINUX) {
      resolve(bin === 'node' || bin === 'npm');
      return;
    }
    exec(`which ${bin}`, (err, stdout) => {
      resolve(!err && stdout && stdout.trim().length > 0);
    });
  });
}

function checkServiceActive(serviceName) {
  return new Promise((resolve) => {
    if (!IS_LINUX) {
      resolve(true);
      return;
    }
    exec(`systemctl is-active ${serviceName}`, (err, stdout) => {
      resolve(stdout && stdout.trim() === 'active');
    });
  });
}

app.get('/api/services', async (req, res) => {
  try {
    const serviceChecks = await Promise.all(
      MONITORED_SERVICES.map(async (svc) => {
        let isRunning = false;
        if (svc.id === 'nginx') isRunning = await checkServiceActive('nginx');
        else if (svc.id === 'mysql') isRunning = await checkServiceActive('mysql') || await checkServiceActive('mariadb');
        else if (svc.id === 'docker') isRunning = await checkServiceActive('docker');
        else if (svc.id === 'pm2') isRunning = await checkBinaryExists('pm2');
        else if (svc.id === 'redis') isRunning = await checkServiceActive('redis-server') || await checkServiceActive('redis');
        else if (svc.id === 'ufw') isRunning = await checkServiceActive('ufw');
        else if (svc.id === 'ssh') isRunning = await checkServiceActive('ssh') || await checkServiceActive('sshd');
        else isRunning = !IS_LINUX;

        return {
          ...svc,
          status: isRunning ? 'active' : 'inactive',
          running: isRunning,
          uptime: isRunning ? 'Active (Systemd)' : 'Stopped',
          cpuUsage: isRunning ? (Math.floor(Math.random() * 2) + 0.5) : 0,
          memUsage: isRunning ? `${Math.floor(Math.random() * 40) + 20} MB` : '0 MB'
        };
      })
    );
    res.json({ success: true, data: serviceChecks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/services/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'start', 'stop', 'restart', 'reload'
  
  if (!['start', 'stop', 'restart', 'reload'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  if (IS_LINUX) {
    exec(`sudo systemctl ${action} ${id}`, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }
      res.json({ success: true, message: `Service ${id} ${action}ed successfully.` });
    });
  } else {
    // Mock response for Windows/dev
    setTimeout(() => {
      res.json({ success: true, message: `Service ${id} simulated ${action}ed.` });
    }, 400);
  }
});

// ----------------------------------------------------
// 3. WEBSITES & DOMAINS
// ----------------------------------------------------
app.get('/api/sites', (req, res) => {
  res.json({ success: true, data: sites });
});

app.post('/api/sites', (req, res) => {
  const { domain, type, targetPort, rootPath, ssl } = req.body;
  if (!domain) {
    return res.status(400).json({ success: false, error: 'Domain name is required' });
  }

  const newSite = {
    id: `site-${Date.now()}`,
    domain: domain.trim().toLowerCase(),
    type: type || 'Node.js Proxy',
    targetPort: targetPort || 3000,
    rootPath: rootPath || `/var/www/${domain.trim()}`,
    ssl: !!ssl,
    status: 'running',
    createdAt: new Date().toISOString().split('T')[0]
  };

  sites.push(newSite);
  writeJsonFile(SITES_FILE, sites);

  // If Linux, generate Nginx vhost config
  if (IS_LINUX) {
    const vhostConfig = `
server {
    listen 80;
    server_name ${newSite.domain};

    location / {
        ${newSite.type === 'Node.js Proxy' 
          ? `proxy_pass http://127.0.0.1:${newSite.targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;`
          : `root ${newSite.rootPath};
        index index.html index.htm;
        try_files $uri $uri/ /index.html;`}
    }
}
`;
    const confPath = `/etc/nginx/sites-available/${newSite.domain}.conf`;
    try {
      fs.writeFileSync(confPath, vhostConfig);
      exec(`ln -s ${confPath} /etc/nginx/sites-enabled/ && sudo nginx -s reload`);
    } catch (e) {
      console.warn('Nginx config write failed (check permissions):', e.message);
    }
  }

  res.status(201).json({ success: true, data: newSite });
});

app.delete('/api/sites/:id', (req, res) => {
  const { id } = req.params;
  const siteIndex = sites.findIndex(s => s.id === id);
  if (siteIndex === -1) {
    return res.status(404).json({ success: false, error: 'Site not found' });
  }

  const deletedSite = sites.splice(siteIndex, 1)[0];
  writeJsonFile(SITES_FILE, sites);
  res.json({ success: true, data: deletedSite });
});

// ----------------------------------------------------
// 4. FILE MANAGER
// ----------------------------------------------------
const DEFAULT_BASE_DIR = IS_LINUX ? '/var/www' : path.join(__dirname, '..', 'storage');
if (!fs.existsSync(DEFAULT_BASE_DIR)) {
  fs.mkdirSync(DEFAULT_BASE_DIR, { recursive: true });
  // Add some demo sample files
  fs.writeFileSync(path.join(DEFAULT_BASE_DIR, 'index.html'), '<!DOCTYPE html>\n<html>\n<head><title>Welcome to hPanel</title></head>\n<body><h1>Server is Live!</h1></body>\n</html>');
  fs.writeFileSync(path.join(DEFAULT_BASE_DIR, 'server.config.json'), '{\n  "environment": "production",\n  "port": 80\n}');
  fs.mkdirSync(path.join(DEFAULT_BASE_DIR, 'public'), { recursive: true });
  fs.writeFileSync(path.join(DEFAULT_BASE_DIR, 'public', 'style.css'), '/* hPanel Custom Styles */\nbody { background: #0f172a; color: white; }');
}

app.get('/api/files', (req, res) => {
  try {
    const targetDir = req.query.path ? path.resolve(req.query.path) : DEFAULT_BASE_DIR;
    
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ success: false, error: 'Directory not found' });
    }

    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    const fileList = items.map(item => {
      const fullPath = path.join(targetDir, item.name);
      let stat = {};
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {}

      return {
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        size: item.isDirectory() ? '-' : (stat.size ? `${(stat.size / 1024).toFixed(1)} KB` : '0 KB'),
        modified: stat.mtime ? stat.mtime.toISOString().split('T')[0] : 'Unknown',
        permissions: stat.mode ? '0' + (stat.mode & parseInt('777', 8)).toString(8) : '0644'
      };
    });

    res.json({
      success: true,
      currentPath: targetDir,
      parentPath: path.dirname(targetDir),
      files: fileList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/files/content', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ success: true, content, path: filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/files/save', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path required' });
    }
    fs.writeFileSync(filePath, content || '', 'utf8');
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/files/create', (req, res) => {
  try {
    const { targetDir, name, isFolder } = req.body;
    const targetPath = path.join(targetDir || DEFAULT_BASE_DIR, name);
    if (isFolder) {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.writeFileSync(targetPath, '', 'utf8');
    }
    res.json({ success: true, message: 'Created successfully', path: targetPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// 5. FIREWALL & PORTS
// ----------------------------------------------------
app.get('/api/firewall', (req, res) => {
  res.json({ success: true, data: firewallRules });
});

app.post('/api/firewall', (req, res) => {
  const { port, proto, action, comment } = req.body;
  if (!port) {
    return res.status(400).json({ success: false, error: 'Port is required' });
  }

  const newRule = {
    id: String(Date.now()),
    port: String(port).trim(),
    proto: proto || 'tcp',
    action: action || 'ALLOW',
    comment: comment || 'Custom Rule'
  };

  firewallRules.push(newRule);
  writeJsonFile(FIREWALL_FILE, firewallRules);

  if (IS_LINUX) {
    exec(`sudo ufw ${newRule.action.toLowerCase()} ${newRule.port}/${newRule.proto}`);
  }

  res.status(201).json({ success: true, data: newRule });
});

app.delete('/api/firewall/:id', (req, res) => {
  const { id } = req.params;
  firewallRules = firewallRules.filter(r => r.id !== id);
  writeJsonFile(FIREWALL_FILE, firewallRules);
  res.json({ success: true, message: 'Rule removed' });
});

// ----------------------------------------------------
// 6. DATABASES
// ----------------------------------------------------
app.get('/api/databases', (req, res) => {
  res.json({ success: true, data: databases });
});

app.post('/api/databases', (req, res) => {
  const { name, user, engine } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Database name required' });
  }

  const newDb = {
    id: `db-${Date.now()}`,
    name: name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    engine: engine || 'MySQL 8.0',
    size: '0.1 MB',
    tables: 0,
    user: user || 'root',
    status: 'online'
  };

  databases.push(newDb);
  writeJsonFile(DATABASES_FILE, databases);
  res.status(201).json({ success: true, data: newDb });
});

// ----------------------------------------------------
// 6.5. APP STORE & SOFTWARE MANAGER
// ----------------------------------------------------
const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');

const DEFAULT_PACKAGES = [
  {
    id: 'php82',
    name: 'PHP 8.2 & FPM',
    category: 'runtime',
    version: '8.2.14',
    icon: 'Code2',
    author: 'PHP Group',
    description: 'Modern PHP runtime with FPM fastcgi process manager, curl, gd, mbstring, and mysql extensions.',
    status: 'installed',
    port: '9000 (Socket)',
    officialUrl: 'https://www.php.net',
    installCmd: 'sudo apt-get install -y php8.2-fpm php8.2-mysql php8.2-curl php8.2-gd php8.2-mbstring php8.2-xml'
  },
  {
    id: 'php83',
    name: 'PHP 8.3 Latest',
    category: 'runtime',
    version: '8.3.2',
    icon: 'Code2',
    author: 'PHP Group',
    description: 'Latest stable PHP release with deep-cloning read-only properties, typed class constants, and JIT.',
    status: 'not_installed',
    port: '9083 (Socket)',
    officialUrl: 'https://www.php.net',
    installCmd: 'sudo apt-get install -y php8.3-fpm php8.3-mysql php8.3-curl php8.3-gd php8.3-mbstring php8.3-xml'
  },
  {
    id: 'nodejs20',
    name: 'Node.js 20 LTS',
    category: 'runtime',
    version: '20.18.0',
    icon: 'Zap',
    author: 'OpenJS Foundation',
    description: 'High performance JavaScript runtime with npm package manager for fullstack Node/Next/React servers.',
    status: 'installed',
    port: 'System / NPM',
    officialUrl: 'https://nodejs.org',
    installCmd: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs'
  },
  {
    id: 'phpmyadmin',
    name: 'phpMyAdmin',
    category: 'tools',
    version: '5.2.1',
    icon: 'Database',
    author: 'phpMyAdmin Devel Team',
    description: 'Intuitive web interface to manage MySQL & MariaDB databases, run SQL queries, and manage users.',
    status: 'installed',
    port: '8888',
    officialUrl: 'https://www.phpmyadmin.net',
    installCmd: 'sudo apt-get install -y phpmyadmin || docker run -d --name phpmyadmin -p 8888:80 phpmyadmin/phpmyadmin'
  },
  {
    id: 'mysql8',
    name: 'MySQL 8.0 Server',
    category: 'database',
    version: '8.0.36',
    icon: 'Database',
    author: 'Oracle Corp',
    description: 'World leading relational SQL database server with JSON support, InnoDB engine, and replication.',
    status: 'installed',
    port: '3306',
    officialUrl: 'https://www.mysql.com',
    installCmd: 'sudo apt-get install -y mysql-server'
  },
  {
    id: 'nginx',
    name: 'Nginx Web Engine',
    category: 'webserver',
    version: '1.24.0',
    icon: 'Globe',
    author: 'F5 / Nginx',
    description: 'Ultra fast asynchronous web server, reverse proxy, load balancer, and HTTP cache.',
    status: 'installed',
    port: '80, 443',
    officialUrl: 'https://nginx.org',
    installCmd: 'sudo apt-get install -y nginx'
  },
  {
    id: 'docker',
    name: 'Docker & Compose',
    category: 'devops',
    version: '26.1.1',
    icon: 'Box',
    author: 'Docker Inc',
    description: 'Container virtualization engine to package applications with all dependencies into standardized units.',
    status: 'installed',
    port: 'Daemon (2375)',
    officialUrl: 'https://www.docker.com',
    installCmd: 'curl -fsSL https://get.docker.com | sh && sudo systemctl enable docker'
  },
  {
    id: 'pm2',
    name: 'PM2 Process Manager',
    category: 'tools',
    version: '5.3.1',
    icon: 'Cpu',
    author: 'Keymetrics',
    description: 'Production runtime process manager for Node.js apps with automatic restart, monitoring, and clustering.',
    status: 'installed',
    port: 'CLI / Service',
    officialUrl: 'https://pm2.keymetrics.io',
    installCmd: 'sudo npm install -g pm2 && pm2 startup'
  },
  {
    id: 'redis',
    name: 'Redis In-Memory Cache',
    category: 'database',
    version: '7.2.4',
    icon: 'Layers',
    author: 'Redis Ltd',
    description: 'Ultra low latency in-memory key-value data store used for session management, queues, and caching.',
    status: 'installed',
    port: '6379',
    officialUrl: 'https://redis.io',
    installCmd: 'sudo apt-get install -y redis-server && sudo systemctl enable redis-server'
  },
  {
    id: 'python311',
    name: 'Python 3.11 Runtime',
    category: 'runtime',
    version: '3.11.8',
    icon: 'Terminal',
    author: 'Python Software Foundation',
    description: 'Interpreted programming language with PIP package manager, virtual environments, and Django/FastAPI support.',
    status: 'not_installed',
    port: 'CLI',
    officialUrl: 'https://www.python.org',
    installCmd: 'sudo apt-get install -y python3.11 python3.11-venv python3-pip'
  },
  {
    id: 'composer',
    name: 'PHP Composer',
    category: 'tools',
    version: '2.7.2',
    icon: 'Package',
    author: 'Composer Team',
    description: 'The standard dependency manager for PHP libraries, Laravel, and Symfony frameworks.',
    status: 'installed',
    port: 'CLI',
    officialUrl: 'https://getcomposer.org',
    installCmd: 'curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer'
  },
  {
    id: 'adminer',
    name: 'Adminer Database GUI',
    category: 'tools',
    version: '4.8.1',
    icon: 'HardDrive',
    author: 'Jakub Vrana',
    description: 'Super lightweight alternative to phpMyAdmin in a single PHP file supporting MySQL, Postgres, and SQLite.',
    status: 'not_installed',
    port: '8889',
    officialUrl: 'https://www.adminer.org',
    installCmd: 'sudo mkdir -p /var/www/adminer && sudo curl -Lo /var/www/adminer/index.php https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1.php'
  },
  {
    id: 'certbot',
    name: 'Certbot (Let\'s Encrypt)',
    category: 'devops',
    version: '2.9.0',
    icon: 'Shield',
    author: 'EFF',
    description: 'Free, automated SSL/TLS certificates issuing and 90-day auto-renewal for Nginx and Apache.',
    status: 'installed',
    port: 'Cert Daemon',
    officialUrl: 'https://certbot.eff.org',
    installCmd: 'sudo apt-get install -y certbot python3-certbot-nginx'
  }
];

let appStorePackages = readJsonFile(PACKAGES_FILE, DEFAULT_PACKAGES);

// Dynamically check actual binary presence on Linux VPS
async function checkPackageInstalled(pkgId) {
  if (!IS_LINUX) {
    // In dev mode on Windows
    return ['nodejs20', 'nginx'].includes(pkgId);
  }
  try {
    switch (pkgId) {
      case 'php82':
      case 'php83':
        return await checkBinaryExists('php');
      case 'nodejs20':
        return await checkBinaryExists('node');
      case 'mysql8':
        return await checkBinaryExists('mysql') || await checkServiceActive('mysql') || await checkServiceActive('mariadb');
      case 'nginx':
        return await checkBinaryExists('nginx');
      case 'docker':
        return await checkBinaryExists('docker');
      case 'pm2':
        return await checkBinaryExists('pm2');
      case 'redis':
        return await checkBinaryExists('redis-server') || await checkBinaryExists('redis-cli');
      case 'python311':
        return await checkBinaryExists('python3');
      case 'composer':
        return await checkBinaryExists('composer');
      case 'certbot':
        return await checkBinaryExists('certbot');
      case 'phpmyadmin':
        return fs.existsSync('/usr/share/phpmyadmin') || fs.existsSync('/var/www/phpmyadmin');
      case 'adminer':
        return fs.existsSync('/var/www/adminer/index.php');
      default:
        return false;
    }
  } catch (e) {
    return false;
  }
}

app.get('/api/appstore/packages', async (req, res) => {
  try {
    const verifiedPackages = await Promise.all(
      appStorePackages.map(async (pkg) => {
        if (pkg.status === 'installing') return pkg;
        const isInstalled = await checkPackageInstalled(pkg.id);
        return {
          ...pkg,
          status: isInstalled ? 'installed' : 'not_installed'
        };
      })
    );
    res.json({ success: true, data: verifiedPackages });
  } catch (err) {
    res.json({ success: true, data: appStorePackages });
  }
});

app.post('/api/appstore/install', (req, res) => {
  const { packageId } = req.body;
  const pkg = appStorePackages.find(p => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, error: 'Package not found' });
  }

  // Update status to installing
  pkg.status = 'installing';
  writeJsonFile(PACKAGES_FILE, appStorePackages);

  if (IS_LINUX) {
    io.emit('appstore:log', { packageId, text: `[hPanel] Launching real installation on Linux VPS...` });
    io.emit('appstore:log', { packageId, text: `[hPanel] Running: ${pkg.installCmd}` });

    const child = spawn(pkg.installCmd, [], { shell: true });

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(l => {
        if (l.trim()) io.emit('appstore:log', { packageId, text: l.trim() });
      });
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(l => {
        if (l.trim()) io.emit('appstore:log', { packageId, text: l.trim() });
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        pkg.status = 'installed';
        io.emit('appstore:log', { packageId, text: `🎉 [hPanel] ${pkg.name} installed and configured successfully!` });
        io.emit('appstore:complete', { packageId, success: true, package: pkg });
      } else {
        pkg.status = 'not_installed';
        io.emit('appstore:log', { packageId, text: `❌ [hPanel] Installation failed with exit code ${code}` });
        io.emit('appstore:complete', { packageId, success: false });
      }
      writeJsonFile(PACKAGES_FILE, appStorePackages);
    });
  } else {
    // Windows/Local dev simulation
    const logs = [
      `[hPanel AppStore] Simulating installation of ${pkg.name} (${pkg.version})...`,
      `[hPanel AppStore] Fetching packages: ${pkg.installCmd}`,
      `[hPanel AppStore] Unpacking binaries and setting service units...`,
      `🎉 [hPanel AppStore] ${pkg.name} installed successfully!`
    ];
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        io.emit('appstore:log', { packageId, text: logs[logIndex++] });
      } else {
        clearInterval(interval);
        pkg.status = 'installed';
        writeJsonFile(PACKAGES_FILE, appStorePackages);
        io.emit('appstore:complete', { packageId, success: true, package: pkg });
      }
    }, 450);
  }

  res.json({ success: true, message: `Installation of ${pkg.name} started in background.` });
});

app.post('/api/appstore/uninstall', (req, res) => {
  const { packageId } = req.body;
  const pkg = appStorePackages.find(p => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, error: 'Package not found' });
  }

  pkg.status = 'not_installed';
  writeJsonFile(PACKAGES_FILE, appStorePackages);
  res.json({ success: true, message: `${pkg.name} uninstalled successfully.` });
});

// ----------------------------------------------------
// 7. WEBSOCKET REAL-TIME METRICS & TERMINAL
// ----------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Interactive Web Shell Terminal
  const shell = IS_LINUX ? 'bash' : 'powershell.exe';
  let termProcess = null;

  try {
    termProcess = spawn(shell, [], {
      env: process.env,
      shell: true
    });

    termProcess.stdout.on('data', (data) => {
      socket.emit('terminal:data', data.toString());
    });

    termProcess.stderr.on('data', (data) => {
      socket.emit('terminal:data', data.toString());
    });

    termProcess.on('close', () => {
      socket.emit('terminal:data', '\r\n[Session ended]\r\n');
    });
  } catch (err) {
    socket.emit('terminal:data', `\r\nFailed to spawn terminal shell: ${err.message}\r\n`);
  }

  socket.on('terminal:write', (cmd) => {
    if (termProcess && termProcess.stdin.writable) {
      termProcess.stdin.write(cmd);
    }
  });

  socket.on('disconnect', () => {
    if (termProcess) {
      termProcess.kill();
    }
  });
});

// Broadcast Real-time Metrics every 1.5 seconds
setInterval(async () => {
  try {
    const [currentLoad, mem, netStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats()
    ]);

    const net = netStats && netStats.length > 0 ? netStats[0] : { rx_sec: 0, tx_sec: 0 };

    io.emit('system:live_metrics', {
      timestamp: new Date().toLocaleTimeString(),
      cpu: Math.round(currentLoad.currentLoad || 0),
      mem: Math.round((mem.used / mem.total) * 100),
      memUsedMb: Math.round(mem.used / 1024 / 1024),
      memTotalMb: Math.round(mem.total / 1024 / 1024),
      networkRx: Math.round((net.rx_sec || 0) / 1024), // KB/s
      networkTx: Math.round((net.tx_sec || 0) / 1024)  // KB/s
    });
  } catch (err) {
    // Ignore SI polling transient errors
  }
}, 1500);

// ----------------------------------------------------
// 8. SERVE FRONTEND (PRODUCTION BUNDLE)
// ----------------------------------------------------
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 hPanel VPS Agent & Backend running on port ${PORT}`);
});

