import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Edit, Trash2, Mail, MessageSquare, Code } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TemplatesPage() {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject_en: '',
    subject_es: '',
    body_en: '',
    body_es: '',
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateLabel = (name) => {
    const labels = {
      booking_confirmation: language === 'es' ? 'Confirmacion de Reserva' : 'Booking Confirmation',
      reminder_48h: language === 'es' ? 'Recordatorio 48h' : '48-hour Reminder',
      missing_docs: language === 'es' ? 'Documentos Faltantes' : 'Missing Documents',
      case_completed: language === 'es' ? 'Caso Completado' : 'Case Completed'
    };
    return labels[name] || name;
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        subject_en: template.subject_en || '',
        subject_es: template.subject_es || '',
        body_en: template.body_en,
        body_es: template.body_es,
        is_active: template.is_active
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'email',
        subject_en: '',
        subject_es: '',
        body_en: '',
        body_es: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await axios.put(`${API}/templates/${editingTemplate.id}`, formData);
        toast.success(language === 'es' ? 'Plantilla actualizada' : 'Template updated');
      } else {
        await axios.post(`${API}/templates`, formData);
        toast.success(language === 'es' ? 'Plantilla creada' : 'Template created');
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar esta plantilla?' : 'Delete this template?')) return;
    
    try {
      await axios.delete(`${API}/templates/${id}`);
      toast.success(language === 'es' ? 'Plantilla eliminada' : 'Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const emailTemplates = templates.filter(t => t.type === 'email');
  const smsTemplates = templates.filter(t => t.type === 'sms');

  const availableVariables = [
    '{client_name}',
    '{service}',
    '{date}',
    '{time}',
    '{office_address}',
    '{phone}',
    '{missing_documents}'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="templates-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('templates')}</h1>
        {isAdmin && (
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
            data-testid="new-template-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('newTemplate')}
          </Button>
        )}
      </div>

      {/* Available Variables */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm text-slate-400">{t('variables')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableVariables.map((v) => (
              <code key={v} className="px-2 py-1 bg-slate-800 rounded-sm text-xs text-[#D4AF37]">
                {v}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates by Type */}
      <Tabs defaultValue="email">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="email" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Mail className="w-4 h-4 mr-2" />
            Email ({emailTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS ({smsTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emailTemplates.map((template) => (
              <Card key={template.id} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900/30 rounded-sm flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200">
                          {getTemplateLabel(template.name)}
                        </h3>
                        <p className="text-xs text-slate-500">{template.name}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(template)}
                          className="text-slate-400 hover:text-[#D4AF37] h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                          className="text-slate-400 hover:text-red-400 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Subject (EN)</p>
                      <p className="text-sm text-slate-300 truncate">{template.subject_en}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Subject (ES)</p>
                      <p className="text-sm text-slate-300 truncate">{template.subject_es}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {smsTemplates.length === 0 ? (
              <p className="text-slate-500 col-span-2 text-center py-8">{t('noResults')}</p>
            ) : (
              smsTemplates.map((template) => (
                <Card key={template.id} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-900/30 rounded-sm flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-200">
                            {getTemplateLabel(template.name)}
                          </h3>
                          <p className="text-xs text-slate-500">{template.name}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(template)}
                            className="text-slate-400 hover:text-[#D4AF37] h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Body (EN)</p>
                        <p className="text-sm text-slate-300 line-clamp-2">{template.body_en}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100 font-serif">
              {editingTemplate ? (language === 'es' ? 'Editar Plantilla' : 'Edit Template') : t('newTemplate')}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('templateName')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  required
                  placeholder="e.g., booking_confirmation"
                  data-testid="template-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('templateType')}</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t('subject')} (EN)</Label>
                  <Input
                    value={formData.subject_en}
                    onChange={(e) => setFormData({ ...formData, subject_en: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="template-subject-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">{t('subject')} (ES)</Label>
                  <Input
                    value={formData.subject_es}
                    onChange={(e) => setFormData({ ...formData, subject_es: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="template-subject-es"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('body')} (EN) *</Label>
                <Textarea
                  value={formData.body_en}
                  onChange={(e) => setFormData({ ...formData, body_en: e.target.value })}
                  className="bg-slate-950 border-slate-800 h-40 font-mono text-sm"
                  required
                  data-testid="template-body-en"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('body')} (ES) *</Label>
                <Textarea
                  value={formData.body_es}
                  onChange={(e) => setFormData({ ...formData, body_es: e.target.value })}
                  className="bg-slate-950 border-slate-800 h-40 font-mono text-sm"
                  required
                  data-testid="template-body-es"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-sm">
              <p className="text-xs text-slate-400 mb-2">{t('variables')}:</p>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((v) => (
                  <code key={v} className="px-2 py-1 bg-slate-900 rounded-sm text-xs text-[#D4AF37] cursor-pointer hover:bg-slate-700"
                    onClick={() => {
                      navigator.clipboard.writeText(v);
                      toast.success('Copied!');
                    }}
                  >
                    {v}
                  </code>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.name || !formData.body_en || !formData.body_es}
                data-testid="template-submit-btn"
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
