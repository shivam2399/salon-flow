export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "SalonFlow REST API",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for the Salon Appointment Booking System, covering User Auth, Services, Staff, Live Availability, Bookings, Reminders, Rescheduling/Cancellations, Payments (Stripe), Invoicing, Reviews/Feedback, and Admin Dashboard Management.",
    contact: {
      name: "SalonFlow API Support",
      email: "support@salonflow.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from /api/auth/login or /api/auth/register",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Demo Customer" },
          email: { type: "string", example: "customer@salonflow.local" },
          phone: { type: "string", example: "+91 9876543210" },
          role: { type: "string", enum: ["customer", "staff", "admin"], example: "customer" },
          preferences: { type: "object", example: { preferredStylist: "Aarav Sharma", notifications: true } },
        },
      },
      Service: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Classic Haircut" },
          slug: { type: "string", example: "classic-haircut" },
          description: { type: "string", example: "Tailored haircut and styling." },
          durationMinutes: { type: "integer", example: 45 },
          pricePaise: { type: "integer", example: 50000 },
          isActive: { type: "boolean", example: true },
        },
      },
      Staff: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          bio: { type: "string", example: "Senior stylist with 8 years experience." },
          specialties: { type: "array", items: { type: "string" }, example: ["Haircuts", "Coloring"] },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 2 },
              name: { type: "string", example: "Aarav Sharma" },
            },
          },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          serviceId: { type: "integer", example: 1 },
          staffId: { type: "integer", example: 1 },
          startTime: { type: "string", format: "date-time", example: "2026-10-15T10:00:00.000+05:30" },
          endTime: { type: "string", format: "date-time", example: "2026-10-15T10:45:00.000+05:30" },
          durationMinutes: { type: "integer", example: 45 },
          pricePaise: { type: "integer", example: 50000 },
          status: { type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"], example: "confirmed" },
          notes: { type: "string", example: "Short fade on the sides" },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          appointmentId: { type: "integer", example: 1 },
          rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Great styling and very polite staff!" },
          staffResponse: { type: "string", example: "Thank you for visiting! See you again." },
          respondedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register customer account",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", example: "jane@example.com" },
                  password: { type: "string", example: "Secret123!" },
                  phone: { type: "string", example: "+91 9876543210" },
                  preferences: { type: "object", example: { favoriteService: "Classic Haircut" } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created successfully" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Log in with email and password",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "customer@salonflow.local" },
                  password: { type: "string", example: "ChangeThisForLocalDemo123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful, returns JWT token" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/profile": {
      get: {
        summary: "Get current user profile and preferences",
        tags: ["Authentication & Profile"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "User profile data" } },
      },
      patch: {
        summary: "Update current customer profile & preferences",
        tags: ["Authentication & Profile"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  phone: { type: "string", example: "+91 9988776655" },
                  preferences: { type: "object", example: { preferredStylistId: 1, reminders: "email" } },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/services": {
      get: {
        summary: "List all active salon services",
        tags: ["Services"],
        responses: { 200: { description: "List of active services" } },
      },
      post: {
        summary: "Create a new salon service (Admin only)",
        tags: ["Services (Admin)"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "durationMinutes", "pricePaise"],
                properties: {
                  name: { type: "string", example: "Beard Trim & Shape" },
                  description: { type: "string", example: "Clean precision beard styling." },
                  durationMinutes: { type: "integer", example: 30 },
                  pricePaise: { type: "integer", example: 30000 },
                  isActive: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Service created" } },
      },
    },
    "/services/{id}": {
      get: {
        summary: "Get service details by ID",
        tags: ["Services"],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Service details" }, 404: { description: "Not found" } },
      },
      put: {
        summary: "Update a service (Admin only)",
        tags: ["Services (Admin)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Service updated" } },
      },
      delete: {
        summary: "Deactivate/delete a service (Admin only)",
        tags: ["Services (Admin)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Service deactivated" } },
      },
    },
    "/staff": {
      get: {
        summary: "List active staff members with assigned services",
        tags: ["Staff"],
        responses: { 200: { description: "List of staff" } },
      },
      post: {
        summary: "Add a new staff member profile (Admin only)",
        tags: ["Staff (Admin)"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string", example: "Rohan Kapoor" },
                  email: { type: "string", example: "rohan@salonflow.local" },
                  password: { type: "string", example: "Stylist123!" },
                  bio: { type: "string", example: "Expert hair artist" },
                  specialties: { type: "array", items: { type: "string" }, example: ["Fade", "Beard"] },
                  serviceIds: { type: "array", items: { type: "integer" }, example: [1, 2] },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Staff created" } },
      },
    },
    "/staff/{id}/services": {
      post: {
        summary: "Assign services to a staff member (Admin only)",
        tags: ["Staff (Admin)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceIds"],
                properties: {
                  serviceIds: { type: "array", items: { type: "integer" }, example: [1, 2, 3] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Services assigned successfully" } },
      },
    },
    "/staff/{id}/availability": {
      put: {
        summary: "Set working schedule for staff member (Admin only)",
        tags: ["Staff (Admin)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  schedules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dayOfWeek: { type: "integer", example: 1 },
                        startsAt: { type: "string", example: "10:00:00" },
                        endsAt: { type: "string", example: "18:00:00" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Schedule updated" } },
      },
    },
    "/availability": {
      get: {
        summary: "Find live available appointment slots",
        tags: ["Availability"],
        parameters: [
          { in: "query", name: "serviceId", required: true, schema: { type: "integer" }, example: 1 },
          { in: "query", name: "date", required: true, schema: { type: "string" }, example: "2026-10-15" },
          { in: "query", name: "staffId", required: false, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Available time slots by stylist" },
        },
      },
    },
    "/appointments": {
      post: {
        summary: "Book an appointment (sends email confirmation)",
        tags: ["Appointments"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceId", "staffId", "startTime"],
                properties: {
                  serviceId: { type: "integer", example: 1 },
                  staffId: { type: "integer", example: 1 },
                  startTime: { type: "string", example: "2026-10-15T10:00:00.000+05:30" },
                  notes: { type: "string", example: "Please keep sides short" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Appointment booked successfully" },
          409: { description: "Time slot conflict" },
        },
      },
    },
    "/appointments/my": {
      get: {
        summary: "List current customer's appointment history with payments & reviews",
        tags: ["Appointments"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of customer appointments" } },
      },
    },
    "/appointments/{id}/cancel": {
      patch: {
        summary: "Cancel an upcoming appointment (triggers email notification)",
        tags: ["Appointments"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Appointment cancelled" }, 409: { description: "Cannot cancel past appointment" } },
      },
    },
    "/appointments/{id}/reschedule": {
      patch: {
        summary: "Reschedule an upcoming appointment to a new slot (triggers email)",
        tags: ["Appointments"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["startTime"],
                properties: {
                  startTime: { type: "string", example: "2026-10-15T14:00:00.000+05:30" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Appointment rescheduled successfully" } },
      },
    },
    "/appointments/{id}/pay": {
      post: {
        summary: "Process payment for an appointment",
        tags: ["Payments & Invoices"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  paymentMethod: { type: "string", enum: ["card", "upi", "cash", "stripe"], example: "card" },
                  transactionId: { type: "string", example: "txn_demo_987654" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Payment recorded successfully" } },
      },
    },
    "/appointments/{id}/razorpay/order": {
      post: {
        summary: "Create a Razorpay order for appointment payment",
        tags: ["Payments & Invoices (Razorpay)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Razorpay order details with orderId and keyId",
          },
        },
      },
    },
    "/appointments/{id}/razorpay/verify": {
      post: {
        summary: "Verify Razorpay payment signature and record completed payment",
        tags: ["Payments & Invoices (Razorpay)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razorpayOrderId", "razorpayPaymentId", "razorpaySignature"],
                properties: {
                  razorpayOrderId: { type: "string", example: "order_DBJOWzybf0sJbb" },
                  razorpayPaymentId: { type: "string", example: "pay_29QQoUBi66xm2f" },
                  razorpaySignature: { type: "string", example: "9ef47070b4317769cbdd..." },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Razorpay payment verified and recorded" },
          400: { description: "Invalid signature" },
        },
      },
    },
    "/appointments/{id}/stripe-session": {
      post: {
        summary: "Create Stripe checkout session for online card payment",
        tags: ["Payments & Invoices"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Stripe session created with checkoutUrl" } },
      },
    },
    "/appointments/{id}/invoice": {
      get: {
        summary: "Download PDF Tax Invoice for completed appointment",
        tags: ["Payments & Invoices"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "PDF invoice file download",
            content: { "application/pdf": {} },
          },
        },
      },
    },
    "/reviews": {
      get: {
        summary: "List reviews and ratings (optionally filtered by service or staff)",
        tags: ["Reviews & Feedback"],
        parameters: [
          { in: "query", name: "serviceId", schema: { type: "integer" } },
          { in: "query", name: "staffId", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "List of reviews" } },
      },
      post: {
        summary: "Customer leaves a review & rating for an appointment",
        tags: ["Reviews & Feedback"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointmentId", "rating", "comment"],
                properties: {
                  appointmentId: { type: "integer", example: 1 },
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Fantastic experience and sharp haircut!" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Review recorded" } },
      },
    },
    "/reviews/{id}/response": {
      post: {
        summary: "Staff/Admin responds to customer review",
        tags: ["Reviews & Feedback"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["staffResponse"],
                properties: {
                  staffResponse: { type: "string", example: "Thank you for your kind words! Looking forward to your next visit." },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Response posted" } },
      },
    },
    "/admin/stats": {
      get: {
        summary: "Get Admin dashboard overview metrics and revenue",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Dashboard statistics" } },
      },
    },
    "/admin/users": {
      get: {
        summary: "List all registered users (Admin only)",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "List of users" } },
      },
    },
    "/admin/users/{id}": {
      patch: {
        summary: "Manage customer account active status or role (Admin only)",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  isActive: { type: "boolean", example: true },
                  role: { type: "string", enum: ["customer", "staff", "admin"] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "User updated" } },
      },
    },
    "/admin/appointments": {
      get: {
        summary: "View and manage all salon appointments (Admin only)",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string" } },
          { in: "query", name: "date", schema: { type: "string" } },
          { in: "query", name: "staffId", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "All appointments" } },
      },
    },
    "/admin/appointments/{id}/status": {
      patch: {
        summary: "Update appointment status (completed, in_progress, no_show, etc.)",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"], example: "completed" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Appointment status updated" } },
      },
    },
    "/admin/business-hours": {
      get: {
        summary: "Get salon business hours",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Business hours" } },
      },
      put: {
        summary: "Update salon business hours and working days",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  hours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dayOfWeek: { type: "integer", example: 1 },
                        opensAt: { type: "string", example: "09:00:00" },
                        closesAt: { type: "string", example: "20:00:00" },
                        isClosed: { type: "boolean", example: false },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Business hours updated" } },
      },
    },
    "/admin/reminders/trigger": {
      post: {
        summary: "Manually trigger appointment reminders check (Admin only)",
        tags: ["Admin Dashboard"],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Reminders processed" } },
      },
    },
  },
};

