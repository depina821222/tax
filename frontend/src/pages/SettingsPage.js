import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Building, Clock, Mail, Phone, MapPin, Bell, MessageSquare, Globe } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SettingsPage() {
  const { language, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    business_name: '',
    business_name_es: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    business_hours_start: '09:00',
    business_hours_end: '17:00',
    blocked_dates: [],
    enable_reminders: true,
    enable_sms: false,
    immigration_services_enabled: false,
    timezone: 'America/New_York'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success(language === 'es' ? 'Configuracion guardada' : 'Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in-up max-w-4xl" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('settings')}</h1>
        <Button 
          onClick={handleSave}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
          disabled={saving}
          data-testid="save-settings-btn"
        >
          {saving ? t('loading') : t('save')}
        </Button>
      </div>

      {/* Business Information */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#D4AF37]" />
            {t('businessInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t('businessName')} (EN)</Label>
              <Input
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="bg-slate-950 border-slate-800"
                data-testid="business-name-en"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t('businessName')} (ES)</Label>
              <Input
                value={settings.business_name_es}
                onChange={(e) => setSettings({ ...settings, business_name_es: e.target.value })}
                className="bg-slate-950 border-slate-800"
                data-testid="business-name-es"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('phone')}
              </Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="bg-slate-950 border-slate-800"
                placeholder="(555) 123-4567"
                data-testid="business-phone"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('email')}
              </Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="bg-slate-950 border-slate-800"
                placeholder="info@taxoffice.com"
                data-testid="business-email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('address')}
            </Label>
            <Input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="123 Main Street, City, State ZIP"
              data-testid="business-address"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Logo URL</Label>
            <Input
              value={settings.logo_url}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            {t('businessHours')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'es' ? 'Hora de Apertura' : 'Opening Time'}</Label>
              <Input
                type="time"
                value={settings.business_hours_start}
                onChange={(e) => setSettings({ ...settings, business_hours_start: e.target.value })}
                className="bg-slate-950 border-slate-800"
                data-testid="hours-start"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{language === 'es' ? 'Hora de Cierre' : 'Closing Time'}</Label>
              <Input
                type="time"
                value={settings.business_hours_end}
                onChange={(e) => setSettings({ ...settings, business_hours_end: e.target.value })}
                className="bg-slate-950 border-slate-800"
                data-testid="hours-end"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Timezone
            </Label>
            <Input
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="bg-slate-950 border-slate-800"
              placeholder="America/New_York"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Integrations */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            {t('integrations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-900/30 rounded-sm flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{t('enableReminders')}</p>
                <p className="text-sm text-slate-500">
                  {language === 'es' 
                    ? 'Enviar recordatorios 48 horas antes de la cita'
                    : 'Send reminders 48 hours before appointment'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enable_reminders}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_reminders: checked })}
              data-testid="enable-reminders"
            />
          </div>

          <Separator className="bg-slate-800" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/30 rounded-sm flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{t('enableSMS')}</p>
                <p className="text-sm text-slate-500">
                  {language === 'es' 
                    ? 'Habilitar notificaciones por SMS (requiere Twilio)'
                    : 'Enable SMS notifications (requires Twilio)'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enable_sms}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_sms: checked })}
              data-testid="enable-sms"
            />
          </div>

          <Separator className="bg-slate-800" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-900/30 rounded-sm flex items-center justify-center">
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-slate-200">{t('enableImmigration')}</p>
                <p className="text-sm text-slate-500">
                  {language === 'es' 
                    ? 'Mostrar servicios de inmigracion en el catalogo'
                    : 'Show immigration services in catalog'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={settings.immigration_services_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, immigration_services_enabled: checked })}
              data-testid="enable-immigration"
            />
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-slate-100">
            {language === 'es' ? 'Variables de Entorno' : 'Environment Variables'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">
            {language === 'es' 
              ? 'Las siguientes variables de entorno deben configurarse en el servidor:'
              : 'The following environment variables should be configured on the server:'
            }
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="p-3 bg-slate-800/50 rounded-sm">
              <code className="text-[#D4AF37]">RESEND_API_KEY</code>
              <span className="text-slate-500 ml-2">- Email service API key</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-sm">
              <code className="text-[#D4AF37]">TWILIO_ACCOUNT_SID</code>
              <span className="text-slate-500 ml-2">- SMS service (optional)</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-sm">
              <code className="text-[#D4AF37]">TWILIO_AUTH_TOKEN</code>
              <span className="text-slate-500 ml-2">- SMS service (optional)</span>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-sm">
              <code className="text-[#D4AF37]">TWILIO_PHONE_NUMBER</code>
              <span className="text-slate-500 ml-2">- SMS sender number (optional)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
