import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, CalendarDays, FileText, TrendingUp, ArrowRight, Clock, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, servicesRes, clientsRes, staffRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/services`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/staff`)
      ]);
      setStats(statsRes.data);
      setServices(servicesRes.data);
      setClients(clientsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Unknown';
    return language === 'es' ? service.name_es : service.name_en;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'Unknown';
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member?.full_name || '-';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'status-scheduled',
      confirmed: 'status-confirmed',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      no_show: 'status-no_show',
      new: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      waiting_docs: 'bg-amber-900/50 text-amber-400 border border-amber-700',
      in_review: 'bg-purple-900/50 text-purple-400 border border-purple-700',
      submitted: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
    };
    
    const statusLabels = {
      scheduled: language === 'es' ? 'Programada' : 'Scheduled',
      confirmed: language === 'es' ? 'Confirmada' : 'Confirmed',
      completed: language === 'es' ? 'Completada' : 'Completed',
      cancelled: language === 'es' ? 'Cancelada' : 'Cancelled',
      no_show: language === 'es' ? 'No Asistio' : 'No Show',
      new: language === 'es' ? 'Nuevo' : 'New',
      waiting_docs: language === 'es' ? 'Esperando Docs' : 'Waiting Docs',
      in_review: language === 'es' ? 'En Revision' : 'In Review',
      submitted: language === 'es' ? 'Enviado' : 'Submitted',
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
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

  return (
    <div className="space-y-8 animate-fade-in-up" data-testid="dashboard-page">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 font-serif">
          {t('welcomeBack')}, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm label-uppercase">{t('totalClients')}</p>
                <p className="text-3xl font-bold text-slate-100 mt-2 tabular-nums">{stats?.total_clients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-sm flex items-center justify-center">
                <Users className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm label-uppercase">{t('activeClients')}</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2 tabular-nums">{stats?.active_clients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-900/30 rounded-sm flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm label-uppercase">{t('todayAppointments')}</p>
                <p className="text-3xl font-bold text-[#D4AF37] mt-2 tabular-nums">{stats?.today_appointments || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-sm flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm label-uppercase">{t('pendingCases')}</p>
                <p className="text-3xl font-bold text-amber-400 mt-2 tabular-nums">{stats?.pending_cases || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-900/30 rounded-sm flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-serif text-slate-100">
              {t('recentAppointments')}
            </CardTitle>
            <Link to="/portal/appointments">
              <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#B8963A]">
                {t('viewAll')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recent_appointments?.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('noResults')}</p>
            ) : (
              stats?.recent_appointments?.map((apt) => (
                <div 
                  key={apt.id} 
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-sm border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-sm flex items-center justify-center">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {getClientName(apt.client_id)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getServiceName(apt.service_id)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300 tabular-nums">{apt.date}</p>
                    <p className="text-xs text-slate-500 tabular-nums">{apt.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-serif text-slate-100">
              {t('recentCases')}
            </CardTitle>
            <Link to="/portal/cases">
              <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#B8963A]">
                {t('viewAll')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recent_cases?.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('noResults')}</p>
            ) : (
              stats?.recent_cases?.map((caseItem) => (
                <div 
                  key={caseItem.id} 
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-sm border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-sm flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {getClientName(caseItem.client_id)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getServiceName(caseItem.service_id)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(caseItem.status)}
                    <p className="text-xs text-slate-500 mt-1">
                      {getStaffName(caseItem.assigned_staff_id)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
