# AWS Deployment Guide for SalonFlow

This guide explains how to deploy the **SalonFlow** Salon Appointment Booking System to **Amazon Web Services (AWS)** using standard production practices.

---

## Architecture Overview

```text
[ Users (Browser) ]
        │
   HTTPS (443)
        ├───> AWS CloudFront / Amplify (Next.js Frontend)
        │
   HTTPS (443)
        └───> Application Load Balancer (ALB)
                    │
            [ AWS ECS Fargate / Elastic Beanstalk (Express API) ]
                    │
            [ AWS RDS MySQL Database (Multi-AZ) ]
```

---

## 1. Database Provisioning: AWS RDS (MySQL)

1. Navigate to the **AWS RDS Console** and choose **Create Database**.
2. Select **MySQL** (version 8.0).
3. Under Templates, choose **Production** (or **Free Tier** for testing).
4. Configure DB instance identifier: `salonflow-db`.
5. Set master username: `admin` and generate a master password.
6. Under Connectivity:
   - Select your VPC.
   - Choose **Public Access**: *No* (accessible only from within the VPC security group).
7. Under Additional Configuration:
   - Initial database name: `salon_flow`.
8. Click **Create Database** and note down the **RDS Endpoint**.

---

## 2. Backend Deployment: AWS Elastic Beanstalk or ECS

### Option A: AWS Elastic Beanstalk (Recommended for Fast Setup)

1. Install the AWS EB CLI:
   ```bash
   pip install awsebcli
   ```
2. In the `backend/` directory:
   ```bash
   eb init -p node.js-20 salonflow-backend --region ap-south-1
   eb create salonflow-backend-env
   ```
3. Set production environment variables via the AWS Console or CLI:
   ```bash
   eb setenv PORT=5000 \
             NODE_ENV=production \
             DB_HOST=your-rds-endpoint.rds.amazonaws.com \
             DB_PORT=3306 \
             DB_NAME=salon_flow \
             DB_USER=admin \
             DB_PASSWORD=your_rds_password \
             JWT_SECRET=your_32_character_minimum_random_secret \
             JWT_EXPIRES_IN=24h \
             SALON_SLUG=salonflow-demo \
             FRONTEND_URL=https://your-frontend-domain.com
   ```

### Option B: AWS ECS Fargate (Containerized)

1. Build and push the backend Docker image to **AWS ECR (Elastic Container Registry)**:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
   docker build -t salonflow-backend ./backend
   docker tag salonflow-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/salonflow-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/salonflow-backend:latest
   ```
2. Create an **ECS Task Definition** pointing to the ECR image with port mapping `5000`.
3. Create an **ECS Fargate Service** attached to an Application Load Balancer with SSL certificate from AWS Certificate Manager (ACM).

---

## 3. Database Migration on AWS

Once connected to your RDS instance, run the migrations and seeds:

```bash
npm run db:migrate
npm run db:seed
```

---

## 4. Frontend Deployment: AWS Amplify Hosting

AWS Amplify provides native zero-config hosting for Next.js (App Router):

1. Push your repository to **GitHub** or **GitLab**.
2. Go to the **AWS Amplify Console** and choose **Host web app**.
3. Select your repository and the `main` branch.
4. Set App Root to `frontend`.
5. Under **Environment variables**, configure:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
6. Click **Save and Deploy**. Amplify will build and host your Next.js frontend globally with CloudFront CDN and automatic HTTPS.

---

## 5. Automated Reminders Cron Job

The backend includes a built-in reminder service using `node-cron`. When the Express server runs on AWS Elastic Beanstalk or ECS, the cron job executes automatically in the background every hour to inspect upcoming appointments and dispatch emails.

For multi-instance horizontal scaling, you can optionally configure an **AWS EventBridge Rule** (cron schedule) that triggers an **AWS Lambda function** to POST `/api/admin/reminders/trigger` with admin credentials.

---

## 6. Production Security Checklist

- [ ] RDS security group allows incoming port 3306 traffic only from the ECS/Beanstalk security group.
- [ ] Database credentials and JWT secrets stored in **AWS Secrets Manager** or **Systems Manager Parameter Store**.
- [ ] Custom domain linked with **Route 53** and free SSL certificates provisioned via **AWS Certificate Manager (ACM)**.
