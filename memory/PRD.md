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
- [x] Demo data seeding with 3 staff, 5 clients, 10 appointments, 5 services

### P1 - Enhanced Features (COMPLETE)
- [x] Forgot Password flow with email reset link (/portal/forgot-password)
- [x] Reset Password page (/portal/reset-password?token=)
- [x] Twilio SMS integration scaffolded (send_sms_async helper, SMS templates)
- [x] SMS status API endpoint (/api/sms/status)
- [x] Domain verification with DNS instructions
- [x] SSL status tracking

### UI/UX Design Upgrade
- [x] "Old Money Tech" design philosophy
- [x] Playfair Display headings + Manrope body fonts
- [x] Dark navy (#020617) + Metallic Gold (#D4AF37) palette
- [x] Glass-morphism cards with backdrop blur
- [x] Enhanced CSS animations and transitions
- [x] Responsive layout with sidebar navigation

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

## P2 Features (Backlog)
- [ ] Immigration services toggle
- [ ] Blocked dates management
- [ ] Client document uploads
- [ ] Advanced reporting/analytics
- [ ] Multi-tenant support

## Next Tasks
1. Add Resend API key to enable email sending
2. Add Twilio credentials to enable SMS reminders
3. Configure custom domain in Brand Settings
4. Customize email/SMS templates as needed
