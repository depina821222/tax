import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, 
  Briefcase, 
  Clock, 
  FileCheck, 
  ListChecks, 
  Download, 
  Plus,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Bilingual labels
const LABELS = {
  en: {
    serviceDetails: 'Service Details',
    overview: 'Overview',
    description: 'Description',
    duration: 'Duration',
    minutes: 'minutes',
    requiredDocuments: 'Required Documents',
    workflowStages: 'Workflow Stages',
    createServiceRequest: 'Create Service Request',
    downloadPdf: 'Download Service Summary (PDF)',
    pdfNotEnabled: 'PDF not enabled yet',
    backToServices: 'Back to Services',
    notFound: 'Service not found',
    loading: 'Loading...',
    active: 'Active',
    inactive: 'Inactive',
    noDocuments: 'No required documents',
    stages: {
      new: 'New',
      waiting_docs: 'Waiting Docs',
      in_review: 'In Review',
      submitted: 'Submitted',
      completed: 'Completed'
    }
  },
  es: {
    serviceDetails: 'Detalles del Servicio',
    overview: 'Resumen',
    description: 'Descripción',
    duration: 'Duración',
    minutes: 'minutos',
    requiredDocuments: 'Documentos Requeridos',
    workflowStages: 'Etapas del Proceso',
    createServiceRequest: 'Crear Solicitud de Servicio',
    downloadPdf: 'Descargar Resumen del Servicio (PDF)',
    pdfNotEnabled: 'PDF no habilitado aún',
    backToServices: 'Volver a Servicios',
    notFound: 'Servicio no encontrado',
    loading: 'Cargando...',
    active: 'Activo',
    inactive: 'Inactivo',
    noDocuments: 'Sin documentos requeridos',
    stages: {
      new: 'Nuevo',
      waiting_docs: 'Esperando Docs',
      in_review: 'En Revisión',
      submitted: 'Enviado',
      completed: 'Completado'
    }
  }
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const labels = LABELS[language] || LABELS.en;
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      const foundService = response.data.find(s => s.id === id);
      setService(foundService);
    } catch (error) {
      console.error('Failed to fetch service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    // Navigate to cases page with service pre-selected
    navigate('/portal/cases', { state: { preselectedServiceId: id } });
    toast.info(language === 'es' ? 'Seleccione un cliente para crear la solicitud' : 'Select a client to create the request');
  };

  const handleDownloadPDF = () => {
    toast.info(labels.pdfNotEnabled);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">{labels.loading}</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{labels.notFound}</p>
        <Link to="/portal/services">
          <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {labels.backToServices}
          </Button>
        </Link>
      </div>
    );
  }

  const serviceName = language === 'es' ? service.name_es : service.name_en;
  const serviceDesc = language === 'es' ? service.description_es : service.description_en;
  const workflowStages = service.workflow_stages || ['new', 'waiting_docs', 'in_review', 'submitted', 'completed'];

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="service-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/portal/services">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 font-serif">{serviceName}</h1>
            <p className="text-slate-400 text-sm">{labels.serviceDetails}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
            className="border-slate-700 text-slate-300 hover:border-[#D4AF37] hover:text-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50"
            data-testid="download-service-pdf-btn"
            title={labels.pdfNotEnabled}
          >
            <Download className="w-4 h-4 mr-2" />
            {labels.downloadPdf}
          </Button>
          <Button 
            onClick={handleCreateRequest}
            className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] focus:ring-2 focus:ring-[#D4AF37]/50"
            data-testid="create-service-request-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {labels.createServiceRequest}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                {labels.overview}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Icon and Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-sm flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{serviceName}</h2>
                  <span className={`px-2 py-1 text-xs rounded-sm ${
                    service.is_active 
                      ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {service.is_active ? labels.active : labels.inactive}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
                  {labels.description}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {serviceDesc || (language === 'es' ? 'Sin descripción' : 'No description')}
                </p>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-sm">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-sm flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{labels.duration}</p>
                  <p className="text-lg font-semibold text-slate-200 tabular-nums">
                    {service.duration_minutes} {labels.minutes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Documents Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#D4AF37]" />
                {labels.requiredDocuments}
                <span className="text-sm font-normal text-slate-400 ml-2">
                  ({service.required_documents?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!service.required_documents || service.required_documents.length === 0 ? (
                <p className="text-slate-500">{labels.noDocuments}</p>
              ) : (
                <div className="space-y-2">
                  {service.required_documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-sm"
                    >
                      <div className="w-8 h-8 bg-slate-700 rounded-sm flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-400">{index + 1}</span>
                      </div>
                      <span className="text-slate-200">{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Stages Card */}
        <div>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-[#D4AF37]" />
                {labels.workflowStages}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowStages.map((stage, index) => (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-[#D4AF37]/20' : 'bg-slate-800'
                      }`}>
                        {index === workflowStages.length - 1 ? (
                          <CheckCircle className={`w-4 h-4 ${
                            index === 0 ? 'text-[#D4AF37]' : 'text-slate-500'
                          }`} />
                        ) : (
                          <span className={`text-sm font-medium ${
                            index === 0 ? 'text-[#D4AF37]' : 'text-slate-500'
                          }`}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      {index < workflowStages.length - 1 && (
                        <div className="absolute left-1/2 top-8 w-0.5 h-4 bg-slate-800 -translate-x-1/2" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      index === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'
                    }`}>
                      {labels.stages[stage] || stage}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-900/50 border-slate-800 mt-6">
            <CardContent className="p-4">
              <Button 
                onClick={handleCreateRequest}
                className="w-full bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
              >
                <Plus className="w-4 h-4 mr-2" />
                {labels.createServiceRequest}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
