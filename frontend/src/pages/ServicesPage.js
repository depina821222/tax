import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, Briefcase, Clock, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ServicesPage() {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_es: '',
    description_en: '',
    description_es: '',
    duration_minutes: 60,
    required_documents: [],
    is_active: true
  });
  const [newDocument, setNewDocument] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name_en: service.name_en,
        name_es: service.name_es,
        description_en: service.description_en || '',
        description_es: service.description_es || '',
        duration_minutes: service.duration_minutes,
        required_documents: service.required_documents || [],
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name_en: '',
        name_es: '',
        description_en: '',
        description_es: '',
        duration_minutes: 60,
        required_documents: [],
        is_active: true
      });
    }
    setNewDocument('');
    setDialogOpen(true);
  };

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setFormData({
        ...formData,
        required_documents: [...formData.required_documents, newDocument.trim()]
      });
      setNewDocument('');
    }
  };

  const handleRemoveDocument = (index) => {
    setFormData({
      ...formData,
      required_documents: formData.required_documents.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(`${API}/services/${editingService.id}`, formData);
        toast.success(language === 'es' ? 'Servicio actualizado' : 'Service updated');
      } else {
        await axios.post(`${API}/services`, formData);
        toast.success(language === 'es' ? 'Servicio creado' : 'Service created');
      }
      setDialogOpen(false);
      fetchServices();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar este servicio?' : 'Delete this service?')) return;
    
    try {
      await axios.delete(`${API}/services/${id}`);
      toast.success(language === 'es' ? 'Servicio eliminado' : 'Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await axios.put(`${API}/services/${service.id}`, { is_active: !service.is_active });
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
      fetchServices();
    } catch (error) {
      toast.error('Failed to update');
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
    <div className="space-y-6 animate-fade-in-up" data-testid="services-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('services')}</h1>
        {isAdmin && (
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
            data-testid="new-service-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newService')}
          </Button>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card 
            key={service.id} 
            className={`bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors ${
              !service.is_active ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-sm flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#D4AF37]" />
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(service)}
                      className="text-slate-400 hover:text-[#D4AF37] h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service.id)}
                      className="text-slate-400 hover:text-red-400 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-slate-100 mb-1">
                {language === 'es' ? service.name_es : service.name_en}
              </h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                {language === 'es' ? service.description_es : service.description_en}
              </p>

              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.duration_minutes} {t('minutes')}
                </div>
                <div className="flex items-center gap-1">
                  <FileCheck className="w-4 h-4" />
                  {service.required_documents?.length || 0} {language === 'es' ? 'docs' : 'docs'}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <span className="text-sm text-slate-400">
                    {service.is_active 
                      ? (language === 'es' ? 'Activo' : 'Active')
                      : (language === 'es' ? 'Inactivo' : 'Inactive')
                    }
                  </span>
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => handleToggleActive(service)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{t('noResults')}</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 font-serif">
              {editingService ? (language === 'es' ? 'Editar Servicio' : 'Edit Service') : t('newService')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('serviceName')} (EN) *</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  required
                  data-testid="service-name-en"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('serviceName')} (ES) *</Label>
                <Input
                  value={formData.name_es}
                  onChange={(e) => setFormData({ ...formData, name_es: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  required
                  data-testid="service-name-es"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('description')} (EN)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="bg-slate-950 border-slate-800 h-24"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('description')} (ES)</Label>
                <Textarea
                  value={formData.description_es}
                  onChange={(e) => setFormData({ ...formData, description_es: e.target.value })}
                  className="bg-slate-950 border-slate-800 h-24"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('duration')} ({t('minutes')})</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="bg-slate-950 border-slate-800 w-32"
                min={15}
                step={15}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('requiredDocuments')}</Label>
              <div className="flex gap-2">
                <Input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  className="bg-slate-950 border-slate-800"
                  placeholder={language === 'es' ? 'Agregar documento...' : 'Add document...'}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDocument())}
                />
                <Button 
                  type="button" 
                  onClick={handleAddDocument}
                  variant="outline" 
                  className="border-slate-700 text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.required_documents.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.required_documents.map((doc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-sm"
                    >
                      <span className="text-sm text-slate-300">{doc}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-slate-400 hover:text-red-400 h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-slate-300">
                {formData.is_active 
                  ? (language === 'es' ? 'Servicio Activo' : 'Service Active')
                  : (language === 'es' ? 'Servicio Inactivo' : 'Service Inactive')
                }
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.name_en || !formData.name_es}
                data-testid="service-submit-btn"
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
