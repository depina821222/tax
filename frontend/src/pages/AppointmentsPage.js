import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AppointmentsPage() {
  const { language, t } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    assigned_staff_id: '',
    date: '',
    time: '',
    status: 'scheduled',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, servicesRes, clientsRes, staffRes] = await Promise.all([
        axios.get(`${API}/appointments`),
        axios.get(`${API}/services`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/staff`)
      ]);
      
      setAppointments(appointmentsRes.data);
      setServices(servicesRes.data);
      setClients(clientsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    try {
      const response = await axios.get(`${API}/appointments/available-slots/${date}`, {
        params: { service_id: formData.service_id }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setAvailableSlots([]);
    }
  };

  useEffect(() => {
    if (formData.date) {
      fetchAvailableSlots(formData.date);
    }
  }, [formData.date, formData.service_id]);

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
    };
    
    const statusLabels = {
      scheduled: t('scheduled'),
      confirmed: t('confirmed'),
      completed: t('completed'),
      cancelled: t('cancelled'),
      no_show: t('noShow'),
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = getClientName(apt.client_id).toLowerCase().includes(search.toLowerCase()) ||
                          getServiceName(apt.service_id).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        client_id: appointment.client_id,
        service_id: appointment.service_id,
        assigned_staff_id: appointment.assigned_staff_id || '',
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        notes: appointment.notes || ''
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        client_id: '',
        service_id: '',
        assigned_staff_id: '',
        date: '',
        time: '',
        status: 'scheduled',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const service = services.find(s => s.id === formData.service_id);
      const payload = {
        ...formData,
        duration_minutes: service?.duration_minutes || 60
      };

      if (editingAppointment) {
        await axios.put(`${API}/appointments/${editingAppointment.id}`, payload);
        toast.success(language === 'es' ? 'Cita actualizada' : 'Appointment updated');
      } else {
        await axios.post(`${API}/appointments`, payload);
        toast.success(language === 'es' ? 'Cita creada' : 'Appointment created');
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar esta cita?' : 'Delete this appointment?')) return;
    
    try {
      await axios.delete(`${API}/appointments/${id}`);
      toast.success(language === 'es' ? 'Cita eliminada' : 'Appointment deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/appointments/${id}`, { status: newStatus });
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="appointments-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('appointments')}</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
          data-testid="new-appointment-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newAppointment')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-950 border-slate-800 focus:border-[#D4AF37]"
                data-testid="appointments-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-950 border-slate-800" data-testid="status-filter">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
                <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                <SelectItem value="no_show">{t('noShow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">{t('client')}</TableHead>
                <TableHead className="text-slate-400">{t('service')}</TableHead>
                <TableHead className="text-slate-400">{t('date')}</TableHead>
                <TableHead className="text-slate-400">{t('time')}</TableHead>
                <TableHead className="text-slate-400">{t('assignedTo')}</TableHead>
                <TableHead className="text-slate-400">{t('status')}</TableHead>
                <TableHead className="text-slate-400 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((apt) => (
                  <TableRow key={apt.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-200 font-medium">
                      {getClientName(apt.client_id)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {getServiceName(apt.service_id)}
                    </TableCell>
                    <TableCell className="text-slate-300 tabular-nums">
                      {apt.date}
                    </TableCell>
                    <TableCell className="text-slate-300 tabular-nums">
                      {apt.time}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {getStaffName(apt.assigned_staff_id)}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={apt.status} 
                        onValueChange={(value) => handleStatusChange(apt.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8 bg-transparent border-0 p-0">
                          {getStatusBadge(apt.status)}
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                          <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                          <SelectItem value="completed">{t('completed')}</SelectItem>
                          <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                          <SelectItem value="no_show">{t('noShow')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(apt)}
                        className="text-slate-400 hover:text-[#D4AF37]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(apt.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100 font-serif">
              {editingAppointment ? (language === 'es' ? 'Editar Cita' : 'Edit Appointment') : t('newAppointment')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t('client')}</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800" data-testid="apt-client-select">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar cliente' : 'Select client'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('service')}</Label>
              <Select 
                value={formData.service_id} 
                onValueChange={(value) => setFormData({ ...formData, service_id: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800" data-testid="apt-service-select">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar servicio' : 'Select service'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {services.filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {language === 'es' ? service.name_es : service.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('date')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-slate-950 border-slate-800 text-slate-300"
                      data-testid="apt-date-picker"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formData.date || (language === 'es' ? 'Seleccionar' : 'Select')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      locale={locale}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t('time')}</Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(value) => setFormData({ ...formData, time: value })}
                  disabled={!formData.date}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800" data-testid="apt-time-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 max-h-60">
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('assignedTo')}</Label>
              <Select 
                value={formData.assigned_staff_id} 
                onValueChange={(value) => setFormData({ ...formData, assigned_staff_id: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar (opcional)' : 'Select (optional)'} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingAppointment && (
              <div className="space-y-2">
                <Label className="text-slate-300">{t('status')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                    <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                    <SelectItem value="no_show">{t('noShow')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">{t('notes')}</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-950 border-slate-800"
                placeholder={language === 'es' ? 'Notas opcionales' : 'Optional notes'}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.client_id || !formData.service_id || !formData.date || !formData.time}
                data-testid="apt-submit-btn"
              >
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
