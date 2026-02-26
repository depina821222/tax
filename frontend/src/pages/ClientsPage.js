import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, User, Phone, Mail, Edit, Trash2, Eye, Globe } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientsPage() {
  const { language, t } = useLanguage();
  
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    preferred_language: 'en',
    status: 'lead',
    assigned_staff_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, staffRes] = await Promise.all([
        axios.get(`${API}/clients`),
        axios.get(`${API}/staff`)
      ]);
      setClients(clientsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member?.full_name || '-';
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      lead: 'status-lead',
      active: 'status-active',
      completed: 'status-completed',
      archived: 'status-archived',
    };
    
    const statusLabels = {
      lead: t('lead'),
      active: t('active'),
      completed: t('completed'),
      archived: t('archived'),
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-sm ${statusClasses[status] || 'bg-slate-800 text-slate-400'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          client.email.toLowerCase().includes(search.toLowerCase()) ||
                          client.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        full_name: client.full_name,
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || '',
        preferred_language: client.preferred_language || 'en',
        status: client.status || 'lead',
        assigned_staff_id: client.assigned_staff_id || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        preferred_language: 'en',
        status: 'lead',
        assigned_staff_id: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await axios.put(`${API}/clients/${editingClient.id}`, formData);
        toast.success(language === 'es' ? 'Cliente actualizado' : 'Client updated');
      } else {
        await axios.post(`${API}/clients`, formData);
        toast.success(language === 'es' ? 'Cliente creado' : 'Client created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar este cliente?' : 'Delete this client?')) return;
    
    try {
      await axios.delete(`${API}/clients/${id}`);
      toast.success(language === 'es' ? 'Cliente eliminado' : 'Client deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
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
    <div className="space-y-6 animate-fade-in-up" data-testid="clients-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('clients')}</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
          data-testid="new-client-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newClient')}
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
                data-testid="clients-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-950 border-slate-800" data-testid="client-status-filter">
                <SelectValue placeholder={t('clientStatus')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
                <SelectItem value="lead">{t('lead')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="archived">{t('archived')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">{t('fullName')}</TableHead>
                <TableHead className="text-slate-400">{t('phone')}</TableHead>
                <TableHead className="text-slate-400">{t('email')}</TableHead>
                <TableHead className="text-slate-400">{t('preferredLanguage')}</TableHead>
                <TableHead className="text-slate-400">{t('clientStatus')}</TableHead>
                <TableHead className="text-slate-400">{t('assignedTo')}</TableHead>
                <TableHead className="text-slate-400 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-200 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        {client.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {client.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {client.email || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-slate-500" />
                        {client.preferred_language === 'es' ? 'Español' : 'English'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {getStaffName(client.assigned_staff_id)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/portal/clients/${client.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-[#D4AF37]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(client)}
                        className="text-slate-400 hover:text-[#D4AF37]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
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
              {editingClient ? (language === 'es' ? 'Editar Cliente' : 'Edit Client') : t('newClient')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t('fullName')} *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-950 border-slate-800"
                required
                data-testid="client-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('phone')}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  data-testid="client-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  data-testid="client-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('address')}</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-slate-950 border-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('preferredLanguage')}</Label>
                <Select 
                  value={formData.preferred_language} 
                  onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('clientStatus')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="lead">{t('lead')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="archived">{t('archived')}</SelectItem>
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

            <div className="space-y-2">
              <Label className="text-slate-300">{t('notes')}</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-950 border-slate-800"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.full_name}
                data-testid="client-submit-btn"
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
