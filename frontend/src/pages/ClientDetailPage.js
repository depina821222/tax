import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, User, Phone, Mail, MapPin, Globe, Calendar, FileText, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientDetailPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  
  const [client, setClient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, timelineRes, servicesRes, staffRes] = await Promise.all([
        axios.get(`${API}/clients/${id}`),
        axios.get(`${API}/clients/${id}/timeline`),
        axios.get(`${API}/services`),
        axios.get(`${API}/staff`)
      ]);
      setClient(clientRes.data);
      setTimeline(timelineRes.data);
      setServices(servicesRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Unknown';
    return language === 'es' ? service.name_es : service.name_en;
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member?.full_name || '-';
  };

  const getStatusBadge = (status, type) => {
    const colors = {
      // Client statuses
      lead: 'bg-slate-700 text-slate-200',
      active: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
      completed: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      archived: 'bg-slate-800 text-slate-500',
      // Appointment statuses
      scheduled: 'bg-amber-900/50 text-amber-400 border border-amber-700',
      confirmed: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
      cancelled: 'bg-red-900/50 text-red-400 border border-red-700',
      no_show: 'bg-slate-800 text-slate-400',
      // Case statuses
      new: 'bg-blue-900/50 text-blue-400',
      waiting_docs: 'bg-amber-900/50 text-amber-400',
      in_review: 'bg-purple-900/50 text-purple-400',
      submitted: 'bg-emerald-900/50 text-emerald-400',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${colors[status] || 'bg-slate-800 text-slate-400'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{language === 'es' ? 'Cliente no encontrado' : 'Client not found'}</p>
        <Link to="/portal/clients">
          <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Volver a Clientes' : 'Back to Clients'}
          </Button>
        </Link>
      </div>
    );
  }

  const appointments = timeline.filter(item => item.type === 'appointment');
  const cases = timeline.filter(item => item.type === 'service_request');

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="client-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/portal/clients">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#D4AF37]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-serif">{client.full_name}</h1>
          <p className="text-slate-400 text-sm">
            {language === 'es' ? 'Perfil del Cliente' : 'Client Profile'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              {language === 'es' ? 'Informacion' : 'Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-[#D4AF37]">
                  {client.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-200">{client.full_name}</p>
                {getStatusBadge(client.status, 'client')}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              {client.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">{client.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-slate-300">
                  {client.preferred_language === 'es' ? 'Español' : 'English'}
                </span>
              </div>
            </div>

            {client.assigned_staff_id && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  {t('assignedTo')}
                </p>
                <p className="text-slate-300">{getStaffName(client.assigned_staff_id)}</p>
              </div>
            )}

            {client.notes && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  {t('notes')}
                </p>
                <p className="text-slate-300 text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100">
                {t('timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="bg-slate-800 mb-4">
                  <TabsTrigger value="all" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
                    {language === 'es' ? 'Todo' : 'All'}
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
                    {t('appointments')} ({appointments.length})
                  </TabsTrigger>
                  <TabsTrigger value="cases" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
                    {t('cases')} ({cases.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {timeline.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t('noResults')}</p>
                  ) : (
                    timeline.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-sm border border-slate-800"
                      >
                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                          item.type === 'appointment' ? 'bg-amber-900/30' : 'bg-blue-900/30'
                        }`}>
                          {item.type === 'appointment' ? (
                            <Calendar className="w-5 h-5 text-amber-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-200">
                              {getServiceName(item.data.service_id)}
                            </p>
                            {getStatusBadge(item.data.status)}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {item.type === 'appointment' ? (
                              <span className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {item.data.date} {item.data.time}
                              </span>
                            ) : (
                              <span>
                                {language === 'es' ? 'Caso creado: ' : 'Case created: '} 
                                {item.data.created_at?.split('T')[0]}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="appointments" className="space-y-3">
                  {appointments.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t('noResults')}</p>
                  ) : (
                    appointments.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-sm border border-slate-800"
                      >
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-amber-900/30">
                          <Calendar className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-200">
                              {getServiceName(item.data.service_id)}
                            </p>
                            {getStatusBadge(item.data.status)}
                          </div>
                          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {item.data.date} {item.data.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="cases" className="space-y-3">
                  {cases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">{t('noResults')}</p>
                  ) : (
                    cases.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-sm border border-slate-800"
                      >
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-blue-900/30">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-200">
                              {getServiceName(item.data.service_id)}
                            </p>
                            {getStatusBadge(item.data.status)}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {language === 'es' ? 'Creado: ' : 'Created: '} 
                            {item.data.created_at?.split('T')[0]}
                          </p>
                          {item.data.checklist && (
                            <p className="text-xs text-slate-500 mt-2">
                              {t('checklist')}: {item.data.checklist.filter(c => c.completed).length}/{item.data.checklist.length}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
