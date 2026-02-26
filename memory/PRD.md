# Tax Office CRM Portal - PRD

## Original Problem Statement
Build a full-stack CRM Portal + Appointment System for a small tax office with:
- Bilingual support (EN/ES) for UI and messages
- Public booking page at /book
- Portal with JWT authentication (Admin/Staff roles)
- Service catalog with 5 tax services
- Appointment system with 48-hour email reminders
- Client CRM with pipeline stages
- Service requests/cases tracking
- Editable email/SMS templates
- Staff management (admin only)
- Business settings (admin only)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB
- **Email**: Resend (configurable via RESEND_API_KEY)
- **SMS**: Twilio (ready to enable via env vars)
- **Auth**: JWT with bcrypt password hashing

## User Personas
1. **Admin**: Full access to manage staff, settings, services, templates
2. **Staff**: Manage clients, appointments, cases
3. **Public Client**: Book appointments via /book

## Core Requirements
- [x] Bilingual UI with EN/ES toggle in navbar
- [x] JWT authentication with roles
- [x] Public booking wizard (4 steps)
- [x] Portal dashboard with stats
- [x] Calendar view (week/month)
- [x] Appointments management
- [x] Clients CRM with pipeline
- [x] Services catalog (5 default services)
- [x] Service requests/cases with checklist
- [x] Email templates (4 defaults)
- [x] Staff management (admin)
- [x] Settings management (admin)
- [x] 48-hour reminder automation

## What's Been Implemented (Feb 2026)

### Backend (FastAPI)
- Complete REST API with 25+ endpoints
- User authentication (login, forgot password, reset password)
- CRUD for all entities (clients, appointments, services, cases, templates, staff, settings)
- Automatic 48-hour appointment reminder job
- Email sending via Resend
- Demo data seeding endpoint

### Frontend (React)
- 12 pages with full functionality
- Dark navy + gold professional design
- Bilingual support (EN/ES) throughout
- Responsive layout with sidebar navigation
- Data tables with search and filters
- Modal dialogs for CRUD operations
- Calendar component for appointments

### Demo Data
- 1 Admin (Maria Rodriguez) + 2 Staff users
- 5 Clients with mixed EN/ES preferences
- 10 Appointments (upcoming)
- 3 Service requests in different stages
- 4 Email templates (bilingual)
- Business settings configured

## Demo Credentials
- Admin: admin@taxoffice.com / admin123
- Staff1: staff1@taxoffice.com / staff123
- Staff2: staff2@taxoffice.com / staff123

## P0 Features (Completed)
- [x] Public booking flow
- [x] Authentication system
- [x] Dashboard with metrics
- [x] Appointment management
- [x] Client CRM
- [x] Service catalog
- [x] Cases/Service requests

## P1 Features (Completed)
- [x] Calendar views
- [x] Email templates
- [x] Staff management
- [x] Settings page
- [x] 48h reminders
- [x] Brand Settings page (Admin only)

## P2 Features (Backlog)
- [ ] SMS integration (Twilio ready)
- [ ] Immigration services toggle
- [ ] Blocked dates management
- [ ] Client notes timeline
- [ ] Client document uploads

## Environment Variables
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=your-secret-key
RESEND_API_KEY=your-resend-key
SENDER_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Next Tasks
1. Add Resend API key to enable email sending
2. Configure business settings (name, address, phone)
3. Customize email templates
4. Add more staff users as needed
5. Enable SMS reminders (add Twilio credentials)
