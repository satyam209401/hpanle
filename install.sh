#!/bin/bash
# ==============================================================================
# hPanel Auto-Installer for Linux VPS (Ubuntu / Debian)
# ==============================================================================

set -e

echo "=========================================================="
echo "         🚀 Installing hPanel VPS Control Center          "
echo "=========================================================="

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo ./install.sh)"
  exit 1
fi

# 2. Update System & Install Essentials
echo "📦 Updating packages..."
apt-get update -y
apt-get install -y curl git ufw nginx

# 3. Install Node.js (v20 LTS) if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"

# 4. Install Dependencies & Build Frontend
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
echo "📂 Working directory: $APP_DIR"

echo "📦 Installing Backend dependencies..."
cd "$APP_DIR/backend"
npm install --production

echo "📦 Installing Frontend dependencies & building bundle..."
cd "$APP_DIR/frontend"
npm install
npm run build

# 5. Setup Systemd Service
echo "⚙️ Creating hpanel.service systemd daemon..."
cat <<EOF > /etc/systemd/system/hpanel.service
[Unit]
Description=hPanel VPS Management Daemon & Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
Environment=PORT=5000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable hpanel
systemctl restart hpanel

# 6. Configure Firewall
if command -v ufw &> /dev/null; then
    ufw allow 5000/tcp comment 'hPanel Control Panel' || true
fi

SERVER_IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')

echo "=========================================================="
echo " 🎉 hPanel Installation Completed Successfully! "
echo "=========================================================="
echo " Dashboard URL: http://$SERVER_IP:5000"
echo " Service Status: systemctl status hpanel"
echo "=========================================================="
