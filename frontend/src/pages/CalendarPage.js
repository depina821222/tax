import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CalendarPage() {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'week' or 'month'
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const locale = language === 'es' ? es : enUS;

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      
      const [appointmentsRes, servicesRes, clientsRes, staffRes] = await Promise.all([
        axios.get(`${API}/appointments`, {
          params: {
            date_from: format(weekStart, 'yyyy-MM-dd'),
            date_to: format(addWeeks(weekEnd, 4), 'yyyy-MM-dd')
          }
        }),
        axios.get(`${API}/services`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/staff`)
      ]);
      
      setAppointments(appointmentsRes.data);
      setServices(servicesRes.data);
      setClients(clientsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return 'Unknown';
    return language === 'es' ? service.name_es : service.name_en;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || 'Unknown';
  };

  const getAppointmentsForDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return appointments
      .filter(apt => apt.date === dateStr && apt.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-amber-900/50 border-amber-700 text-amber-300',
      confirmed: 'bg-emerald-900/50 border-emerald-700 text-emerald-300',
      completed: 'bg-blue-900/50 border-blue-700 text-blue-300',
      cancelled: 'bg-red-900/50 border-red-700 text-red-300',
      no_show: 'bg-slate-800 border-slate-700 text-slate-400',
    };
    return colors[status] || 'bg-slate-800 border-slate-700 text-slate-400';
  };

  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="calendar-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('calendar')}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {format(currentDate, 'MMMM yyyy', { locale })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-slate-700 text-[#D4AF37]' : 'text-slate-400'}
            >
              {language === 'es' ? 'Semana' : 'Week'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-slate-700 text-[#D4AF37]' : 'text-slate-400'}
            >
              {language === 'es' ? 'Mes' : 'Month'}
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(prev => view === 'week' ? subWeeks(prev, 1) : new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {language === 'es' ? 'Hoy' : 'Today'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(prev => view === 'week' ? addWeeks(prev, 1) : new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-[#D4AF37]">{t('loading')}</div>
        </div>
      ) : view === 'month' ? (
        /* Month View */
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentDate}
              onMonthChange={setCurrentDate}
              locale={locale}
              className="text-slate-300"
              modifiers={{
                hasAppointment: (day) => getAppointmentsForDay(day).length > 0
              }}
              modifiersStyles={{
                hasAppointment: { 
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  borderRadius: '2px'
                }
              }}
            />
            
            {/* Selected Day Appointments */}
            <div className="mt-6 border-t border-slate-800 pt-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4">
                {format(selectedDate, 'EEEE, MMMM d', { locale })}
              </h3>
              <div className="space-y-2">
                {getAppointmentsForDay(selectedDate).length === 0 ? (
                  <p className="text-slate-500 text-sm">{t('noResults')}</p>
                ) : (
                  getAppointmentsForDay(selectedDate).map((apt) => (
                    <div 
                      key={apt.id}
                      className={`p-3 rounded-sm border ${getStatusColor(apt.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getClientName(apt.client_id)}</p>
                          <p className="text-sm opacity-75">{getServiceName(apt.service_id)}</p>
                        </div>
                        <span className="text-sm tabular-nums">{apt.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Week View */
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 border-b border-slate-800">
                  <div className="p-4 text-xs text-slate-500 label-uppercase">
                    {language === 'es' ? 'Hora' : 'Time'}
                  </div>
                  {weekDays.map((day) => (
                    <div 
                      key={day.toISOString()} 
                      className={`p-4 text-center border-l border-slate-800 ${
                        isSameDay(day, new Date()) ? 'bg-[#D4AF37]/10' : ''
                      }`}
                    >
                      <p className="text-xs text-slate-500 uppercase">
                        {format(day, 'EEE', { locale })}
                      </p>
                      <p className={`text-lg font-medium ${
                        isSameDay(day, new Date()) ? 'text-[#D4AF37]' : 'text-slate-300'
                      }`}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Time Slots */}
                <div className="max-h-[600px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b border-slate-800/50">
                      <div className="p-2 text-xs text-slate-500 tabular-nums">
                        {time}
                      </div>
                      {weekDays.map((day) => {
                        const dayAppointments = getAppointmentsForDay(day).filter(
                          apt => apt.time === time
                        );
                        return (
                          <div 
                            key={`${day.toISOString()}-${time}`}
                            className={`p-1 min-h-[60px] border-l border-slate-800/50 ${
                              isSameDay(day, new Date()) ? 'bg-[#D4AF37]/5' : ''
                            }`}
                          >
                            {dayAppointments.map((apt) => (
                              <div 
                                key={apt.id}
                                className={`p-2 rounded-sm text-xs border ${getStatusColor(apt.status)} mb-1`}
                              >
                                <p className="font-medium truncate">{getClientName(apt.client_id)}</p>
                                <p className="opacity-75 truncate">{getServiceName(apt.service_id)}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
