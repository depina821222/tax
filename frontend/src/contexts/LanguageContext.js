import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    appointments: 'Appointments',
    clients: 'Clients',
    services: 'Services',
    cases: 'Service Requests',
    templates: 'Templates',
    staff: 'Staff',
    settings: 'Settings',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    sendResetLink: 'Send Reset Link',
    backToLogin: 'Back to Login',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    totalClients: 'Total Clients',
    activeClients: 'Active Clients',
    todayAppointments: "Today's Appointments",
    pendingCases: 'Pending Cases',
    recentAppointments: 'Recent Appointments',
    recentCases: 'Recent Cases',
    viewAll: 'View All',
    
    // Appointments
    newAppointment: 'New Appointment',
    date: 'Date',
    time: 'Time',
    client: 'Client',
    service: 'Service',
    status: 'Status',
    assignedTo: 'Assigned To',
    notes: 'Notes',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    
    // Clients
    newClient: 'New Client',
    fullName: 'Full Name',
    phone: 'Phone',
    address: 'Address',
    preferredLanguage: 'Preferred Language',
    clientStatus: 'Status',
    lead: 'Lead',
    active: 'Active',
    archived: 'Archived',
    timeline: 'Timeline',
    
    // Services
    newService: 'New Service',
    serviceName: 'Service Name',
    description: 'Description',
    duration: 'Duration',
    minutes: 'minutes',
    requiredDocuments: 'Required Documents',
    workflowStages: 'Workflow Stages',
    
    // Cases
    newCase: 'New Case',
    priority: 'Priority',
    dueDate: 'Due Date',
    checklist: 'Checklist',
    missingDocs: 'Missing Docs',
    sendFollowUp: 'Send Follow-up',
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    new: 'New',
    waitingDocs: 'Waiting for Documents',
    inReview: 'In Review',
    submitted: 'Submitted',
    
    // Templates
    newTemplate: 'New Template',
    templateName: 'Template Name',
    templateType: 'Type',
    subject: 'Subject',
    body: 'Body',
    variables: 'Available Variables',
    
    // Settings
    businessInfo: 'Business Information',
    businessName: 'Business Name',
    businessHours: 'Business Hours',
    blockedDates: 'Blocked Dates',
    integrations: 'Integrations',
    enableReminders: 'Enable Reminders',
    enableSMS: 'Enable SMS',
    enableImmigration: 'Enable Immigration Services',
    
    // Booking
    bookAppointment: 'Book an Appointment',
    selectService: 'Select a Service',
    selectDateTime: 'Select Date & Time',
    yourInformation: 'Your Information',
    confirmation: 'Confirmation',
    next: 'Next',
    back: 'Back',
    bookNow: 'Book Now',
    bookingConfirmed: 'Booking Confirmed!',
    thankYou: 'Thank you for booking with us.',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    loading: 'Loading...',
    noResults: 'No results found',
    required: 'Required',
    optional: 'Optional',
    success: 'Success',
    error: 'Error',
    
    // Service names
    taxReturns: 'Tax Returns',
    irsAudits: 'IRS Audits',
    businessFormation: 'Business Formation',
    businessLicenses: 'Business Licenses & Permits',
    sbaLoan: 'SBA Loan Assistance',
    immigrationServices: 'Immigration Services',
  },
  es: {
    // Navigation
    dashboard: 'Panel',
    calendar: 'Calendario',
    appointments: 'Citas',
    clients: 'Clientes',
    services: 'Servicios',
    cases: 'Solicitudes',
    templates: 'Plantillas',
    staff: 'Personal',
    settings: 'Configuracion',
    logout: 'Cerrar Sesion',
    
    // Auth
    login: 'Iniciar Sesion',
    email: 'Correo Electronico',
    password: 'Contrasena',
    forgotPassword: 'Olvido su Contrasena?',
    resetPassword: 'Restablecer Contrasena',
    newPassword: 'Nueva Contrasena',
    confirmPassword: 'Confirmar Contrasena',
    sendResetLink: 'Enviar Enlace',
    backToLogin: 'Volver al Inicio',
    
    // Dashboard
    welcomeBack: 'Bienvenido',
    totalClients: 'Total de Clientes',
    activeClients: 'Clientes Activos',
    todayAppointments: 'Citas de Hoy',
    pendingCases: 'Casos Pendientes',
    recentAppointments: 'Citas Recientes',
    recentCases: 'Casos Recientes',
    viewAll: 'Ver Todo',
    
    // Appointments
    newAppointment: 'Nueva Cita',
    date: 'Fecha',
    time: 'Hora',
    client: 'Cliente',
    service: 'Servicio',
    status: 'Estado',
    assignedTo: 'Asignado a',
    notes: 'Notas',
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    noShow: 'No Asistio',
    
    // Clients
    newClient: 'Nuevo Cliente',
    fullName: 'Nombre Completo',
    phone: 'Telefono',
    address: 'Direccion',
    preferredLanguage: 'Idioma Preferido',
    clientStatus: 'Estado',
    lead: 'Prospecto',
    active: 'Activo',
    archived: 'Archivado',
    timeline: 'Historial',
    
    // Services
    newService: 'Nuevo Servicio',
    serviceName: 'Nombre del Servicio',
    description: 'Descripcion',
    duration: 'Duracion',
    minutes: 'minutos',
    requiredDocuments: 'Documentos Requeridos',
    workflowStages: 'Etapas del Proceso',
    
    // Cases
    newCase: 'Nuevo Caso',
    priority: 'Prioridad',
    dueDate: 'Fecha Limite',
    checklist: 'Lista de Verificacion',
    missingDocs: 'Documentos Faltantes',
    sendFollowUp: 'Enviar Seguimiento',
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente',
    new: 'Nuevo',
    waitingDocs: 'Esperando Documentos',
    inReview: 'En Revision',
    submitted: 'Enviado',
    
    // Templates
    newTemplate: 'Nueva Plantilla',
    templateName: 'Nombre de Plantilla',
    templateType: 'Tipo',
    subject: 'Asunto',
    body: 'Contenido',
    variables: 'Variables Disponibles',
    
    // Settings
    businessInfo: 'Informacion del Negocio',
    businessName: 'Nombre del Negocio',
    businessHours: 'Horario de Atencion',
    blockedDates: 'Fechas Bloqueadas',
    integrations: 'Integraciones',
    enableReminders: 'Habilitar Recordatorios',
    enableSMS: 'Habilitar SMS',
    enableImmigration: 'Habilitar Servicios de Inmigracion',
    
    // Booking
    bookAppointment: 'Reservar una Cita',
    selectService: 'Seleccione un Servicio',
    selectDateTime: 'Seleccione Fecha y Hora',
    yourInformation: 'Su Informacion',
    confirmation: 'Confirmacion',
    next: 'Siguiente',
    back: 'Atras',
    bookNow: 'Reservar Ahora',
    bookingConfirmed: 'Reserva Confirmada!',
    thankYou: 'Gracias por reservar con nosotros.',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Buscar',
    filter: 'Filtrar',
    actions: 'Acciones',
    loading: 'Cargando...',
    noResults: 'No se encontraron resultados',
    required: 'Requerido',
    optional: 'Opcional',
    success: 'Exito',
    error: 'Error',
    
    // Service names
    taxReturns: 'Declaraciones de Impuestos',
    irsAudits: 'Auditorias del IRS',
    businessFormation: 'Registro de Empresas',
    businessLicenses: 'Licencias y Permisos',
    sbaLoan: 'Asistencia de Prestamos SBA',
    immigrationServices: 'Servicios de Inmigracion',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
