# SalonFlow API Documentation

Welcome to the **SalonFlow API** documentation. SalonFlow is an enterprise-grade appointment booking and salon management system.

The interactive Swagger UI documentation is also available live at:
```
http://localhost:5000/api/docs
```

---

## Base URL

- **Development:** `http://localhost:5000/api`
- **Production:** `https://api.yourdomain.com/api`

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained by logging in or registering.

---

## Table of Contents

1. [Authentication & Profiles](#1-authentication--profiles)
2. [Services Management](#2-services-management)
3. [Staff Management](#3-staff-management)
4. [Live Availability](#4-live-availability)
5. [Appointments & Booking](#5-appointments--booking)
6. [Payments & Invoicing](#6-payments--invoicing)
7. [Reviews & Feedback](#7-reviews--feedback)
8. [Admin Dashboard](#8-admin-dashboard)

---

## 1. Authentication & Profiles

### 1.1 Register Customer
Create a new customer account.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+91 9876543210",
  "preferences": {
    "preferredService": "Haircut",
    "reminders": true
  }
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": 5,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+91 9876543210",
      "role": "customer",
      "salonId": 1,
      "preferences": {
        "preferredService": "Haircut",
        "reminders": true
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

### 1.2 User Login
Log in with credentials and receive a JWT.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "customer@salonflow.local",
  "password": "ChangeThisForLocalDemo123!"
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 4,
      "name": "Demo Customer",
      "email": "customer@salonflow.local",
      "role": "customer",
      "salonId": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

---

### 1.3 Get Current User Profile
- **URL:** `/auth/me` or `/auth/profile`
- **Method:** `GET`
- **Auth Required:** Yes
- **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "name": "Demo Customer",
      "email": "customer@salonflow.local",
      "phone": "+91 9876543210",
      "role": "customer",
      "preferences": {}
    }
  }
}
```

---

### 1.4 Update Customer Profile & Preferences
- **URL:** `/auth/profile`
- **Method:** `PATCH` or `PUT`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "name": "Jane Smith",
  "phone": "+91 9123456789",
  "preferences": {
    "preferredStylist": "Aarav Sharma",
    "emailReminders": true,
    "smsReminders": false
  }
}
```
- **Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

## 2. Services Management

### 2.1 List All Active Services
- **URL:** `/services`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "services": [
      {
        "id": 1,
        "name": "Classic Haircut",
        "slug": "classic-haircut",
        "description": "A classic haircut tailored to your style.",
        "durationMinutes": 45,
        "pricePaise": 50000,
        "isActive": true
      }
    ]
  }
}
```

---

### 2.2 Get Service Details
- **URL:** `/services/:id`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "service": {
      "id": 1,
      "name": "Classic Haircut",
      "slug": "classic-haircut",
      "durationMinutes": 45,
      "pricePaise": 50000
    }
  }
}
```

---

### 2.3 Create Service (Admin)
- **URL:** `/services`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `admin`)
- **Request Body:**
```json
{
  "name": "Beard Grooming & Spa",
  "description": "Hot towel treatment and precision shaping",
  "durationMinutes": 30,
  "pricePaise": 35000,
  "isActive": true
}
```

---

### 2.4 Update Service (Admin)
- **URL:** `/services/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (Role: `admin`)

---

### 2.5 Delete / Deactivate Service (Admin)
- **URL:** `/services/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Role: `admin`)

---

## 3. Staff Management

### 3.1 List Staff Members
- **URL:** `/staff`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": {
    "staff": [
      {
        "id": 1,
        "bio": "Professional stylist",
        "specialties": ["Hair styling"],
        "user": {
          "id": 2,
          "name": "Aarav Sharma"
        },
        "services": [ ... ],
        "availability": [ ... ]
      }
    ]
  }
}
```

---

### 3.2 Add Staff Profile (Admin)
- **URL:** `/staff`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `admin`)
- **Request Body:**
```json
{
  "name": "Vikram Sethi",
  "email": "vikram@salonflow.local",
  "password": "StylistPassword123!",
  "bio": "Color specialist and senior stylist",
  "specialties": ["Coloring", "Styling"],
  "serviceIds": [1, 2]
}
```

---

### 3.3 Assign Services to Staff (Admin)
- **URL:** `/staff/:id/services`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `admin`)
- **Request Body:**
```json
{
  "serviceIds": [1, 2, 3]
}
```

---

### 3.4 Set Staff Schedule & Availability (Admin)
- **URL:** `/staff/:id/availability`
- **Method:** `PUT`
- **Auth Required:** Yes (Role: `admin`)
- **Request Body:**
```json
{
  "schedules": [
    { "dayOfWeek": 1, "startsAt": "10:00:00", "endsAt": "18:00:00" },
    { "dayOfWeek": 2, "startsAt": "10:00:00", "endsAt": "18:00:00" },
    { "dayOfWeek": 3, "startsAt": "10:00:00", "endsAt": "18:00:00" },
    { "dayOfWeek": 4, "startsAt": "10:00:00", "endsAt": "18:00:00" },
    { "dayOfWeek": 5, "startsAt": "10:00:00", "endsAt": "18:00:00" },
    { "dayOfWeek": 6, "startsAt": "10:00:00", "endsAt": "18:00:00" }
  ]
}
```

---

## 4. Live Availability

### 4.1 Check Available Slots
- **URL:** `/availability?serviceId=1&date=YYYY-MM-DD`
- **Optional Param:** `&staffId=1`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-10-15",
    "timezone": "Asia/Kolkata",
    "service": {
      "id": 1,
      "name": "Classic Haircut",
      "durationMinutes": 45,
      "pricePaise": 50000
    },
    "staff": [
      {
        "id": 1,
        "name": "Aarav Sharma",
        "slots": [
          {
            "startTime": "2026-10-15T10:00:00.000+05:30",
            "endTime": "2026-10-15T10:45:00.000+05:30"
          },
          {
            "startTime": "2026-10-15T10:15:00.000+05:30",
            "endTime": "2026-10-15T11:00:00.000+05:30"
          }
        ]
      }
    ]
  }
}
```

---

## 5. Appointments & Booking

### 5.1 Book Appointment
- **URL:** `/appointments`
- **Method:** `POST`
- **Auth Required:** Yes
- **Notes:** Automatically sends booking confirmation email to customer.
- **Request Body:**
```json
{
  "serviceId": 1,
  "staffId": 1,
  "startTime": "2026-10-15T10:00:00.000+05:30",
  "notes": "Prefer scissor cut over clippers"
}
```
- **Success Response (201):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "appointment": {
      "id": 10,
      "serviceId": 1,
      "staffId": 1,
      "startTime": "2026-10-15T10:00:00.000Z",
      "endTime": "2026-10-15T10:45:00.000Z",
      "pricePaise": 50000,
      "status": "confirmed"
    }
  }
}
```

---

### 5.2 Customer Appointments History
- **URL:** `/appointments/my`
- **Method:** `GET`
- **Auth Required:** Yes
- **Success Response (200):**
Includes service, staff, payment details, and review status.

---

### 5.3 Reschedule Appointment
- **URL:** `/appointments/:id/reschedule`
- **Method:** `PATCH`
- **Auth Required:** Yes
- **Notes:** Validates conflict against new time window and notifies customer via email.
- **Request Body:**
```json
{
  "startTime": "2026-10-15T14:00:00.000+05:30"
}
```

---

### 5.4 Cancel Appointment
- **URL:** `/appointments/:id/cancel`
- **Method:** `PATCH`
- **Auth Required:** Yes
- **Notes:** Validates cancellation policy (must not have already started) and sends cancellation notification.

---

## 6. Payments & Invoicing

### 6.1 Process Online Payment
- **URL:** `/appointments/:id/pay`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "paymentMethod": "card",
  "transactionId": "txn_strp_987654321"
}
```

---

### 6.2 Create Stripe Checkout Session
- **URL:** `/appointments/:id/stripe-session`
- **Method:** `POST`
- **Auth Required:** Yes
- **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "http://localhost:3000/appointments?booked=1&paid=1",
    "transactionId": "mock_stripe_1728734892"
  }
}
```

---

### 6.3 Download Automated PDF Invoice
- **URL:** `/appointments/:id/invoice`
- **Method:** `GET`
- **Auth Required:** Yes
- **Response:** PDF binary file (`Content-Type: application/pdf`).

---

## 7. Reviews & Feedback

### 7.1 Customer Submits Review
- **URL:** `/reviews`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "appointmentId": 10,
  "rating": 5,
  "comment": "Super clean haircut and on-time service!"
}
```

---

### 7.2 List Reviews
- **URL:** `/reviews`
- **Optional Params:** `?serviceId=1` or `?staffId=1`
- **Method:** `GET`
- **Auth Required:** No

---

### 7.3 Staff Responds to Review
- **URL:** `/reviews/:id/response`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `staff` or `admin`)
- **Request Body:**
```json
{
  "staffResponse": "Thank you for the review, Jane! Looking forward to your next visit."
}
```

---

## 8. Admin Dashboard

### 8.1 Dashboard Metrics & Revenue
- **URL:** `/admin/stats`
- **Method:** `GET`
- **Auth Required:** Yes (Role: `admin`)
- **Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 12,
    "totalStaff": 3,
    "totalServices": 5,
    "totalAppointments": 28,
    "totalRevenuePaise": 1400000,
    "statusCounts": {
      "pending": 2,
      "confirmed": 14,
      "completed": 10,
      "cancelled": 2
    }
  }
}
```

---

### 8.2 List All Salon Appointments
- **URL:** `/admin/appointments`
- **Optional Params:** `?status=confirmed&date=2026-10-15`
- **Method:** `GET`
- **Auth Required:** Yes (Role: `admin`)

---

### 8.3 Update Appointment Status
- **URL:** `/admin/appointments/:id/status`
- **Method:** `PATCH`
- **Auth Required:** Yes (Role: `admin`)
- **Request Body:**
```json
{
  "status": "completed"
}
```
*(Valid statuses: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`)*

---

### 8.4 Manage Salon Business Hours
- **URL:** `/admin/business-hours`
- **Method:** `GET` (Fetch hours) / `PUT` (Update hours)
- **Auth Required:** Yes (Role: `admin`)

---

### 8.5 Trigger Cron Reminders Manually
- **URL:** `/admin/reminders/trigger`
- **Method:** `POST`
- **Auth Required:** Yes (Role: `admin`)
- **Notes:** Scans for upcoming appointments within the next 24 hours and dispatches email reminders.
