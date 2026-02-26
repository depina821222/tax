# Tax Office CRM Portal - PRD

## Original Problem Statement
Build a full-stack bilingual (EN/ES) CRM Portal + Appointment System for a small tax office with:
- Admin/Staff login (JWT auth)
- Public booking page (/book)
- CRM (clients), Appointments, Calendar, Services, Cases, Templates, Staff, Settings
- Brand Settings page (/portal/brand) with Identity, Colors, Content, Contact, Domain tabs
- Dynamic branding across portal + booking page
- 48-hour reminders via Resend (email) + Twilio SMS
- Demo data seeded
- Professional dark navy + gold design

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB
- **Email**: Resend (configurable via RESEND_API_KEY)
- **SMS**: Twilio (configurable via TWILIO_* env vars)
- **Auth**: JWT with bcrypt password hashing
- **PDF**: ReportLab for server-side PDF generation

## User Personas
1. **Admin**: Full access to manage staff, settings, services, templates, brand
2. **Staff**: Manage clients, appointments, cases
3. **Public Client**: Book appointments via /book

## Core Requirements (Static)
- [x] Bilingual UI with EN/ES toggle in navbar
- [x] JWT authentication with roles
- [x] Public booking wizard (4 steps)
- [x] Portal dashboard with stats
- [x] Calendar view (week/month)
- [x] Appointments management
- [x] Clients CRM with pipeline
- [x] Services catalog (5 default services)
- [x] Service requests/cases with checklist
- [x] Email templates (4 email + 2 SMS defaults)
- [x] Staff management (admin)
- [x] Settings management (admin)
- [x] Brand Settings (admin)
- [x] 48-hour reminder automation (email + SMS)

## What's Been Implemented (Feb 2026)

### P0 - Core Features (COMPLETE)
- [x] GitHub repo restoration from https://github.com/depina821222/tax
- [x] All backend APIs working (100% pass rate)
- [x] All frontend pages functional
- [x] Brand Settings with all tabs (Identity, Colors, Content, Contact, Domain)
- [x] Demo data seeding with 3 staff, 6 clients, 10+ appointments, 5 services

### P1 - Enhanced Features (COMPLETE)
- [x] Forgot Password flow with email reset link (/portal/forgot-password)
- [x] Reset Password page (/portal/reset-password?token=)
- [x] Twilio SMS integration scaffolded (send_sms_async helper, SMS templates)
- [x] SMS status API endpoint (/api/sms/status)
- [x] Domain verification with DNS instructions
- [x] SSL status tracking

### UX Improvements (COMPLETE - Feb 26, 2026)
- [x] **Clickable Dashboard Items**: Recent Appointments and Recent Cases rows are now clickable
  - Navigate to /portal/appointments/:id and /portal/cases/:id
  - Open icon button appears on hover
  - Works for both Admin and Staff roles
- [x] **Appointment Detail Page** (/portal/appointments/:id)
  - Shows appointment info, client details, service, date/time, status
  - "Download Appointment Confirmation (PDF)" button
  - Bilingual labels (EN/ES)
- [x] **Case Detail Page** (/portal/cases/:id)
  - Shows service request info, status, priority, due date
  - Document Checklist with Completed/Pending status
  - Missing Documents warning section
  - Client sidebar with contact info
  - Upcoming Appointment section
  - "Download Case Summary (PDF)" button
- [x] **Client Detail Page** enhancement
  - Added "Download Client Summary (PDF)" button
  - Shows appointment history, case history, notes
- [x] **Service Cards Clickable** (/portal/services)
  - All service cards fully clickable with hover lift + border highlight
  - Navigate to /portal/services/:id detail page
  - Keyboard accessible (Tab + Enter)
- [x] **Service Detail Page** (/portal/services/:id)
  - Overview section (name EN/ES, description, duration)
  - Required Documents list
  - Workflow Stages visualization
  - "Create Service Request" and "Download Service Summary (PDF)" buttons
- [x] **Booking Page Service Selection** (/book Step 1)
  - Fully clickable service items
  - Clear hover state with border highlight
  - Selected state with gold border, glow, and checkmark
  - Keyboard accessible
- [x] **Professional Hero Background** (/book)
  - Dark navy gradient (135deg)
  - Subtle grid pattern overlay (3% opacity)
  - Vignette effect for depth
  - Gold accent glow at top
  - Brand watermark (if logo exists)

### PDF Generation (COMPLETE - Feb 26, 2026)
- [x] **Backend PDF Endpoints** using ReportLab
  - GET /api/pdf/case/:caseId - Case Summary PDF
  - GET /api/pdf/client/:clientId - Client Summary PDF
  - GET /api/pdf/appointment/:appointmentId - Appointment Confirmation PDF
- [x] **PDF Content**:
  - Brand header (business name, phone, email, address)
  - Client information section
  - Service/appointment details
  - Checklist progress (for cases)
  - Notes section
  - Professional footer with confidentiality note
- [x] **Bilingual PDFs**: Labels in EN or ES based on client's preferred language
- [x] **PDF Styling**: Clean typography, gold accent color, proper spacing

## Demo Credentials
- Admin: admin@taxoffice.com / admin123
- Staff1: staff1@taxoffice.com / staff123
- Staff2: staff2@taxoffice.com / staff123

## Environment Variables
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=your-secret-key
RESEND_API_KEY=your-resend-key (optional)
SENDER_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your-sid (optional)
TWILIO_AUTH_TOKEN=your-token (optional)
TWILIO_PHONE_NUMBER=+1234567890 (optional)
FRONTEND_URL=https://your-domain.com
```

## API Endpoints Summary

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Resources
- GET/POST /api/clients
- GET/PUT/DELETE /api/clients/:id
- GET /api/clients/:id/timeline
- GET/POST /api/appointments
- PUT/DELETE /api/appointments/:id
- GET/POST /api/cases
- PUT/DELETE /api/cases/:id
- GET/POST /api/services
- GET/POST /api/staff
- GET/PUT /api/settings
- GET/PUT /api/brand-settings

### PDF Generation
- GET /api/pdf/case/:caseId
- GET /api/pdf/client/:clientId
- GET /api/pdf/appointment/:appointmentId

### Utilities
- GET /api/health
- POST /api/seed
- GET /api/sms/status

## P2 Features (Backlog)
- [ ] Immigration services toggle
- [ ] Blocked dates management
- [ ] Client document uploads
- [ ] Advanced reporting/analytics
- [ ] Multi-tenant support
- [ ] Client portal (self-service)

## Next Tasks
1. Add Resend API key to enable email sending
2. Add Twilio credentials to enable SMS reminders
3. Configure custom domain in Brand Settings
4. Customize email/SMS templates as needed
5. Deploy to production
