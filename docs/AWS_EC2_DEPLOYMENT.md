# AWS EC2 Single-Instance Deployment Guide

This guide walks you through deploying **SalonFlow** (Next.js Frontend + Express Backend + MySQL Database + Nginx Reverse Proxy) on a single **AWS EC2 Ubuntu instance** using **Docker Compose**.

---

## Architecture

```text
[ Browser / Users ]
        │
   HTTP / HTTPS (Port 80 / 443)
        ▼
   [ AWS EC2 Instance ]
        │
    [ Nginx Reverse Proxy (Container) ]
        │
        ├───► Path: /api/*  ───► [ Express API :5000 (Container) ]
        │                                 │
        │                                 ▼
        │                         [ MySQL 8.0 :3306 (Container with Volume) ]
        │
        └───► Path: /*      ───► [ Next.js App :3000 (Container) ]
```

---

## Step 1: Launch an AWS EC2 Instance

1. Open the [AWS Management Console](https://console.aws.amazon.com/ec2/).
2. Click **Launch Instances**.
3. **Name**: `salonflow-production`
4. **Application and OS Images (AMI)**:
   - Select **Ubuntu 22.04 LTS** (or **Ubuntu 24.04 LTS**), 64-bit (x86).
5. **Instance Type**:
   - `t3.small` (2 vCPU, 2 GB RAM) or `t3.medium` (Recommended for building Next.js).
   - If using `t2.micro` (Free Tier), ensure a 2GB swapfile is enabled before building.
6. **Key Pair (Login)**:
   - Click **Create new key pair**, name it `salonflow-key`, select `.pem` (for Mac/Linux/OpenSSH) or `.ppk` (for PuTTY). Download and save it safely.
7. **Network Settings (Security Group)**:
   - Check **Allow SSH traffic from Anywhere** (`0.0.0.0/0` or My IP) — Port 22
   - Check **Allow HTTP traffic from the internet** (`0.0.0.0/0`) — Port 80
   - Check **Allow HTTPS traffic from the internet** (`0.0.0.0/0`) — Port 443
8. **Configure Storage**:
   - Set **20 GiB gp3** SSD storage.
9. Click **Launch Instance**.

---

## Step 2: Connect to your EC2 Instance via SSH

Open your local terminal (PowerShell, Command Prompt, or bash) and run:

```bash
# On Linux/macOS, set permissions for the key:
chmod 400 salonflow-key.pem

# Connect to the instance:
ssh -i "salonflow-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

*(Replace `<YOUR-EC2-PUBLIC-IP>` with the public IPv4 address shown on your AWS EC2 console).*

---

## Step 3: Clone Your Project on EC2

Once logged into your EC2 terminal:

```bash
# Clone your repository
git clone <YOUR_GITHUB_OR_GITLAB_REPO_URL> salon-flow
cd salon-flow
```

*Or, if you don't have it on GitHub yet, you can upload the folder using `scp`:*
```bash
# Run this from your local computer:
scp -i "salonflow-key.pem" -r "c:\Users\Fa1b0y\Desktop\Workspace\salon-flow" ubuntu@<YOUR-EC2-PUBLIC-IP>:~/salon-flow
```

---

## Step 4: Configure Production Secrets

Create or verify the production `.env` file inside `backend/`:

```bash
nano backend/.env
```

Ensure your keys are configured:
```env
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://<YOUR-EC2-PUBLIC-IP>

DB_HOST=mysql
DB_PORT=3306
DB_NAME=salon-flow
DB_USER=root
DB_PASSWORD=YourStrongDatabasePassword123!

JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=24h
SALON_SLUG=salonflow-demo
SEED_DEMO_PASSWORD=ChangeThisForLocalDemo123!

# Razorpay
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourKeySecret

# SendGrid Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.YourSendGridApiKey
SMTP_SECURE=false
EMAIL_FROM="SalonFlow Studio" <shivam23.iimt@gmail.com>

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+18153621424
```
*(Press `Ctrl + O` and `Enter` to save, then `Ctrl + X` to exit nano).*

---

## Step 5: Run the Automated Deployment

Make the deployment script executable and run it:

```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### What this script does automatically:
1. Installs **Docker** and **Docker Compose** on Ubuntu.
2. Configures the firewall rules (allowing ports 22, 80, 443).
3. Boots up **MySQL 8.0** with persistent storage volumes.
4. Waits for MySQL healthcheck, automatically executes database migrations (`npm run db:migrate`), and seeds the initial demo data (`npm run db:seed`).
5. Builds and boots the **Express API** and the **Next.js Frontend**.
6. Starts the **Nginx reverse proxy** routing web traffic to port 80.

---

## Step 6: Verify the Live Deployment

Once the script finishes:

1. **Open your browser and navigate to:**
   - **Frontend App:** `http://<YOUR-EC2-PUBLIC-IP>/`
   - **API Documentation (Swagger):** `http://<YOUR-EC2-PUBLIC-IP>/api/docs/`
   - **API Health Check:** `http://<YOUR-EC2-PUBLIC-IP>/api/services`

2. **Log in with the seeded accounts:**
   - **Customer:** `customer@salonflow.local` / `ChangeThisForLocalDemo123!`
   - **Admin:** `admin@salonflow.local` / `ChangeThisForLocalDemo123!`
   - **Staff:** `aarav@salonflow.local` / `ChangeThisForLocalDemo123!`

---

## Useful Operational Commands

- **Check container status:**
  ```bash
  docker compose ps
  ```
- **View live backend logs:**
  ```bash
  docker compose logs -f backend
  ```
- **View live frontend logs:**
  ```bash
  docker compose logs -f frontend
  ```
- **Restart all services:**
  ```bash
  docker compose restart
  ```
- **Rebuild and restart after making code changes:**
  ```bash
  git pull
  docker compose up -d --build
  ```

