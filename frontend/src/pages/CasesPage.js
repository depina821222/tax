import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Plus, Search, Calendar as CalendarIcon, Edit, Trash2, FileText, AlertCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CasesPage() {
  const { language, t } = useLanguage();
  const locale = language === 'es' ? es : enUS;
  
  const [cases, setCases] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    assigned_staff_id: '',
    status: 'new',
    priority: 'normal',
    due_date: '',
    notes: '',
    checklist: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [casesRes, servicesRes, clientsRes, staffRes] = await Promise.all([
        axios.get(`${API}/cases`),
        axios.get(`${API}/services`),
        axios.get(`${API}/clients`),
        axios.get(`${API}/staff`)
      ]);
      
      setCases(casesRes.data);
      setServices(servicesRes.data);
      setClients(clientsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
      new: 'bg-blue-900/50 text-blue-400 border border-blue-700',
      waiting_docs: 'bg-amber-900/50 text-amber-400 border border-amber-700',
      in_review: 'bg-purple-900/50 text-purple-400 border border-purple-700',
      submitted: 'bg-cyan-900/50 text-cyan-400 border border-cyan-700',
      completed: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700',
    };
    
    const statusLabels = {
      new: t('new'),
      waiting_docs: t('waitingDocs'),
      in_review: t('inReview'),
      submitted: t('submitted'),
      completed: t('completed'),
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: 'priority-low',
      normal: 'priority-normal',
      high: 'priority-high',
      urgent: 'priority-urgent',
    };
    
    const priorityLabels = {
      low: t('low'),
      normal: t('normal'),
      high: t('high'),
      urgent: t('urgent'),
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${priorityClasses[priority] || ''}`}>
        {priorityLabels[priority] || priority}
      </span>
    );
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = getClientName(c.client_id).toLowerCase().includes(search.toLowerCase()) ||
                          getServiceName(c.service_id).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (caseItem = null) => {
    if (caseItem) {
      setEditingCase(caseItem);
      setFormData({
        client_id: caseItem.client_id,
        service_id: caseItem.service_id,
        assigned_staff_id: caseItem.assigned_staff_id || '',
        status: caseItem.status,
        priority: caseItem.priority,
        due_date: caseItem.due_date || '',
        notes: caseItem.notes || '',
        checklist: caseItem.checklist || []
      });
    } else {
      setEditingCase(null);
      setFormData({
        client_id: '',
        service_id: '',
        assigned_staff_id: '',
        status: 'new',
        priority: 'normal',
        due_date: '',
        notes: '',
        checklist: []
      });
    }
    setDialogOpen(true);
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    const checklist = service?.required_documents?.map(doc => ({ item: doc, completed: false })) || [];
    setFormData({ ...formData, service_id: serviceId, checklist });
  };

  const handleChecklistToggle = (index) => {
    const newChecklist = [...formData.checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setFormData({ ...formData, checklist: newChecklist });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCase) {
        await axios.put(`${API}/cases/${editingCase.id}`, formData);
        toast.success(language === 'es' ? 'Caso actualizado' : 'Case updated');
      } else {
        await axios.post(`${API}/cases`, formData);
        toast.success(language === 'es' ? 'Caso creado' : 'Case created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar este caso?' : 'Delete this case?')) return;
    
    try {
      await axios.delete(`${API}/cases/${id}`);
      toast.success(language === 'es' ? 'Caso eliminado' : 'Case deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleSendFollowUp = async (caseId) => {
    try {
      await axios.post(`${API}/cases/${caseId}/send-missing-docs`);
      toast.success(language === 'es' ? 'Seguimiento enviado' : 'Follow-up sent');
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to send';
      toast.error(message);
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
    <div className="space-y-6 animate-fade-in-up" data-testid="cases-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('cases')}</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
          data-testid="new-case-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newCase')}
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
                data-testid="cases-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-950 border-slate-800">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
                <SelectItem value="new">{t('new')}</SelectItem>
                <SelectItem value="waiting_docs">{t('waitingDocs')}</SelectItem>
                <SelectItem value="in_review">{t('inReview')}</SelectItem>
                <SelectItem value="submitted">{t('submitted')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">{t('client')}</TableHead>
                <TableHead className="text-slate-400">{t('service')}</TableHead>
                <TableHead className="text-slate-400">{t('status')}</TableHead>
                <TableHead className="text-slate-400">{t('priority')}</TableHead>
                <TableHead className="text-slate-400">{t('checklist')}</TableHead>
                <TableHead className="text-slate-400">{t('assignedTo')}</TableHead>
                <TableHead className="text-slate-400 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        {caseItem.missing_docs_flag && (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                        {getClientName(caseItem.client_id)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {getServiceName(caseItem.service_id)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(caseItem.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(caseItem.priority)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {caseItem.checklist?.filter(c => c.completed).length || 0}/{caseItem.checklist?.length || 0}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {getStaffName(caseItem.assigned_staff_id)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendFollowUp(caseItem.id)}
                        className="text-slate-400 hover:text-[#D4AF37]"
                        title={t('sendFollowUp')}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(caseItem)}
                        className="text-slate-400 hover:text-[#D4AF37]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(caseItem.id)}
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
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 font-serif">
              {editingCase ? (language === 'es' ? 'Editar Caso' : 'Edit Case') : t('newCase')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('client')} *</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
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
                <Label className="text-slate-300">{t('service')} *</Label>
                <Select 
                  value={formData.service_id} 
                  onValueChange={handleServiceChange}
                  disabled={!!editingCase}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
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
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                    <SelectItem value="new">{t('new')}</SelectItem>
                    <SelectItem value="waiting_docs">{t('waitingDocs')}</SelectItem>
                    <SelectItem value="in_review">{t('inReview')}</SelectItem>
                    <SelectItem value="submitted">{t('submitted')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t('priority')}</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="low">{t('low')}</SelectItem>
                    <SelectItem value="normal">{t('normal')}</SelectItem>
                    <SelectItem value="high">{t('high')}</SelectItem>
                    <SelectItem value="urgent">{t('urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t('dueDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-slate-950 border-slate-800 text-slate-300"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formData.due_date || (language === 'es' ? 'Seleccionar' : 'Select')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                    <Calendar
                      mode="single"
                      selected={formData.due_date ? new Date(formData.due_date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, due_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('assignedTo')}</Label>
              <Select 
                value={formData.assigned_staff_id} 
                onValueChange={(value) => setFormData({ ...formData, assigned_staff_id: value })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
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

            {formData.checklist.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300">{t('checklist')}</Label>
                <div className="space-y-2 p-4 bg-slate-800/50 rounded-sm">
                  {formData.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleChecklistToggle(index)}
                        className="border-slate-600 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                      />
                      <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">{t('notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-950 border-slate-800 h-24"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.client_id || !formData.service_id}
                data-testid="case-submit-btn"
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
