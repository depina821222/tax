import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, User, FileText, Download, Clock, CheckSquare, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Bilingual labels
const LABELS = {
  en: {
    caseDetails: 'Case Details',
    serviceRequest: 'Service Request',
    caseStatus: 'Case Status',
    stage: 'Stage',
    priority: 'Priority',
    dueDate: 'Due Date',
    documentChecklist: 'Document Checklist',
    missingDocuments: 'Missing Documents',
    notesActivity: 'Notes & Activity',
    downloadPdf: 'Download Case Summary (PDF)',
    backToCases: 'Back to Cases',
    notFound: 'Case not found',
    loading: 'Loading...',
    client: 'Client',
    service: 'Service',
    assignedTo: 'Assigned To',
    completed: 'Completed',
    pending: 'Pending',
    upcomingAppointment: 'Upcoming Appointment',
  },
  es: {
    caseDetails: 'Detalles del Caso',
    serviceRequest: 'Solicitud de Servicio',
    caseStatus: 'Estado del Caso',
    stage: 'Etapa',
    priority: 'Prioridad',
    dueDate: 'Fecha Límite',
    documentChecklist: 'Lista de Documentos',
    missingDocuments: 'Documentos Pendientes',
    notesActivity: 'Notas y Actividad',
    downloadPdf: 'Descargar Resumen del Caso (PDF)',
    backToCases: 'Volver a Casos',
    notFound: 'Caso no encontrado',
    loading: 'Cargando...',
    client: 'Cliente',
    service: 'Servicio',
    assignedTo: 'Asignado a',
    completed: 'Completado',
    pending: 'Pendiente',
    upcomingAppointment: 'Próxima Cita',
  }
};

const STATUS_LABELS = {
  en: {
    new: 'New',
    waiting_docs: 'Waiting Docs',
    in_review: 'In Review',
    submitted: 'Submitted',
    completed: 'Completed',
  },
  es: {
    new: 'Nuevo',
    waiting_docs: 'Esperando Docs',
    in_review: 'En Revisión',
    submitted: 'Enviado',
    completed: 'Completado',
  }
};

const PRIORITY_LABELS = {
  en: { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' },
  es: { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }
};

export default function CaseDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.en;
  const statusLabels = STATUS_LABELS[language] || STATUS_LABELS.en;
  const priorityLabels = PRIORITY_LABELS[language] || PRIORITY_LABELS.en;
  
  const [caseData, setCaseData] = useState(null);
  const [client, setClient] = useState(null);
  const [service, setService] = useState(null);
  const [staff, setStaff] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [casesRes, clientsRes, servicesRes, staffRes, appointmentsRes] = await Promise.all([
        axios.get(`${API}/cases`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/services`),
        axios.get(`${API}/staff`),
        axios.get(`${API}/appointments`)
      ]);
      
      const foundCase = casesRes.data.find(c => c.id === id);
      if (foundCase) {
        setCaseData(foundCase);
        const foundClient = clientsRes.data.find(c => c.id === foundCase.client_id);
        setClient(foundClient);
        setService(servicesRes.data.find(s => s.id === foundCase.service_id));
        if (foundCase.assigned_staff_id) {
          setStaff(staffRes.data.find(s => s.id === foundCase.assigned_staff_id));
        }
        
        // Find upcoming appointment for this client
        if (foundClient) {
          const today = new Date().toISOString().split('T')[0];
          const upcoming = appointmentsRes.data.find(
            apt => apt.client_id === foundClient.id && 
                   apt.date >= today && 
                   !['cancelled', 'no_show'].includes(apt.status)
          );
          setNextAppointment(upcoming);
        }
      }
    } catch (error) {
      console.error('Failed to fetch case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(`${API}/pdf/case/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_summary_${id.slice(0, 8)}.pdf`);
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
      new: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      waiting_docs: 'bg-amber-900/50 text-amber-400 border border-amber-700',
      in_review: 'bg-purple-900/50 text-purple-400 border border-purple-700',
      submitted: 'bg-cyan-900/50 text-cyan-400 border border-cyan-700',
      completed: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: 'bg-slate-800 text-slate-400',
      normal: 'bg-blue-900/50 text-blue-400',
      high: 'bg-amber-900/50 text-amber-400',
      urgent: 'bg-red-900/50 text-red-400',
    };
    
    return (
      <span className={`px-3 py-1 text-sm rounded-sm ${priorityClasses[priority] || ''}`}>
        {priorityLabels[priority] || priority}
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

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{labels.notFound}</p>
        <Link to="/portal/cases">
          <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToCases}
          </Button>
        </Link>
      </div>
    );
  }

  const checklist = caseData.checklist || [];
  const completedCount = checklist.filter(item => item.completed).length;
  const missingDocs = checklist.filter(item => !item.completed);

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="case-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/portal/cases">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#D4AF37]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 font-serif">{labels.caseDetails}</h1>
            <p className="text-slate-400 text-sm">ID: {id.slice(0, 8)}...</p>
          </div>
        </div>
        <Button 
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
          data-testid="download-case-pdf-btn"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloading ? (language === 'es' ? 'Descargando...' : 'Downloading...') : labels.downloadPdf}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                {labels.serviceRequest}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="py-2 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{labels.service}</span>
                    <p className="text-slate-200 font-medium mt-1">{getServiceName()}</p>
                  </div>
                  <div className="py-2 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{labels.caseStatus}</span>
                    <p className="mt-1">{getStatusBadge(caseData.status)}</p>
                  </div>
                  <div className="py-2 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{labels.priority}</span>
                    <p className="mt-1">{getPriorityBadge(caseData.priority)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="py-2 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{labels.assignedTo}</span>
                    <p className="text-slate-200 font-medium mt-1">{staff?.full_name || '-'}</p>
                  </div>
                  <div className="py-2 border-b border-slate-800">
                    <span className="text-slate-400 text-sm">{labels.dueDate}</span>
                    <p className="text-slate-200 font-medium mt-1 tabular-nums">{caseData.due_date || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Checklist */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
                {labels.documentChecklist}
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({completedCount}/{checklist.length} {labels.completed.toLowerCase()})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-slate-500">{language === 'es' ? 'Sin documentos requeridos' : 'No documents required'}</p>
              ) : (
                <div className="space-y-3">
                  {checklist.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-sm ${
                        item.completed ? 'bg-emerald-900/20' : 'bg-amber-900/20'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed}
                        disabled
                        className="border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <span className={`flex-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {item.item}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.completed 
                          ? 'bg-emerald-900/50 text-emerald-400' 
                          : 'bg-amber-900/50 text-amber-400'
                      }`}>
                        {item.completed ? labels.completed : labels.pending}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Documents Warning */}
          {missingDocs.length > 0 && (
            <Card className="bg-amber-900/20 border-amber-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {labels.missingDocuments}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {missingDocs.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {item.item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {caseData.notes && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-slate-100">
                  {labels.notesActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{caseData.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
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
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{language === 'es' ? 'Teléfono' : 'Phone'}</span>
                        <span className="text-slate-200">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{language === 'es' ? 'Correo' : 'Email'}</span>
                        <span className="text-slate-200 truncate max-w-[150px]">{client.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{language === 'es' ? 'Idioma' : 'Language'}</span>
                      <span className="text-slate-200">{client.preferred_language === 'es' ? 'Español' : 'English'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">{language === 'es' ? 'Cliente no encontrado' : 'Client not found'}</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointment */}
          {nextAppointment && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  {labels.upcomingAppointment}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{language === 'es' ? 'Fecha' : 'Date'}</span>
                    <span className="text-slate-200 tabular-nums">{nextAppointment.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{language === 'es' ? 'Hora' : 'Time'}</span>
                    <span className="text-slate-200 tabular-nums">{nextAppointment.time}</span>
                  </div>
                </div>
                <Link to={`/portal/appointments/${nextAppointment.id}`}>
                  <Button variant="outline" className="w-full mt-4 border-slate-700 text-slate-300 hover:text-[#D4AF37]">
                    {language === 'es' ? 'Ver cita' : 'View appointment'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
