# 🚀 hPanel — Modern Linux VPS Management Dashboard

**hPanel** is an open-source, lightweight, high-performance VPS management control panel built with **React** and **Node.js** — designed to give you an experience similar to aaPanel and Hostinger hPanel for managing your Linux server directly from the browser.

---

## 🌟 Key Features

1. **🛍️ 1-Click App Store & Package Manager**
   - 1-Click install & uninstall for:
     - **PHP** (PHP 8.2 & FPM, PHP 8.3 with extensions)
     - **Node.js** (v20 LTS & npm)
     - **phpMyAdmin** (Web GUI for MySQL with direct 1-click launch)
     - **Databases** (MySQL 8.0, Redis 7.2)
     - **Web Engines** (Nginx 1.24)
     - **DevOps Tools** (Docker Engine, Docker Compose, PM2, Certbot SSL, Composer)
   - Real-time terminal installation logs streamed live via WebSockets.

2. **📊 Real-Time Server Monitoring**
   - Live CPU, RAM, Disk, and Network I/O gauges and activity stream charts.
   - Uptime, OS kernel, and CPU core frequencies updated every 1.5 seconds via WebSockets.

2. **🌐 Websites & Virtual Hosts Management**
   - Add domains and subdomains with automatic Nginx configuration generation.
   - Support for Node.js / Python / Docker reverse proxies and static HTML websites.
   - Free SSL (Let's Encrypt) configuration readiness.

3. **💻 Interactive Web SSH Terminal**
   - Direct root / user shell terminal in the browser using WebSockets.
   - Quick one-click execution shortcuts for `df -h`, `free -m`, `uptime`, `systemctl`, `docker ps`, etc.

4. **📁 Visual File Explorer & In-Browser Code Editor**
   - Browse files and folders with breadcrumb navigation.
   - Create files and directories, view file size and permissions (`0755`, `0644`).
   - Integrated full-screen code editor to edit scripts, `.env`, and config files on the fly.

5. **⚡ App & Service Store**
   - Monitor and control system services: Nginx, MySQL / MariaDB, Docker Engine, PM2, Redis, OpenSSH, and UFW.
   - 1-click **Restart**, **Stop**, and **Start** actions.

6. **🛡️ Firewall & Port Security**
   - Visual Linux UFW (Uncomplicated Firewall) rules management.
   - Open and close custom ports (e.g., 80, 443, 3000, 8080, 3306) with custom notes.

7. **🗄️ Database Management**
   - Create and inspect MySQL, PostgreSQL, and Redis database instances and tables.

---

## 🚀 Running Locally (Development Mode)

From the `hPanel` root folder:

### 1. Start the Backend VPS Agent (Port 5000)
```bash
cd backend
npm run dev
```

### 2. Start the React Frontend Dashboard (Port 3001)
```bash
cd frontend
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3001/
```

---

## 🐧 Deploying on your Live Linux VPS (Ubuntu / Debian)

To install and run **hPanel** on your VPS as a persistent system service (so it starts automatically on server reboot):

```bash
# 1. Clone or copy hPanel to your VPS
git clone <your-repo-url> /opt/hpanel
cd /opt/hpanel

# 2. Run the automated installer
chmod +x install.sh
sudo ./install.sh
```

The installer will:
- Install Node.js (if not installed)
- Build the React production frontend
- Create and start a `systemd` service (`hpanel.service`)
- Allow access on port `5000` via UFW
