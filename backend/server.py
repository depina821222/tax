from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import resend
import base64
import io
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from zoneinfo import ZoneInfo
from twilio.rest import Client as TwilioClient
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
JWT_SECRET = os.environ.get("JWT_SECRET", "tax-office-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Email setup
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Twilio SMS setup
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {str(e)}")

# Timezone
TIMEZONE = ZoneInfo("America/New_York")

# Create the main app
app = FastAPI(title="Tax Office CRM Portal API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "staff"  # admin or staff
    language: str = "en"  # en or es

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    language: str
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ClientBase(BaseModel):
    full_name: str
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""
    preferred_language: str = "en"  # en or es
    status: str = "lead"  # lead, active, completed, archived
    assigned_staff_id: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServiceBase(BaseModel):
    name_en: str
    name_es: str
    description_en: str = ""
    description_es: str = ""
    duration_minutes: int = 60
    required_documents: List[str] = []
    workflow_stages: List[str] = ["new", "waiting_docs", "in_review", "submitted", "completed"]
    is_active: bool = True

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AppointmentBase(BaseModel):
    client_id: str
    service_id: str
    assigned_staff_id: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    duration_minutes: int = 60
    status: str = "scheduled"  # scheduled, confirmed, completed, cancelled, no_show
    notes: str = ""

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reminder_sent_48h: bool = False
    confirmation_sent: bool = False

class ServiceRequestBase(BaseModel):
    client_id: str
    service_id: str
    appointment_id: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    status: str = "new"  # new, waiting_docs, in_review, submitted, completed
    priority: str = "normal"  # low, normal, high, urgent
    due_date: Optional[str] = None
    notes: str = ""
    checklist: List[Dict[str, Any]] = []  # [{item: str, completed: bool}]
    missing_docs_flag: bool = False

class ServiceRequestCreate(ServiceRequestBase):
    pass

class ServiceRequest(ServiceRequestBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TemplateBase(BaseModel):
    name: str  # booking_confirmation, reminder_48h, missing_docs, case_completed
    type: str  # email or sms
    subject_en: str = ""
    subject_es: str = ""
    body_en: str
    body_es: str
    is_active: bool = True

class TemplateCreate(TemplateBase):
    pass

class Template(TemplateBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SettingsModel(BaseModel):
    business_name: str = "Tax Office"
    business_name_es: str = "Oficina de Impuestos"
    phone: str = ""
    email: str = ""
    address: str = ""
    logo_url: str = ""
    business_hours_start: str = "09:00"
    business_hours_end: str = "17:00"
    blocked_dates: List[str] = []
    enable_reminders: bool = True
    enable_sms: bool = False
    immigration_services_enabled: bool = False
    timezone: str = "America/New_York"

class BrandSettingsModel(BaseModel):
    business_name_en: str = "Elite Tax Services"
    business_name_es: str = "Servicios de Impuestos Elite"
    tagline_en: str = "Professional Tax & Business Services"
    tagline_es: str = "Servicios Profesionales de Impuestos y Negocios"
    logo_url: str = ""
    primary_color: str = "#1e293b"
    accent_color: str = "#D4AF37"
    office_address: str = "100 Financial Plaza, Suite 200, New York, NY 10001"
    phone: str = "(555) 123-4567"
    email: str = "info@elitetax.com"
    sender_name: str = "Elite Tax Services"
    hero_title_en: str = "Book Your Appointment"
    hero_title_es: str = "Reserve su Cita"
    hero_subtitle_en: str = "Professional tax and business services tailored to your needs"
    hero_subtitle_es: str = "Servicios profesionales de impuestos y negocios adaptados a sus necesidades"
    footer_text_en: str = "© 2026 Elite Tax Services. All rights reserved."
    footer_text_es: str = "© 2026 Servicios de Impuestos Elite. Todos los derechos reservados."
    social_facebook: str = ""
    social_instagram: str = ""
    social_linkedin: str = ""

class BookingRequest(BaseModel):
    service_id: str
    date: str
    time: str
    full_name: str
    phone: str
    email: str
    notes: str = ""
    preferred_language: str = "en"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ============ HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def send_email_async(to_email: str, subject: str, html_content: str):
    if not RESEND_API_KEY:
        logger.warning(f"Email not sent (no API key): {subject} to {to_email}")
        return None
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {subject}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return None

async def send_sms_async(to_phone: str, message: str):
    """Send SMS via Twilio"""
    if not twilio_client or not TWILIO_PHONE_NUMBER:
        logger.warning(f"SMS not sent (Twilio not configured): {message[:50]}... to {to_phone}")
        return None
    
    # Ensure phone number is in E.164 format
    formatted_phone = to_phone.strip()
    if not formatted_phone.startswith('+'):
        # Assume US number if no country code
        formatted_phone = '+1' + formatted_phone.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
    
    try:
        result = await asyncio.to_thread(
            twilio_client.messages.create,
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=formatted_phone
        )
        logger.info(f"SMS sent to {to_phone}: SID={result.sid}")
        return {"sid": result.sid, "status": result.status}
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
        return None

def render_template(template: dict, variables: dict, language: str = "en") -> tuple:
    subject = template.get(f"subject_{language}", template.get("subject_en", ""))
    body = template.get(f"body_{language}", template.get("body_en", ""))
    for key, value in variables.items():
        subject = subject.replace(f"{{{key}}}", str(value))
        body = body.replace(f"{{{key}}}", str(value))
    return subject, body

# ============ AUTH ROUTES ============

@api_router.post("/auth/setup")
async def setup_admin(user_data: UserCreate):
    """Create first admin user on first run"""
    existing_admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user_data.password)
    user_dict["role"] = "admin"
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    
    await db.users.insert_one(user_dict)
    user_dict.pop("password", None)
    user_dict.pop("_id", None)
    
    token = create_token(user_dict["id"], user_dict["email"], user_dict["role"])
    return TokenResponse(access_token=token, user=UserResponse(**user_dict))

@api_router.get("/auth/check-setup")
async def check_setup():
    """Check if admin exists (for first run setup)"""
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    return {"setup_required": admin is None}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    token = create_token(user["id"], user["email"], user["role"])
    user_response = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, user=UserResponse(**user_response))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != "password"})

@api_router.put("/auth/language")
async def update_language(language: str, user: dict = Depends(get_current_user)):
    if language not in ["en", "es"]:
        raise HTTPException(status_code=400, detail="Invalid language")
    await db.users.update_one({"id": user["id"]}, {"$set": {"language": language}})
    return {"message": "Language updated"}

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if user:
        reset_token = str(uuid.uuid4())
        await db.password_resets.insert_one({
            "user_id": user["id"],
            "token": reset_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "used": False
        })
        settings = await db.settings.find_one({}, {"_id": 0}) or {}
        reset_link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/portal/reset-password?token={reset_token}"
        html = f"""
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{reset_link}">{reset_link}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
        background_tasks.add_task(send_email_async, request.email, "Password Reset", html)
    return {"message": "If email exists, reset link sent"}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    reset = await db.password_resets.find_one({"token": request.token, "used": False}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    created_at = datetime.fromisoformat(reset["created_at"])
    if datetime.now(timezone.utc) - created_at > timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"id": reset["user_id"]},
        {"$set": {"password": hash_password(request.new_password)}}
    )
    await db.password_resets.update_one({"token": request.token}, {"$set": {"used": True}})
    return {"message": "Password reset successful"}

@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not verify_password(request.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(request.new_password)}}
    )
    return {"message": "Password changed successfully"}

# ============ USERS/STAFF ROUTES ============

@api_router.get("/staff", response_model=List[UserResponse])
async def get_staff(user: dict = Depends(get_current_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.post("/staff", response_model=UserResponse)
async def create_staff(user_data: UserCreate, admin: dict = Depends(require_admin)):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user_data.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    
    await db.users.insert_one(user_dict)
    return UserResponse(**{k: v for k, v in user_dict.items() if k != "password"})

@api_router.put("/staff/{user_id}", response_model=UserResponse)
async def update_staff(user_id: str, updates: dict, admin: dict = Depends(require_admin)):
    if "password" in updates:
        updates["password"] = hash_password(updates["password"])
    await db.users.update_one({"id": user_id}, {"$set": updates})
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.delete("/staff/{user_id}")
async def delete_staff(user_id: str, admin: dict = Depends(require_admin)):
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

# ============ CLIENT ROUTES ============

@api_router.get("/clients", response_model=List[Client])
async def get_clients(
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    clients = await db.clients.find(query, {"_id": 0}).to_list(1000)
    return [Client(**c) for c in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**client)

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, user: dict = Depends(get_current_user)):
    client_dict = client_data.model_dump()
    client_dict["id"] = str(uuid.uuid4())
    client_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    client_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.clients.insert_one(client_dict)
    return Client(**client_dict)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, updates: dict, user: dict = Depends(get_current_user)):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.clients.update_one({"id": client_id}, {"$set": updates})
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}

@api_router.get("/clients/{client_id}/timeline")
async def get_client_timeline(client_id: str, user: dict = Depends(get_current_user)):
    """Get client's appointments, service requests, and notes"""
    appointments = await db.appointments.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    service_requests = await db.service_requests.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    
    timeline = []
    for apt in appointments:
        timeline.append({"type": "appointment", "date": apt["date"], "data": apt})
    for sr in service_requests:
        timeline.append({"type": "service_request", "date": sr["created_at"][:10], "data": sr})
    
    timeline.sort(key=lambda x: x["date"], reverse=True)
    return timeline

# ============ SERVICES ROUTES ============

@api_router.get("/services", response_model=List[Service])
async def get_services(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    services = await db.services.find(query, {"_id": 0}).to_list(100)
    return [Service(**s) for s in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, admin: dict = Depends(require_admin)):
    service_dict = service_data.model_dump()
    service_dict["id"] = str(uuid.uuid4())
    service_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.services.insert_one(service_dict)
    return Service(**service_dict)

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, updates: dict, admin: dict = Depends(require_admin)):
    await db.services.update_one({"id": service_id}, {"$set": updates})
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**service)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, admin: dict = Depends(require_admin)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

# ============ APPOINTMENTS ROUTES ============

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    staff_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if date_from:
        query["date"] = {"$gte": date_from}
    if date_to:
        query.setdefault("date", {})["$lte"] = date_to
    if status:
        query["status"] = status
    if staff_id:
        query["assigned_staff_id"] = staff_id
    
    appointments = await db.appointments.find(query, {"_id": 0}).to_list(1000)
    return [Appointment(**a) for a in appointments]

@api_router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    apt = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return Appointment(**apt)

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(apt_data: AppointmentCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    # Check for double booking
    existing = await db.appointments.find_one({
        "date": apt_data.date,
        "time": apt_data.time,
        "status": {"$nin": ["cancelled", "no_show"]}
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    apt_dict = apt_data.model_dump()
    apt_dict["id"] = str(uuid.uuid4())
    apt_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    apt_dict["reminder_sent_48h"] = False
    apt_dict["confirmation_sent"] = False
    
    await db.appointments.insert_one(apt_dict)
    return Appointment(**apt_dict)

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, updates: dict, user: dict = Depends(get_current_user)):
    # If changing time/date, check for conflicts
    if "date" in updates or "time" in updates:
        apt = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
        new_date = updates.get("date", apt["date"])
        new_time = updates.get("time", apt["time"])
        existing = await db.appointments.find_one({
            "id": {"$ne": appointment_id},
            "date": new_date,
            "time": new_time,
            "status": {"$nin": ["cancelled", "no_show"]}
        }, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Time slot already booked")
    
    await db.appointments.update_one({"id": appointment_id}, {"$set": updates})
    apt = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return Appointment(**apt)

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    result = await db.appointments.delete_one({"id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted"}

@api_router.get("/appointments/available-slots/{date}")
async def get_available_slots(date: str, service_id: Optional[str] = None):
    """Get available time slots for a date"""
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    start_hour = int(settings.get("business_hours_start", "09:00").split(":")[0])
    end_hour = int(settings.get("business_hours_end", "17:00").split(":")[0])
    blocked_dates = settings.get("blocked_dates", [])
    
    if date in blocked_dates:
        return {"slots": []}
    
    # Get service duration
    duration = 60
    if service_id:
        service = await db.services.find_one({"id": service_id}, {"_id": 0})
        if service:
            duration = service.get("duration_minutes", 60)
    
    # Get booked slots
    booked = await db.appointments.find({
        "date": date,
        "status": {"$nin": ["cancelled", "no_show"]}
    }, {"_id": 0}).to_list(100)
    booked_times = {apt["time"] for apt in booked}
    
    # Generate available slots
    slots = []
    current_hour = start_hour
    while current_hour < end_hour:
        for minute in [0, 30]:
            time_str = f"{current_hour:02d}:{minute:02d}"
            if time_str not in booked_times:
                slots.append(time_str)
        current_hour += 1
    
    return {"slots": slots, "duration": duration}

# ============ SERVICE REQUESTS / CASES ROUTES ============

@api_router.get("/cases", response_model=List[ServiceRequest])
async def get_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    staff_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if staff_id:
        query["assigned_staff_id"] = staff_id
    
    cases = await db.service_requests.find(query, {"_id": 0}).to_list(1000)
    return [ServiceRequest(**c) for c in cases]

@api_router.get("/cases/{case_id}", response_model=ServiceRequest)
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    case = await db.service_requests.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return ServiceRequest(**case)

@api_router.post("/cases", response_model=ServiceRequest)
async def create_case(case_data: ServiceRequestCreate, user: dict = Depends(get_current_user)):
    # Get service for default checklist
    service = await db.services.find_one({"id": case_data.service_id}, {"_id": 0})
    
    case_dict = case_data.model_dump()
    case_dict["id"] = str(uuid.uuid4())
    case_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    case_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Set default checklist from service
    if service and not case_dict.get("checklist"):
        case_dict["checklist"] = [
            {"item": doc, "completed": False}
            for doc in service.get("required_documents", [])
        ]
    
    await db.service_requests.insert_one(case_dict)
    return ServiceRequest(**case_dict)

@api_router.put("/cases/{case_id}", response_model=ServiceRequest)
async def update_case(case_id: str, updates: dict, user: dict = Depends(get_current_user)):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.service_requests.update_one({"id": case_id}, {"$set": updates})
    case = await db.service_requests.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return ServiceRequest(**case)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, user: dict = Depends(get_current_user)):
    result = await db.service_requests.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Case deleted"}

@api_router.post("/cases/{case_id}/send-missing-docs")
async def send_missing_docs_followup(case_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Send missing documents follow-up message"""
    case = await db.service_requests.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    client = await db.clients.find_one({"id": case["client_id"]}, {"_id": 0})
    if not client or not client.get("email"):
        raise HTTPException(status_code=400, detail="Client email not found")
    
    service = await db.services.find_one({"id": case["service_id"]}, {"_id": 0})
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    template = await db.templates.find_one({"name": "missing_docs", "type": "email"}, {"_id": 0})
    
    if not template:
        raise HTTPException(status_code=400, detail="Missing docs template not found")
    
    lang = client.get("preferred_language", "en")
    missing_items = [item["item"] for item in case.get("checklist", []) if not item.get("completed")]
    
    variables = {
        "client_name": client["full_name"],
        "service": service.get(f"name_{lang}", service.get("name_en", "")),
        "missing_documents": ", ".join(missing_items),
        "office_address": settings.get("address", ""),
        "phone": settings.get("phone", "")
    }
    
    subject, body = render_template(template, variables, lang)
    background_tasks.add_task(send_email_async, client["email"], subject, body)
    
    await db.service_requests.update_one(
        {"id": case_id},
        {"$set": {"missing_docs_flag": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Follow-up sent"}

# ============ TEMPLATES ROUTES ============

@api_router.get("/templates", response_model=List[Template])
async def get_templates(user: dict = Depends(get_current_user)):
    templates = await db.templates.find({}, {"_id": 0}).to_list(100)
    return [Template(**t) for t in templates]

@api_router.get("/templates/{template_id}", response_model=Template)
async def get_template(template_id: str, user: dict = Depends(get_current_user)):
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**template)

@api_router.post("/templates", response_model=Template)
async def create_template(template_data: TemplateCreate, admin: dict = Depends(require_admin)):
    template_dict = template_data.model_dump()
    template_dict["id"] = str(uuid.uuid4())
    template_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    template_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.templates.insert_one(template_dict)
    return Template(**template_dict)

@api_router.put("/templates/{template_id}", response_model=Template)
async def update_template(template_id: str, updates: dict, admin: dict = Depends(require_admin)):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.templates.update_one({"id": template_id}, {"$set": updates})
    template = await db.templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**template)

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str, admin: dict = Depends(require_admin)):
    result = await db.templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

# ============ SETTINGS ROUTES ============

@api_router.get("/settings", response_model=SettingsModel)
async def get_settings():
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        return SettingsModel()
    return SettingsModel(**settings)

@api_router.put("/settings", response_model=SettingsModel)
async def update_settings(updates: dict, admin: dict = Depends(require_admin)):
    existing = await db.settings.find_one({}, {"_id": 0})
    if existing:
        await db.settings.update_one({}, {"$set": updates})
    else:
        await db.settings.insert_one(updates)
    settings = await db.settings.find_one({}, {"_id": 0})
    return SettingsModel(**settings)

# ============ BRAND SETTINGS ROUTES ============

@api_router.get("/brand", response_model=BrandSettingsModel)
async def get_brand_settings():
    """Get brand settings (public endpoint)"""
    brand = await db.brand_settings.find_one({}, {"_id": 0})
    if not brand:
        return BrandSettingsModel()
    return BrandSettingsModel(**brand)

@api_router.put("/brand", response_model=BrandSettingsModel)
async def update_brand_settings(updates: dict, admin: dict = Depends(require_admin)):
    """Update brand settings (admin only)"""
    existing = await db.brand_settings.find_one({}, {"_id": 0})
    if existing:
        await db.brand_settings.update_one({}, {"$set": updates})
    else:
        await db.brand_settings.insert_one(updates)
    brand = await db.brand_settings.find_one({}, {"_id": 0})
    return BrandSettingsModel(**brand)

@api_router.post("/brand/logo")
async def upload_logo(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    """Upload logo image (admin only)"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and encode as base64 data URL
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:  # 2MB limit
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")
    
    base64_data = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{base64_data}"
    
    # Update brand settings with logo URL
    existing = await db.brand_settings.find_one({}, {"_id": 0})
    if existing:
        await db.brand_settings.update_one({}, {"$set": {"logo_url": data_url}})
    else:
        await db.brand_settings.insert_one({"logo_url": data_url})
    
    return {"logo_url": data_url}

# ============ DOMAIN SETTINGS ROUTES ============

class DomainSettingsModel(BaseModel):
    custom_domain: str = ""
    domain_verified: bool = False
    ssl_status: str = "pending"  # pending, provisioning, active
    verification_token: str = ""
    created_at: str = ""
    verified_at: str = ""

@api_router.get("/domain-settings", response_model=DomainSettingsModel)
async def get_domain_settings(user: dict = Depends(get_current_user)):
    """Get domain settings"""
    domain = await db.domain_settings.find_one({}, {"_id": 0})
    if not domain:
        return DomainSettingsModel()
    return DomainSettingsModel(**domain)

@api_router.put("/domain-settings", response_model=DomainSettingsModel)
async def update_domain_settings(updates: dict, admin: dict = Depends(require_admin)):
    """Update domain settings (admin only)"""
    # Generate verification token if new domain
    if "custom_domain" in updates and updates["custom_domain"]:
        updates["verification_token"] = str(uuid.uuid4())[:8]
        updates["domain_verified"] = False
        updates["ssl_status"] = "pending"
        updates["created_at"] = datetime.now(timezone.utc).isoformat()
    
    existing = await db.domain_settings.find_one({}, {"_id": 0})
    if existing:
        await db.domain_settings.update_one({}, {"$set": updates})
    else:
        await db.domain_settings.insert_one(updates)
    
    domain = await db.domain_settings.find_one({}, {"_id": 0})
    return DomainSettingsModel(**domain)

@api_router.post("/domain-settings/verify", response_model=DomainSettingsModel)
async def verify_domain(admin: dict = Depends(require_admin)):
    """Verify domain ownership via DNS check"""
    import socket
    
    domain = await db.domain_settings.find_one({}, {"_id": 0})
    if not domain or not domain.get("custom_domain"):
        raise HTTPException(status_code=400, detail="No domain configured")
    
    custom_domain = domain["custom_domain"]
    
    # Try to resolve the CNAME
    try:
        # Check if domain resolves (basic check)
        socket.gethostbyname(custom_domain)
        
        # In production, you would check if CNAME points to your server
        # For demo purposes, we'll simulate verification after DNS resolves
        await db.domain_settings.update_one({}, {
            "$set": {
                "domain_verified": True,
                "ssl_status": "provisioning",
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
        })
        
        # Simulate SSL provisioning (in production, use Let's Encrypt)
        # After a delay, mark SSL as active
        await db.domain_settings.update_one({}, {"$set": {"ssl_status": "active"}})
        
    except socket.gaierror:
        # Domain doesn't resolve yet
        await db.domain_settings.update_one({}, {
            "$set": {
                "domain_verified": False,
                "ssl_status": "pending"
            }
        })
    
    domain = await db.domain_settings.find_one({}, {"_id": 0})
    return DomainSettingsModel(**domain)

@api_router.delete("/domain-settings")
async def delete_domain_settings(admin: dict = Depends(require_admin)):
    """Remove custom domain"""
    await db.domain_settings.delete_many({})
    return {"message": "Domain settings removed"}

# ============ PUBLIC BOOKING ROUTES ============

@api_router.post("/book")
async def public_booking(booking: BookingRequest, background_tasks: BackgroundTasks):
    """Public booking endpoint for clients"""
    # Validate service
    service = await db.services.find_one({"id": booking.service_id, "is_active": True}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=400, detail="Invalid service")
    
    # Check for double booking
    existing = await db.appointments.find_one({
        "date": booking.date,
        "time": booking.time,
        "status": {"$nin": ["cancelled", "no_show"]}
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Time slot no longer available")
    
    # Create or find client
    client = await db.clients.find_one({"email": booking.email}, {"_id": 0})
    if not client:
        client_dict = {
            "id": str(uuid.uuid4()),
            "full_name": booking.full_name,
            "phone": booking.phone,
            "email": booking.email,
            "address": "",
            "notes": booking.notes,
            "preferred_language": booking.preferred_language,
            "status": "lead",
            "assigned_staff_id": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.clients.insert_one(client_dict)
        client = client_dict
    
    # Create appointment
    apt_dict = {
        "id": str(uuid.uuid4()),
        "client_id": client["id"],
        "service_id": booking.service_id,
        "assigned_staff_id": None,
        "date": booking.date,
        "time": booking.time,
        "duration_minutes": service.get("duration_minutes", 60),
        "status": "scheduled",
        "notes": booking.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reminder_sent_48h": False,
        "confirmation_sent": False
    }
    await db.appointments.insert_one(apt_dict)
    
    # Create service request/case
    case_dict = {
        "id": str(uuid.uuid4()),
        "client_id": client["id"],
        "service_id": booking.service_id,
        "appointment_id": apt_dict["id"],
        "assigned_staff_id": None,
        "status": "new",
        "priority": "normal",
        "due_date": None,
        "notes": booking.notes,
        "checklist": [{"item": doc, "completed": False} for doc in service.get("required_documents", [])],
        "missing_docs_flag": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.service_requests.insert_one(case_dict)
    
    # Send confirmation email
    template = await db.templates.find_one({"name": "booking_confirmation", "type": "email"}, {"_id": 0})
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    
    if template and booking.email:
        lang = booking.preferred_language
        variables = {
            "client_name": booking.full_name,
            "service": service.get(f"name_{lang}", service.get("name_en", "")),
            "date": booking.date,
            "time": booking.time,
            "office_address": settings.get("address", ""),
            "phone": settings.get("phone", "")
        }
        subject, body = render_template(template, variables, lang)
        background_tasks.add_task(send_email_async, booking.email, subject, body)
        await db.appointments.update_one({"id": apt_dict["id"]}, {"$set": {"confirmation_sent": True}})
    
    return {
        "message": "Booking confirmed",
        "appointment_id": apt_dict["id"],
        "case_id": case_dict["id"]
    }

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(TIMEZONE).strftime("%Y-%m-%d")
    
    # Counts
    total_clients = await db.clients.count_documents({})
    active_clients = await db.clients.count_documents({"status": "active"})
    today_appointments = await db.appointments.count_documents({"date": today, "status": {"$nin": ["cancelled", "no_show"]}})
    pending_cases = await db.service_requests.count_documents({"status": {"$nin": ["completed"]}})
    
    # Recent appointments
    recent_appointments = await db.appointments.find(
        {"date": {"$gte": today}},
        {"_id": 0}
    ).sort("date", 1).limit(5).to_list(5)
    
    # Recent cases
    recent_cases = await db.service_requests.find(
        {"status": {"$ne": "completed"}},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_clients": total_clients,
        "active_clients": active_clients,
        "today_appointments": today_appointments,
        "pending_cases": pending_cases,
        "recent_appointments": recent_appointments,
        "recent_cases": recent_cases
    }

# ============ PDF GENERATION ============

# Bilingual PDF labels
PDF_LABELS = {
    "en": {
        "case_summary": "Case Summary",
        "client_summary": "Client Summary",
        "appointment_confirmation": "Appointment Confirmation",
        "confidential": "Confidential — For internal use only",
        "generated_on": "Generated on",
        "client_information": "Client Information",
        "service_information": "Service Information",
        "current_status": "Current Status",
        "checklist_progress": "Checklist Progress",
        "recent_notes": "Recent Notes",
        "upcoming_appointment": "Upcoming Appointment",
        "appointment_history": "Appointment History",
        "case_history": "Case History",
        "name": "Name",
        "phone": "Phone",
        "email": "Email",
        "address": "Address",
        "service": "Service",
        "assigned_to": "Assigned To",
        "status": "Status",
        "stage": "Stage",
        "due_date": "Due Date",
        "priority": "Priority",
        "completed": "Completed",
        "pending": "Pending",
        "date_time": "Date & Time",
        "notes": "Notes",
        "preferred_language": "Preferred Language",
        "contact_information": "Contact Information",
        "thank_you": "Thank you for choosing {business_name}. For questions call {phone}.",
    },
    "es": {
        "case_summary": "Resumen del Caso",
        "client_summary": "Resumen del Cliente",
        "appointment_confirmation": "Confirmación de Cita",
        "confidential": "Confidencial — Solo para uso interno",
        "generated_on": "Generado el",
        "client_information": "Información del Cliente",
        "service_information": "Información del Servicio",
        "current_status": "Estado Actual",
        "checklist_progress": "Progreso de Documentos",
        "recent_notes": "Notas Recientes",
        "upcoming_appointment": "Próxima Cita",
        "appointment_history": "Historial de Citas",
        "case_history": "Historial de Casos",
        "name": "Nombre",
        "phone": "Teléfono",
        "email": "Correo",
        "address": "Dirección",
        "service": "Servicio",
        "assigned_to": "Asignado a",
        "status": "Estado",
        "stage": "Etapa",
        "due_date": "Fecha Límite",
        "priority": "Prioridad",
        "completed": "Completado",
        "pending": "Pendiente",
        "date_time": "Fecha y Hora",
        "notes": "Notas",
        "preferred_language": "Idioma Preferido",
        "contact_information": "Información de Contacto",
        "thank_you": "Gracias por elegir {business_name}. Para preguntas llame al {phone}.",
    }
}

async def get_brand_for_pdf():
    """Get brand settings for PDF header"""
    brand = await db.brand_settings.find_one({}, {"_id": 0}) or {}
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    return {
        "business_name_en": brand.get("business_name_en", settings.get("business_name", "Tax Office")),
        "business_name_es": brand.get("business_name_es", settings.get("business_name_es", "Oficina de Impuestos")),
        "logo_url": brand.get("logo_url", ""),
        "phone": brand.get("contact_phone", settings.get("phone", "")),
        "email": brand.get("contact_email", settings.get("email", "")),
        "address": brand.get("contact_address", settings.get("address", "")),
    }

def create_pdf_styles():
    """Create custom styles for PDF"""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CustomTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#1e293b'),
        alignment=TA_CENTER,
        spaceAfter=20
    ))
    styles.add(ParagraphStyle(
        name='CustomHeading',
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#D4AF37'),
        spaceBefore=15,
        spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='CustomBody',
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='CustomFooter',
        fontName='Helvetica-Oblique',
        fontSize=9,
        textColor=colors.HexColor('#6B7280'),
        alignment=TA_CENTER
    ))
    return styles

def build_pdf_header(elements, brand, lang, styles):
    """Build PDF header with brand info"""
    business_name = brand.get(f"business_name_{lang}", brand.get("business_name_en", "Tax Office"))
    
    # Header with business name
    elements.append(Paragraph(business_name, styles['CustomTitle']))
    
    # Contact info
    contact_parts = []
    if brand.get("phone"):
        contact_parts.append(f"Tel: {brand['phone']}")
    if brand.get("email"):
        contact_parts.append(brand['email'])
    if contact_parts:
        elements.append(Paragraph(" | ".join(contact_parts), styles['CustomFooter']))
    
    if brand.get("address"):
        elements.append(Paragraph(brand['address'], styles['CustomFooter']))
    
    elements.append(Spacer(1, 20))
    
    # Separator line
    line_table = Table([['']], colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 2, colors.HexColor('#D4AF37')),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 15))

def build_pdf_footer(elements, brand, lang, styles):
    """Build PDF footer"""
    labels = PDF_LABELS[lang]
    business_name = brand.get(f"business_name_{lang}", brand.get("business_name_en", "Tax Office"))
    phone = brand.get("phone", "")
    
    elements.append(Spacer(1, 30))
    
    # Separator line
    line_table = Table([['']], colWidths=[7*inch])
    line_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#E5E7EB')),
    ]))
    elements.append(line_table)
    
    # Footer text
    elements.append(Spacer(1, 10))
    footer_text = labels["thank_you"].format(business_name=business_name, phone=phone)
    elements.append(Paragraph(footer_text, styles['CustomFooter']))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph(labels["confidential"], styles['CustomFooter']))
    elements.append(Paragraph(f"{labels['generated_on']} {datetime.now(TIMEZONE).strftime('%Y-%m-%d %H:%M')}", styles['CustomFooter']))

def create_info_table(data, styles):
    """Create a styled info table"""
    table = Table(data, colWidths=[2*inch, 4.5*inch])
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6B7280')),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1f2937')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return table

@api_router.get("/pdf/case/{case_id}")
async def generate_case_pdf(case_id: str, user: dict = Depends(get_current_user)):
    """Generate Case Summary PDF"""
    # Fetch case data
    case = await db.service_requests.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    client = await db.clients.find_one({"id": case["client_id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    service = await db.services.find_one({"id": case["service_id"]}, {"_id": 0})
    staff_member = None
    if case.get("assigned_staff_id"):
        staff_member = await db.staff.find_one({"id": case["assigned_staff_id"]}, {"_id": 0})
    
    # Get next appointment for this case
    next_apt = await db.appointments.find_one(
        {"client_id": client["id"], "date": {"$gte": datetime.now(TIMEZONE).strftime("%Y-%m-%d")}, "status": {"$nin": ["cancelled", "no_show"]}},
        {"_id": 0}
    )
    
    brand = await get_brand_for_pdf()
    lang = client.get("preferred_language", "en")
    labels = PDF_LABELS[lang]
    styles = create_pdf_styles()
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    # Header
    build_pdf_header(elements, brand, lang, styles)
    
    # Title
    elements.append(Paragraph(labels["case_summary"], styles['CustomTitle']))
    elements.append(Spacer(1, 20))
    
    # Client Information Section
    elements.append(Paragraph(labels["client_information"], styles['CustomHeading']))
    client_data = [
        [labels["name"] + ":", client.get("full_name", "-")],
        [labels["phone"] + ":", client.get("phone", "-")],
        [labels["email"] + ":", client.get("email", "-")],
        [labels["address"] + ":", client.get("address", "-")],
        [labels["preferred_language"] + ":", "Español" if lang == "es" else "English"],
    ]
    elements.append(create_info_table(client_data, styles))
    
    # Service Information Section
    elements.append(Paragraph(labels["service_information"], styles['CustomHeading']))
    service_name = service.get(f"name_{lang}", service.get("name_en", "-")) if service else "-"
    status_labels = {
        "new": "Nuevo" if lang == "es" else "New",
        "waiting_docs": "Esperando Docs" if lang == "es" else "Waiting Docs",
        "in_review": "En Revisión" if lang == "es" else "In Review",
        "submitted": "Enviado" if lang == "es" else "Submitted",
        "completed": "Completado" if lang == "es" else "Completed",
    }
    priority_labels = {
        "low": "Baja" if lang == "es" else "Low",
        "normal": "Normal",
        "high": "Alta" if lang == "es" else "High",
        "urgent": "Urgente" if lang == "es" else "Urgent",
    }
    service_data = [
        [labels["service"] + ":", service_name],
        [labels["status"] + ":", status_labels.get(case.get("status"), case.get("status", "-"))],
        [labels["priority"] + ":", priority_labels.get(case.get("priority"), case.get("priority", "-"))],
        [labels["assigned_to"] + ":", staff_member.get("full_name", "-") if staff_member else "-"],
        [labels["due_date"] + ":", case.get("due_date", "-") or "-"],
    ]
    elements.append(create_info_table(service_data, styles))
    
    # Checklist Progress Section
    checklist = case.get("checklist", [])
    if checklist:
        elements.append(Paragraph(labels["checklist_progress"], styles['CustomHeading']))
        completed_count = sum(1 for item in checklist if item.get("completed"))
        progress_text = f"{completed_count}/{len(checklist)} {labels['completed']}"
        elements.append(Paragraph(progress_text, styles['CustomBody']))
        
        for item in checklist:
            status_mark = "✓" if item.get("completed") else "○"
            status_text = labels["completed"] if item.get("completed") else labels["pending"]
            elements.append(Paragraph(f"  {status_mark} {item.get('item', '')} - {status_text}", styles['CustomBody']))
    
    # Notes Section
    if case.get("notes"):
        elements.append(Paragraph(labels["recent_notes"], styles['CustomHeading']))
        elements.append(Paragraph(case.get("notes", ""), styles['CustomBody']))
    
    # Upcoming Appointment Section
    if next_apt:
        elements.append(Paragraph(labels["upcoming_appointment"], styles['CustomHeading']))
        apt_service = await db.services.find_one({"id": next_apt["service_id"]}, {"_id": 0})
        apt_service_name = apt_service.get(f"name_{lang}", apt_service.get("name_en", "")) if apt_service else ""
        apt_data = [
            [labels["service"] + ":", apt_service_name],
            [labels["date_time"] + ":", f"{next_apt.get('date', '')} {next_apt.get('time', '')}"],
        ]
        elements.append(create_info_table(apt_data, styles))
    
    # Footer
    build_pdf_footer(elements, brand, lang, styles)
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"case_summary_{case_id[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/pdf/client/{client_id}")
async def generate_client_pdf(client_id: str, user: dict = Depends(get_current_user)):
    """Generate Client Summary PDF"""
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get recent appointments (last 5)
    appointments = await db.appointments.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("date", -1).limit(5).to_list(5)
    
    # Get recent cases (last 5)
    cases = await db.service_requests.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get services for name lookup
    services = {s["id"]: s for s in await db.services.find({}, {"_id": 0}).to_list(100)}
    staff_list = {s["id"]: s for s in await db.staff.find({}, {"_id": 0}).to_list(100)}
    
    brand = await get_brand_for_pdf()
    lang = client.get("preferred_language", "en")
    labels = PDF_LABELS[lang]
    styles = create_pdf_styles()
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    # Header
    build_pdf_header(elements, brand, lang, styles)
    
    # Title
    elements.append(Paragraph(labels["client_summary"], styles['CustomTitle']))
    elements.append(Spacer(1, 20))
    
    # Client Information Section
    elements.append(Paragraph(labels["client_information"], styles['CustomHeading']))
    status_labels = {
        "lead": "Prospecto" if lang == "es" else "Lead",
        "active": "Activo" if lang == "es" else "Active",
        "completed": "Completado" if lang == "es" else "Completed",
        "archived": "Archivado" if lang == "es" else "Archived",
    }
    client_data = [
        [labels["name"] + ":", client.get("full_name", "-")],
        [labels["status"] + ":", status_labels.get(client.get("status"), client.get("status", "-"))],
        [labels["phone"] + ":", client.get("phone", "-")],
        [labels["email"] + ":", client.get("email", "-")],
        [labels["address"] + ":", client.get("address", "-")],
        [labels["preferred_language"] + ":", "Español" if lang == "es" else "English"],
    ]
    if client.get("assigned_staff_id"):
        staff = staff_list.get(client["assigned_staff_id"])
        client_data.append([labels["assigned_to"] + ":", staff.get("full_name", "-") if staff else "-"])
    elements.append(create_info_table(client_data, styles))
    
    # Appointment History Section
    if appointments:
        elements.append(Paragraph(labels["appointment_history"], styles['CustomHeading']))
        apt_status_labels = {
            "scheduled": "Programada" if lang == "es" else "Scheduled",
            "confirmed": "Confirmada" if lang == "es" else "Confirmed",
            "completed": "Completada" if lang == "es" else "Completed",
            "cancelled": "Cancelada" if lang == "es" else "Cancelled",
            "no_show": "No Asistió" if lang == "es" else "No Show",
        }
        for apt in appointments:
            service = services.get(apt.get("service_id"), {})
            service_name = service.get(f"name_{lang}", service.get("name_en", "-"))
            status = apt_status_labels.get(apt.get("status"), apt.get("status", "-"))
            elements.append(Paragraph(f"• {apt.get('date', '')} {apt.get('time', '')} - {service_name} ({status})", styles['CustomBody']))
    
    # Case History Section
    if cases:
        elements.append(Paragraph(labels["case_history"], styles['CustomHeading']))
        case_status_labels = {
            "new": "Nuevo" if lang == "es" else "New",
            "waiting_docs": "Esperando Docs" if lang == "es" else "Waiting Docs",
            "in_review": "En Revisión" if lang == "es" else "In Review",
            "submitted": "Enviado" if lang == "es" else "Submitted",
            "completed": "Completado" if lang == "es" else "Completed",
        }
        for case in cases:
            service = services.get(case.get("service_id"), {})
            service_name = service.get(f"name_{lang}", service.get("name_en", "-"))
            status = case_status_labels.get(case.get("status"), case.get("status", "-"))
            checklist = case.get("checklist", [])
            progress = f"{sum(1 for c in checklist if c.get('completed'))}/{len(checklist)}" if checklist else "-"
            elements.append(Paragraph(f"• {service_name} - {status} ({progress} docs)", styles['CustomBody']))
    
    # Notes Section
    if client.get("notes"):
        elements.append(Paragraph(labels["notes"], styles['CustomHeading']))
        elements.append(Paragraph(client.get("notes", ""), styles['CustomBody']))
    
    # Footer
    build_pdf_footer(elements, brand, lang, styles)
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"client_summary_{client_id[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/pdf/appointment/{appointment_id}")
async def generate_appointment_pdf(appointment_id: str, user: dict = Depends(get_current_user)):
    """Generate Appointment Confirmation PDF"""
    apt = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    client = await db.clients.find_one({"id": apt["client_id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
    staff_member = None
    if apt.get("assigned_staff_id"):
        staff_member = await db.staff.find_one({"id": apt["assigned_staff_id"]}, {"_id": 0})
    
    brand = await get_brand_for_pdf()
    lang = client.get("preferred_language", "en")
    labels = PDF_LABELS[lang]
    styles = create_pdf_styles()
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    
    # Header
    build_pdf_header(elements, brand, lang, styles)
    
    # Title
    elements.append(Paragraph(labels["appointment_confirmation"], styles['CustomTitle']))
    elements.append(Spacer(1, 20))
    
    # Client Information Section
    elements.append(Paragraph(labels["client_information"], styles['CustomHeading']))
    client_data = [
        [labels["name"] + ":", client.get("full_name", "-")],
        [labels["phone"] + ":", client.get("phone", "-")],
        [labels["email"] + ":", client.get("email", "-")],
    ]
    elements.append(create_info_table(client_data, styles))
    
    # Appointment Details Section
    service_name = service.get(f"name_{lang}", service.get("name_en", "-")) if service else "-"
    apt_status_labels = {
        "scheduled": "Programada" if lang == "es" else "Scheduled",
        "confirmed": "Confirmada" if lang == "es" else "Confirmed",
        "completed": "Completada" if lang == "es" else "Completed",
        "cancelled": "Cancelada" if lang == "es" else "Cancelled",
        "no_show": "No Asistió" if lang == "es" else "No Show",
    }
    
    elements.append(Paragraph(labels["service_information"], styles['CustomHeading']))
    apt_data = [
        [labels["service"] + ":", service_name],
        [labels["date_time"] + ":", f"{apt.get('date', '')} {apt.get('time', '')}"],
        [labels["status"] + ":", apt_status_labels.get(apt.get("status"), apt.get("status", "-"))],
        [labels["assigned_to"] + ":", staff_member.get("full_name", "-") if staff_member else "-"],
    ]
    elements.append(create_info_table(apt_data, styles))
    
    # Location Section
    if brand.get("address"):
        address_label = "Ubicación" if lang == "es" else "Location"
        elements.append(Paragraph(address_label, styles['CustomHeading']))
        elements.append(Paragraph(brand.get("address", ""), styles['CustomBody']))
    
    # Notes Section
    if apt.get("notes"):
        elements.append(Paragraph(labels["notes"], styles['CustomHeading']))
        elements.append(Paragraph(apt.get("notes", ""), styles['CustomBody']))
    
    # Footer
    build_pdf_footer(elements, brand, lang, styles)
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"appointment_{appointment_id[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ============ SEED DATA ============

@api_router.post("/seed")
async def seed_demo_data():
    """Seed demo data for testing"""
    # Check if already seeded
    existing_clients = await db.clients.count_documents({})
    if existing_clients > 0:
        return {"message": "Data already seeded"}
    
    # Default services
    services = [
        {
            "id": str(uuid.uuid4()),
            "name_en": "Tax Returns",
            "name_es": "Declaraciones de Impuestos",
            "description_en": "Individual and business tax return preparation",
            "description_es": "Preparacion de declaraciones de impuestos individuales y de negocios",
            "duration_minutes": 60,
            "required_documents": ["W-2 Forms", "1099 Forms", "ID/SSN", "Previous Year Return"],
            "workflow_stages": ["new", "waiting_docs", "in_review", "submitted", "completed"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_en": "IRS Audits",
            "name_es": "Auditorias del IRS",
            "description_en": "IRS audit representation and resolution",
            "description_es": "Representacion y resolucion de auditorias del IRS",
            "duration_minutes": 90,
            "required_documents": ["IRS Notice", "Tax Returns (3 years)", "Supporting Documents"],
            "workflow_stages": ["new", "waiting_docs", "in_review", "submitted", "completed"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_en": "Business Formation",
            "name_es": "Registro de Empresas",
            "description_en": "LLC, Corporation, and Partnership formation",
            "description_es": "Formacion de LLC, Corporacion y Sociedad",
            "duration_minutes": 60,
            "required_documents": ["ID/SSN", "Business Name Options", "Member Information"],
            "workflow_stages": ["new", "waiting_docs", "in_review", "submitted", "completed"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_en": "Business Licenses & Permits",
            "name_es": "Licencias y Permisos para Negocios",
            "description_en": "Obtain necessary licenses and permits for your business",
            "description_es": "Obtener las licencias y permisos necesarios para su negocio",
            "duration_minutes": 45,
            "required_documents": ["Business Registration", "ID", "Lease Agreement"],
            "workflow_stages": ["new", "waiting_docs", "in_review", "submitted", "completed"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name_en": "SBA Loan Assistance",
            "name_es": "Asistencia de Prestamos SBA",
            "description_en": "SBA loan application assistance and documentation",
            "description_es": "Asistencia con solicitud y documentacion de prestamos SBA",
            "duration_minutes": 90,
            "required_documents": ["Business Plan", "Financial Statements", "Tax Returns (2 years)", "ID"],
            "workflow_stages": ["new", "waiting_docs", "in_review", "submitted", "completed"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Default templates
    templates = [
        {
            "id": str(uuid.uuid4()),
            "name": "booking_confirmation",
            "type": "email",
            "subject_en": "Appointment Confirmation - {service}",
            "subject_es": "Confirmacion de Cita - {service}",
            "body_en": "<h2>Hello {client_name},</h2><p>Your appointment has been confirmed.</p><p><strong>Service:</strong> {service}</p><p><strong>Date:</strong> {date}</p><p><strong>Time:</strong> {time}</p><p><strong>Location:</strong> {office_address}</p><p>If you have questions, call us at {phone}.</p><p>Thank you!</p>",
            "body_es": "<h2>Hola {client_name},</h2><p>Su cita ha sido confirmada.</p><p><strong>Servicio:</strong> {service}</p><p><strong>Fecha:</strong> {date}</p><p><strong>Hora:</strong> {time}</p><p><strong>Ubicacion:</strong> {office_address}</p><p>Si tiene preguntas, llamenos al {phone}.</p><p>Gracias!</p>",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "reminder_48h",
            "type": "email",
            "subject_en": "Reminder: Your Appointment in 48 Hours",
            "subject_es": "Recordatorio: Su Cita en 48 Horas",
            "body_en": "<h2>Hello {client_name},</h2><p>This is a reminder about your upcoming appointment.</p><p><strong>Service:</strong> {service}</p><p><strong>Date:</strong> {date}</p><p><strong>Time:</strong> {time}</p><p><strong>Location:</strong> {office_address}</p><p>Please bring all required documents. Call {phone} if you need to reschedule.</p>",
            "body_es": "<h2>Hola {client_name},</h2><p>Este es un recordatorio sobre su proxima cita.</p><p><strong>Servicio:</strong> {service}</p><p><strong>Fecha:</strong> {date}</p><p><strong>Hora:</strong> {time}</p><p><strong>Ubicacion:</strong> {office_address}</p><p>Por favor traiga todos los documentos requeridos. Llame al {phone} si necesita reprogramar.</p>",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "missing_docs",
            "type": "email",
            "subject_en": "Missing Documents - {service}",
            "subject_es": "Documentos Faltantes - {service}",
            "body_en": "<h2>Hello {client_name},</h2><p>We are missing the following documents to process your {service}:</p><p><strong>{missing_documents}</strong></p><p>Please submit these as soon as possible. Contact us at {phone} if you have questions.</p>",
            "body_es": "<h2>Hola {client_name},</h2><p>Nos faltan los siguientes documentos para procesar su {service}:</p><p><strong>{missing_documents}</strong></p><p>Por favor envie estos lo antes posible. Contactenos al {phone} si tiene preguntas.</p>",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "case_completed",
            "type": "email",
            "subject_en": "Your {service} is Complete!",
            "subject_es": "Su {service} esta Completo!",
            "body_en": "<h2>Hello {client_name},</h2><p>Great news! Your {service} has been completed.</p><p>Please visit our office at {office_address} or call {phone} for next steps.</p><p>Thank you for choosing us!</p>",
            "body_es": "<h2>Hola {client_name},</h2><p>Buenas noticias! Su {service} ha sido completado.</p><p>Por favor visite nuestra oficina en {office_address} o llame al {phone} para los proximos pasos.</p><p>Gracias por elegirnos!</p>",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        # SMS Templates
        {
            "id": str(uuid.uuid4()),
            "name": "booking_confirmation",
            "type": "sms",
            "subject_en": "",
            "subject_es": "",
            "body_en": "Hi {client_name}, your {service} appointment is confirmed for {date} at {time}. Location: {office_address}. Call {phone} with questions.",
            "body_es": "Hola {client_name}, su cita de {service} esta confirmada para {date} a las {time}. Ubicacion: {office_address}. Llame al {phone} si tiene preguntas.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "reminder_48h",
            "type": "sms",
            "subject_en": "",
            "subject_es": "",
            "body_en": "Reminder: {client_name}, your {service} appointment is in 48 hours on {date} at {time}. Please bring all documents. Call {phone} to reschedule.",
            "body_es": "Recordatorio: {client_name}, su cita de {service} es en 48 horas el {date} a las {time}. Traiga todos los documentos. Llame al {phone} para reprogramar.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Demo staff users
    staff_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@taxoffice.com",
            "full_name": "Maria Rodriguez",
            "password": hash_password("admin123"),
            "role": "admin",
            "language": "es",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "staff1@taxoffice.com",
            "full_name": "John Smith",
            "password": hash_password("staff123"),
            "role": "staff",
            "language": "en",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "staff2@taxoffice.com",
            "full_name": "Ana Garcia",
            "password": hash_password("staff123"),
            "role": "staff",
            "language": "es",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Demo clients
    clients = [
        {"id": str(uuid.uuid4()), "full_name": "Carlos Mendez", "phone": "555-0101", "email": "carlos@email.com", "address": "123 Main St", "notes": "", "preferred_language": "es", "status": "active", "assigned_staff_id": staff_users[2]["id"], "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "full_name": "Sarah Johnson", "phone": "555-0102", "email": "sarah@email.com", "address": "456 Oak Ave", "notes": "", "preferred_language": "en", "status": "active", "assigned_staff_id": staff_users[1]["id"], "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "full_name": "Miguel Torres", "phone": "555-0103", "email": "miguel@email.com", "address": "789 Pine Rd", "notes": "", "preferred_language": "es", "status": "lead", "assigned_staff_id": None, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "full_name": "Emily Davis", "phone": "555-0104", "email": "emily@email.com", "address": "321 Elm St", "notes": "", "preferred_language": "en", "status": "completed", "assigned_staff_id": staff_users[1]["id"], "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "full_name": "Rosa Martinez", "phone": "555-0105", "email": "rosa@email.com", "address": "654 Maple Dr", "notes": "", "preferred_language": "es", "status": "active", "assigned_staff_id": staff_users[2]["id"], "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
    ]
    
    # Demo appointments (upcoming)
    base_date = datetime.now(TIMEZONE)
    appointments = []
    for i in range(10):
        apt_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        apt_time = f"{9 + (i % 8):02d}:00"
        appointments.append({
            "id": str(uuid.uuid4()),
            "client_id": clients[i % 5]["id"],
            "service_id": services[i % 5]["id"],
            "assigned_staff_id": staff_users[(i % 2) + 1]["id"],
            "date": apt_date,
            "time": apt_time,
            "duration_minutes": services[i % 5]["duration_minutes"],
            "status": ["scheduled", "confirmed"][i % 2],
            "notes": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "reminder_sent_48h": False,
            "confirmation_sent": True
        })
    
    # Demo service requests
    service_requests = [
        {
            "id": str(uuid.uuid4()),
            "client_id": clients[0]["id"],
            "service_id": services[0]["id"],
            "appointment_id": appointments[0]["id"],
            "assigned_staff_id": staff_users[2]["id"],
            "status": "in_review",
            "priority": "normal",
            "due_date": (base_date + timedelta(days=14)).strftime("%Y-%m-%d"),
            "notes": "Reviewing W-2 forms",
            "checklist": [{"item": "W-2 Forms", "completed": True}, {"item": "1099 Forms", "completed": True}, {"item": "ID/SSN", "completed": True}, {"item": "Previous Year Return", "completed": False}],
            "missing_docs_flag": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": clients[1]["id"],
            "service_id": services[2]["id"],
            "appointment_id": appointments[1]["id"],
            "assigned_staff_id": staff_users[1]["id"],
            "status": "waiting_docs",
            "priority": "high",
            "due_date": (base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
            "notes": "Waiting for member information",
            "checklist": [{"item": "ID/SSN", "completed": True}, {"item": "Business Name Options", "completed": True}, {"item": "Member Information", "completed": False}],
            "missing_docs_flag": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_id": clients[4]["id"],
            "service_id": services[4]["id"],
            "appointment_id": appointments[4]["id"],
            "assigned_staff_id": staff_users[2]["id"],
            "status": "new",
            "priority": "normal",
            "due_date": None,
            "notes": "Initial consultation",
            "checklist": [{"item": "Business Plan", "completed": False}, {"item": "Financial Statements", "completed": False}, {"item": "Tax Returns (2 years)", "completed": False}, {"item": "ID", "completed": False}],
            "missing_docs_flag": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Default settings
    settings = {
        "business_name": "Elite Tax Services",
        "business_name_es": "Servicios de Impuestos Elite",
        "phone": "(555) 123-4567",
        "email": "info@elitetax.com",
        "address": "100 Financial Plaza, Suite 200, New York, NY 10001",
        "logo_url": "",
        "business_hours_start": "09:00",
        "business_hours_end": "17:00",
        "blocked_dates": [],
        "enable_reminders": True,
        "enable_sms": False,
        "immigration_services_enabled": False,
        "timezone": "America/New_York"
    }
    
    # Default brand settings
    brand_settings = {
        "business_name_en": "Elite Tax Services",
        "business_name_es": "Servicios de Impuestos Elite",
        "tagline_en": "Professional Tax & Business Services",
        "tagline_es": "Servicios Profesionales de Impuestos y Negocios",
        "logo_url": "",
        "primary_color": "#1e293b",
        "accent_color": "#D4AF37",
        "office_address": "100 Financial Plaza, Suite 200, New York, NY 10001",
        "phone": "(555) 123-4567",
        "email": "info@elitetax.com",
        "sender_name": "Elite Tax Services",
        "hero_title_en": "Book Your Appointment",
        "hero_title_es": "Reserve su Cita",
        "hero_subtitle_en": "Professional tax and business services tailored to your needs",
        "hero_subtitle_es": "Servicios profesionales de impuestos y negocios adaptados a sus necesidades",
        "footer_text_en": "© 2026 Elite Tax Services. All rights reserved.",
        "footer_text_es": "© 2026 Servicios de Impuestos Elite. Todos los derechos reservados.",
        "social_facebook": "",
        "social_instagram": "",
        "social_linkedin": ""
    }
    
    # Insert all data
    await db.services.insert_many(services)
    await db.templates.insert_many(templates)
    await db.users.insert_many(staff_users)
    await db.clients.insert_many(clients)
    await db.appointments.insert_many(appointments)
    await db.service_requests.insert_many(service_requests)
    await db.settings.insert_one(settings)
    await db.brand_settings.insert_one(brand_settings)
    
    return {
        "message": "Demo data seeded successfully",
        "credentials": {
            "admin": {"email": "admin@taxoffice.com", "password": "admin123"},
            "staff1": {"email": "staff1@taxoffice.com", "password": "staff123"},
            "staff2": {"email": "staff2@taxoffice.com", "password": "staff123"}
        }
    }

# ============ REMINDER JOB ============

async def send_48h_reminders():
    """Background job to send 48-hour appointment reminders via email and SMS"""
    settings = await db.settings.find_one({}, {"_id": 0}) or {}
    if not settings.get("enable_reminders", True):
        return
    
    now = datetime.now(TIMEZONE)
    target_time = now + timedelta(hours=48)
    target_date = target_time.strftime("%Y-%m-%d")
    
    # Find appointments that need reminders
    appointments = await db.appointments.find({
        "date": target_date,
        "status": {"$nin": ["cancelled", "no_show"]},
        "reminder_sent_48h": False
    }, {"_id": 0}).to_list(100)
    
    # Get email template
    email_template = await db.templates.find_one({"name": "reminder_48h", "type": "email"}, {"_id": 0})
    # Get SMS template
    sms_template = await db.templates.find_one({"name": "reminder_48h", "type": "sms"}, {"_id": 0})
    
    if not email_template and not sms_template:
        logger.warning("No 48h reminder templates found")
        return
    
    for apt in appointments:
        try:
            client_doc = await db.clients.find_one({"id": apt["client_id"]}, {"_id": 0})
            service = await db.services.find_one({"id": apt["service_id"]}, {"_id": 0})
            
            if not client_doc:
                continue
            
            lang = client_doc.get("preferred_language", "en")
            variables = {
                "client_name": client_doc["full_name"],
                "service": service.get(f"name_{lang}", service.get("name_en", "")),
                "date": apt["date"],
                "time": apt["time"],
                "office_address": settings.get("address", ""),
                "phone": settings.get("phone", "")
            }
            
            email_sent = False
            sms_sent = False
            
            # Send email if client has email and email template exists
            if client_doc.get("email") and email_template:
                subject, body = render_template(email_template, variables, lang)
                result = await send_email_async(client_doc["email"], subject, body)
                email_sent = result is not None
            
            # Send SMS if enabled, client has phone, and SMS template exists
            if settings.get("enable_sms", False) and client_doc.get("phone") and sms_template:
                _, sms_body = render_template(sms_template, variables, lang)
                # Strip HTML tags for SMS
                import re
                sms_text = re.sub('<[^<]+?>', '', sms_body)
                result = await send_sms_async(client_doc["phone"], sms_text)
                sms_sent = result is not None
            
            # Mark reminder as sent if at least one channel succeeded
            if email_sent or sms_sent:
                await db.appointments.update_one(
                    {"id": apt["id"]},
                    {"$set": {
                        "reminder_sent_48h": True,
                        "reminder_email_sent": email_sent,
                        "reminder_sms_sent": sms_sent
                    }}
                )
                logger.info(f"48h reminder sent for appointment {apt['id']} (email={email_sent}, sms={sms_sent})")
        except Exception as e:
            logger.error(f"Error sending reminder for appointment {apt['id']}: {str(e)}")

@api_router.post("/reminders/run")
async def trigger_reminders(admin: dict = Depends(require_admin)):
    """Manually trigger reminder job"""
    await send_48h_reminders()
    return {"message": "Reminders processed"}

# ============ EMAIL TEST ============

@api_router.post("/email/test")
async def test_email(request: EmailRequest, admin: dict = Depends(require_admin)):
    """Test email sending"""
    result = await send_email_async(request.recipient_email, request.subject, request.html_content)
    if result:
        return {"status": "success", "email_id": result.get("id")}
    return {"status": "failed", "message": "Email not sent (check API key)"}

# ============ SMS TEST ============

class SMSRequest(BaseModel):
    recipient_phone: str
    message: str

@api_router.post("/sms/test")
async def test_sms(request: SMSRequest, admin: dict = Depends(require_admin)):
    """Test SMS sending"""
    result = await send_sms_async(request.recipient_phone, request.message)
    if result:
        return {"status": "success", "sid": result.get("sid"), "message_status": result.get("status")}
    return {"status": "failed", "message": "SMS not sent (check Twilio credentials)"}

@api_router.get("/sms/status")
async def get_sms_status(admin: dict = Depends(require_admin)):
    """Check Twilio SMS configuration status"""
    return {
        "configured": twilio_client is not None,
        "account_sid_set": bool(TWILIO_ACCOUNT_SID),
        "auth_token_set": bool(TWILIO_AUTH_TOKEN),
        "phone_number_set": bool(TWILIO_PHONE_NUMBER),
        "phone_number": TWILIO_PHONE_NUMBER[-4:] if TWILIO_PHONE_NUMBER else None  # Last 4 digits only
    }

# ============ MAIN APP SETUP ============

@api_router.get("/")
async def root():
    return {"message": "Tax Office CRM API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Background task scheduler (runs every hour)
async def reminder_scheduler():
    while True:
        try:
            await send_48h_reminders()
        except Exception as e:
            logger.error(f"Reminder scheduler error: {str(e)}")
        await asyncio.sleep(3600)  # Run every hour

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(reminder_scheduler())
    logger.info("Reminder scheduler started")
