# SalonFlow — Enterprise Salon Appointment Booking Platform

SalonFlow is an enterprise-grade salon appointment booking and salon management platform designed to streamline scheduling, staff management, payment processing, customer reviews, and administrative operations.

The system is inspired by modern booking platforms like [Fresha](https://www.fresha.com/) and provides a secure, fully documented REST API paired with a responsive Next.js frontend demonstration.

---

## 🚀 Live Interactive Documentation

- **Swagger / OpenAPI Documentation:** `http://localhost:5000/api/docs`
- **Markdown API Specification:** [API Documentation](docs/API_DOCUMENTATION.md)
- **Postman Collection:** [SalonFlow Postman Collection](docs/SalonFlow.postman_collection.json)
- **AWS Deployment Guide:** [AWS Deployment Guide](docs/AWS_DEPLOYMENT.md)

---

## ✨ Features Implemented

### 1. User Authentication and Profiles
- **Customer Registration & Login:** Secure authentication using JWT (`jsonwebtoken`) and password hashing via `bcryptjs`.
- **Role-Based Access Control:** Separate roles for `customer`, `staff`, and `admin`.
- **Profile & Preference Management:** Customers can manage their profiles, phone numbers, preferred stylists, and salon preferences (quiet appointment, email reminders).
- **Profile Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `PATCH /api/auth/profile`.

### 2. Service Management
- **Service Listings:** Full list of salon services with prices (in minor currency units/paise), durations, descriptions, and statuses.
- **Admin Management:** Endpoints for salon administrators to create, update, and deactivate services (`POST`, `PUT`, `DELETE /api/services`).
- **Working Hours & Availability:** Endpoints to set and customize salon business hours and daily schedules (`GET`, `PUT /api/admin/business-hours`).

### 3. Staff Management
- **Staff Profiles:** Detailed stylist profiles including bio, experience, and specializations.
- **Assign Services:** Admin endpoints to assign or reassign specific services to staff members (`POST /api/staff/:id/services`).
- **Staff Schedules & Availability:** Configurable weekly working hours per staff member (`PUT /api/staff/:id/availability`).

### 4. Appointment Booking & Real-Time Availability
- **Live Slot Lookup:** Dynamic availability engine taking into account salon operating hours, individual staff working schedules, service durations, and existing conflicting appointments.
- **Concurrency Locking:** Database-level transactional locking (`LOCK.UPDATE`) to prevent double-booking.
- **Booking Confirmation:** Automated confirmation emails dispatched via `nodemailer` upon booking.

### 5. Automated Reminders & Notifications
- **Background Cron Job:** Built-in scheduler (`node-cron`) automatically running in the background to detect upcoming appointments within 24 hours and send email reminders.
- **On-Demand Reminders Trigger:** Admin endpoint to manually invoke reminder dispatching (`POST /api/admin/reminders/trigger`).
- **Email Templates:** Formatted responsive HTML email templates for booking confirmations, rescheduling, cancellations, and reminders.

### 6. Appointment Rescheduling & Cancellations
- **Rescheduling Policy:** Customers can reschedule future appointments to another open slot (`PATCH /api/appointments/:id/reschedule`) with conflict checks and automatic email notification.
- **Cancellation Policy:** Enforced policy (must be in the future, must be pending/confirmed) with cancellation notifications (`PATCH /api/appointments/:id/cancel`).

### 7. Payments & Automated Invoicing
- **Online Payment Gateway Integration:** Stripe payment integration (`stripe`) supporting card checkout sessions and simulated online payments (`POST /api/appointments/:id/pay`, `POST /api/appointments/:id/stripe-session`).
- **Automated PDF Invoice Generation:** On-the-fly downloadable tax invoices generated with `pdfkit` for completed/paid appointments (`GET /api/appointments/:id/invoice`).

### 8. Reviews & Feedback
- **Customer Feedback:** Customers can rate (1 to 5 stars) and write comments on their completed appointments (`POST /api/reviews`).
- **Public & Filtered Reviews:** Reviews viewable by service or staff (`GET /api/reviews`).
- **Staff & Admin Response:** Stylists and admins can respond to reviews to maintain salon reputation (`POST /api/reviews/:id/response`).

### 9. Admin Dashboard
- **Metrics & Analytics:** Total revenue calculation, total bookings by status, active services, staff count (`GET /api/admin/stats`).
- **All Appointments Oversight:** Filter and update any appointment status (`completed`, `in_progress`, `cancelled`, `no_show`).
- **Customer Account Management:** View registered users and activate/deactivate accounts (`GET`, `PATCH /api/admin/users/:id`).
- **Dedicated Admin UI:** Full-featured frontend panel at `/admin`.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express 5, Sequelize ORM, MySQL 8, JWT, Zod, Luxon, Nodemailer, Node-cron, PDFKit, Stripe, Swagger UI Express.
- **Frontend:** Next.js (App Router), React 19, Tailwind CSS.
- **DevOps & Containers:** Docker, Docker Compose, AWS Deployment Architecture.

---

## 📁 Project Structure

```text
salon-flow/
├── backend/
│   ├── migrations/             # Database migrations (Umzug)
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── controllers/        # Express route controllers
│   │   ├── docs/               # OpenAPI 3.0 / Swagger spec
│   │   ├── middleware/         # Auth (JWT) & Zod validation
│   │   ├── models/             # Sequelize models (User, Service, Staff, Appointment, Payment, Review)
│   │   ├── routes/             # REST route declarations
│   │   ├── scripts/            # Migrate & seed scripts
│   │   ├── services/           # Business logic, email, cron, invoice, payment
│   │   └── validators/         # Zod schemas
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Admin Management Dashboard
│   │   │   ├── appointments/   # Customer bookings, cancel, reschedule, invoice, review
│   │   │   ├── login/          # Customer & Admin sign in / register
│   │   │   ├── profile/        # Customer profile & styling preferences
│   │   │   ├── layout.js
│   │   │   └── page.js         # Landing page, service menu, booking form, reviews
│   │   ├── components/         # Navbar and UI widgets
│   │   └── lib/                # API client helper
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── API_DOCUMENTATION.md    # Detailed API markdown documentation
│   ├── SalonFlow.postman_collection.json # Postman API collection
│   └── AWS_DEPLOYMENT.md       # Production AWS guide
├── docker-compose.yml          # Full-stack container orchestration
├── .gitignore
└── README.md
```

---

## 🏁 Quick Start (Local Development)

### 1. Configure the Backend

```bash
cd backend
npm install
```

Ensure your `.env` file is set up (see `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=salon-flow
DB_USER=root
DB_PASSWORD=your_mysql_password

SEED_DEMO_PASSWORD=ChangeThisForLocalDemo123!
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1h
SALON_SLUG=salonflow-demo
```

Run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

Start the backend:

```bash
npm run dev
```

The API runs at: `http://localhost:5000`
Swagger UI is live at: `http://localhost:5000/api/docs`

---

### 2. Configure the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo Accounts

The seed script creates the following demo accounts (Password: `ChangeThisForLocalDemo123!` or value in `SEED_DEMO_PASSWORD`):

| Role | Email | Features |
|---|---|---|
| **Admin** | `admin@salonflow.local` | Access to `/admin`, manage all bookings, services, staff, metrics, run reminder checks |
| **Staff** | `aarav@salonflow.local` | Senior Stylist, assigned services, respond to reviews |
| **Staff** | `priya@salonflow.local` | Senior Stylist, assigned services, respond to reviews |
| **Customer** | `customer@salonflow.local` | Book appointments, reschedule, pay online, download PDF invoices, leave reviews |

---

## 🐳 Running with Docker Compose

To run the entire stack (MySQL, Backend, Frontend) with one command:

```bash
docker-compose up --build
```
