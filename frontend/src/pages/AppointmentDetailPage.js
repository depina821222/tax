import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, User, Calendar, Clock, FileText, Download, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Bilingual labels
const LABELS = {
  en: {
    appointmentDetails: 'Appointment Details',
    client: 'Client',
    service: 'Service',
    dateTime: 'Date & Time',
    assignedStaff: 'Assigned Staff',
    status: 'Status',
    notes: 'Notes',
    downloadPdf: 'Download Appointment Confirmation (PDF)',
    backToAppointments: 'Back to Appointments',
    notFound: 'Appointment not found',
    loading: 'Loading...',
  },
  es: {
    appointmentDetails: 'Detalles de la Cita',
    client: 'Cliente',
    service: 'Servicio',
    dateTime: 'Fecha y Hora',
    assignedStaff: 'Personal Asignado',
    status: 'Estado',
    notes: 'Notas',
    downloadPdf: 'Descargar Confirmación de Cita (PDF)',
    backToAppointments: 'Volver a Citas',
    notFound: 'Cita no encontrada',
    loading: 'Cargando...',
  }
};

const STATUS_LABELS = {
  en: {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  },
  es: {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    no_show: 'No Asistió',
  }
};

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.en;
  const statusLabels = STATUS_LABELS[language] || STATUS_LABELS.en;
  
  const [appointment, setAppointment] = useState(null);
  const [client, setClient] = useState(null);
  const [service, setService] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [aptRes, clientsRes, servicesRes, staffRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/services`),
        axios.get(`${API}/staff`)
      ]);
      
      const apt = aptRes.data.find(a => a.id === id);
      if (apt) {
        setAppointment(apt);
        setClient(clientsRes.data.find(c => c.id === apt.client_id));
        setService(servicesRes.data.find(s => s.id === apt.service_id));
        if (apt.assigned_staff_id) {
          setStaff(staffRes.data.find(s => s.id === apt.assigned_staff_id));
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/pdf/appointment/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointment_${id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(language === 'es' ? 'PDF descargado' : 'PDF downloaded');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error(language === 'es' ? 'Error al descargar PDF' : 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const getServiceName = () => {
    if (!service) return '-';
    return language === 'es' ? service.name_es : service.name_en;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-amber-900/50 text-amber-400 border border-amber-700',
      confirmed: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
      completed: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      cancelled: 'bg-red-900/50 text-red-400 border border-red-700',
      no_show: 'bg-slate-800 text-slate-400 border border-slate-700',
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">{labels.loading}</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{labels.notFound}</p>
        <Link to="/portal/appointments">
          <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToAppointments}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="appointment-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/portal/appointments">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#D4AF37]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 font-serif">{labels.appointmentDetails}</h1>
            <p className="text-slate-400 text-sm">ID: {id.slice(0, 8)}...</p>
          </div>
        </div>
        <Button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
          data-testid="download-appointment-pdf-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloading ? (language === 'es' ? 'Descargando...' : 'Downloading...') : labels.downloadPdf}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Info */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              {labels.appointmentDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">{labels.service}</span>
                <span className="text-slate-200 font-medium">{getServiceName()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">{labels.dateTime}</span>
                <span className="text-slate-200 font-medium tabular-nums">
                  {appointment.date} {appointment.time}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">{labels.status}</span>
                {getStatusBadge(appointment.status)}
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">{labels.assignedStaff}</span>
                <span className="text-slate-200">{staff?.full_name || '-'}</span>
              </div>
            </div>
            
            {appointment.notes && (
              <div className="pt-4">
                <p className="text-slate-400 text-sm mb-2">{labels.notes}</p>
                <p className="text-slate-300 bg-slate-800/50 p-3 rounded-sm">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              {labels.client}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-[#D4AF37]">
                      {client.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{client.full_name}</p>
                    <Link to={`/portal/clients/${client.id}`} className="text-[#D4AF37] text-sm hover:underline">
                      {language === 'es' ? 'Ver perfil' : 'View profile'}
                    </Link>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  {client.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {language === 'es' ? 'Teléfono' : 'Phone'}
                      </span>
                      <span className="text-slate-200">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {language === 'es' ? 'Correo' : 'Email'}
                      </span>
                      <span className="text-slate-200">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500">{language === 'es' ? 'Cliente no encontrado' : 'Client not found'}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
