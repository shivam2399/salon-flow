#!/bin/bash
# ==============================================================================
# SalonFlow - Automated AWS EC2 Deployment Script
# Target OS: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS on AWS EC2
# ==============================================================================

set -e

echo "🚀 Starting SalonFlow EC2 Deployment Setup..."

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw ca-certificates gnupg lsb-release

# 2. Install Docker & Docker Compose if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 3. Configure EC2 Firewall (UFW)
echo "🛡️ Configuring Firewall rules (SSH: 22, HTTP: 80, HTTPS: 443)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

# 4. Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found! Copying from backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "👉 Please edit backend/.env with your production secrets."
fi

# 5. Build and launch all containers
echo "🚀 Building and starting containers (MySQL, Backend, Frontend, Nginx)..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

# 6. Wait for database and migrations
echo "⏳ Waiting for MySQL to become healthy and migrations to complete..."
sleep 25

# 7. Print status
echo ""
echo "=================================================================="
echo "🎉 SalonFlow has been successfully deployed on your EC2 instance!"
echo "=================================================================="
echo ""
sudo docker ps
echo ""
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com || curl -s ifconfig.me || echo "your-ec2-public-ip")
echo "🌐 Access your application at:"
echo "   Frontend Web App:  http://${PUBLIC_IP}/"
echo "   Backend REST API:  http://${PUBLIC_IP}/api/"
echo "   Swagger API Docs:  http://${PUBLIC_IP}/api/docs/"
echo ""
echo "=================================================================="

