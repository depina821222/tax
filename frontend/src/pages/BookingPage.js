import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useBrand } from '../contexts/BrandContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Globe, ArrowRight, ArrowLeft, CheckCircle, Calendar as CalendarIcon, Clock, User, Phone, Mail, FileText, Building, Facebook, Instagram, Linkedin } from 'lucide-react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BookingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { brand, getBusinessName, getHeroTitle, getHeroSubtitle, getFooterText } = useBrand();
  const locale = language === 'es' ? es : enUS;
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    service_id: '',
    date: '',
    time: '',
    full_name: '',
    phone: '',
    email: '',
    notes: '',
    preferred_language: language
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, preferred_language: language }));
  }, [language]);

  const fetchData = async () => {
    try {
      const [servicesRes, settingsRes] = await Promise.all([
        axios.get(`${API}/services?active_only=true`),
        axios.get(`${API}/settings`)
      ]);
      setServices(servicesRes.data);
      setSettings(settingsRes.data);
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

  const selectedService = services.find(s => s.id === formData.service_id);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API}/book`, formData);
      setBookingComplete(true);
      toast.success(language === 'es' ? 'Cita reservada exitosamente!' : 'Appointment booked successfully!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Booking failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.service_id;
      case 2: return !!formData.date && !!formData.time;
      case 3: return !!formData.full_name && !!formData.phone && !!formData.email;
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 hero-glow">
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md max-w-md w-full p-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 font-serif mb-2">
            {t('bookingConfirmed')}
          </h1>
          <p className="text-slate-400 mb-6">
            {t('thankYou')}
          </p>
          
          <div className="text-left space-y-3 p-4 bg-slate-800/50 rounded-sm mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('service')}:</span>
              <span className="text-slate-200">
                {language === 'es' ? selectedService?.name_es : selectedService?.name_en}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('date')}:</span>
              <span className="text-slate-200">{formData.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('time')}:</span>
              <span className="text-slate-200">{formData.time}</span>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            {language === 'es' 
              ? 'Hemos enviado una confirmacion a su correo electronico.'
              : 'We have sent a confirmation to your email.'
            }
          </p>

          <Link to="/book">
            <Button 
              onClick={() => window.location.reload()}
              style={{ backgroundColor: brand.accent_color, color: brand.primary_color }}
              className="hover:opacity-90"
            >
              {language === 'es' ? 'Reservar Otra Cita' : 'Book Another Appointment'}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" data-testid="booking-page">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
              <Building className="w-8 h-8" style={{ color: brand.accent_color }} />
            )}
            <h1 className="text-xl font-bold font-serif" style={{ color: brand.accent_color }}>
              {getBusinessName(language)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="text-slate-400 hover:opacity-80"
              style={{ '--hover-color': brand.accent_color }}
              data-testid="booking-lang-toggle"
            >
              <Globe className="w-4 h-4 mr-2" />
              {language === 'en' ? 'ES' : 'EN'}
            </Button>
            <Link to="/portal/login">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:opacity-80">
                {t('login')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Professional Background */}
      <div 
        className="py-12 text-center border-b border-slate-800 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${brand.primary_color || '#020617'} 0%, #0f172a 50%, #1e293b 100%)`
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(212, 175, 55, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 175, 55, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Vignette effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(2, 6, 23, 0.6) 100%)'
          }}
        />
        
        {/* Subtle brand watermark */}
        {brand.logo_url && (
          <div 
            className="absolute inset-0 flex items-center justify-center opacity-[0.03]"
            style={{ pointerEvents: 'none' }}
          >
            <img 
              src={brand.logo_url} 
              alt="" 
              className="w-96 h-96 object-contain"
              style={{ filter: 'grayscale(100%)' }}
            />
          </div>
        )}
        
        {/* Gold accent glow at top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]"
          style={{
            background: `radial-gradient(ellipse at center top, ${brand.accent_color || '#D4AF37'}15 0%, transparent 70%)`
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-100 mb-3">
            {getHeroTitle(language)}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto px-4">
            {getHeroSubtitle(language)}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
                style={s === step ? { backgroundColor: brand.accent_color, color: brand.primary_color } : {}}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 mx-2 rounded ${s < step ? 'bg-emerald-600' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-slate-100 font-serif text-center mb-2">
          {step === 1 && t('selectService')}
          {step === 2 && t('selectDateTime')}
          {step === 3 && t('yourInformation')}
          {step === 4 && t('confirmation')}
        </h2>
        <p className="text-slate-400 text-center mb-8">
          {step === 1 && (language === 'es' ? 'Elija el servicio que necesita' : 'Choose the service you need')}
          {step === 2 && (language === 'es' ? 'Seleccione una fecha y hora disponible' : 'Select an available date and time')}
          {step === 3 && (language === 'es' ? 'Complete sus datos de contacto' : 'Fill in your contact details')}
          {step === 4 && (language === 'es' ? 'Revise y confirme su reserva' : 'Review and confirm your booking')}
        </p>

        {/* Step Content */}
        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md max-w-2xl mx-auto animate-fade-in-up">
          <CardContent className="p-6">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setFormData({ ...formData, service_id: service.id })}
                    className={`p-4 rounded-sm border cursor-pointer transition-all ${
                      formData.service_id === service.id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                    data-testid={`service-option-${service.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                        formData.service_id === service.id ? 'bg-[#D4AF37]/20' : 'bg-slate-800'
                      }`}>
                        <FileText className={`w-6 h-6 ${
                          formData.service_id === service.id ? 'text-[#D4AF37]' : 'text-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-200">
                          {language === 'es' ? service.name_es : service.name_en}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {language === 'es' ? service.description_es : service.description_en}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} {t('minutes')}
                          </span>
                        </div>
                      </div>
                      {formData.service_id === service.id && (
                        <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-300 mb-3 block">{t('date')}</Label>
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => setFormData({ 
                      ...formData, 
                      date: date ? format(date, 'yyyy-MM-dd') : '',
                      time: '' 
                    })}
                    locale={locale}
                    disabled={(date) => isBefore(date, startOfToday())}
                    className="rounded-sm border border-slate-800"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-3 block">{t('time')}</Label>
                  {!formData.date ? (
                    <p className="text-slate-500 text-sm">
                      {language === 'es' ? 'Seleccione una fecha primero' : 'Select a date first'}
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                      {language === 'es' ? 'No hay horarios disponibles' : 'No available times'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`${
                            formData.time === slot
                              ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                              : 'border-slate-700 text-slate-300 hover:border-[#D4AF37]'
                          }`}
                          data-testid={`time-slot-${slot}`}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('fullName')} *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-12"
                    required
                    data-testid="booking-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t('phone')} *
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-12"
                      required
                      data-testid="booking-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('email')} *
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-950 border-slate-800 h-12"
                      required
                      data-testid="booking-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t('preferredLanguage')}</Label>
                  <Select 
                    value={formData.preferred_language} 
                    onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t('notes')} ({t('optional')})</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder={language === 'es' ? 'Alguna nota adicional...' : 'Any additional notes...'}
                    data-testid="booking-notes"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('service')}:</span>
                    <span className="text-slate-200 font-medium">
                      {language === 'es' ? selectedService?.name_es : selectedService?.name_en}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('date')}:</span>
                    <span className="text-slate-200">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('time')}:</span>
                    <span className="text-slate-200">{formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('duration')}:</span>
                    <span className="text-slate-200">{selectedService?.duration_minutes} {t('minutes')}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('fullName')}:</span>
                    <span className="text-slate-200">{formData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('phone')}:</span>
                    <span className="text-slate-200">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('email')}:</span>
                    <span className="text-slate-200">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('preferredLanguage')}:</span>
                    <span className="text-slate-200">
                      {formData.preferred_language === 'es' ? 'Español' : 'English'}
                    </span>
                  </div>
                </div>

                {settings?.address && (
                  <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-sm">
                    <p className="text-sm text-slate-300">
                      <strong>{language === 'es' ? 'Direccion:' : 'Address:'}</strong><br />
                      {settings.address}
                    </p>
                    {settings.phone && (
                      <p className="text-sm text-slate-400 mt-2">
                        {language === 'es' ? 'Telefono:' : 'Phone:'} {settings.phone}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-slate-700 text-slate-300"
                  data-testid="booking-back-btn"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('back')}
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  style={{ backgroundColor: brand.accent_color, color: brand.primary_color }}
                  className="hover:opacity-90"
                  data-testid="booking-next-btn"
                >
                  {t('next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ backgroundColor: brand.accent_color, color: brand.primary_color }}
                  className="hover:opacity-90"
                  data-testid="booking-submit-btn"
                >
                  {submitting ? t('loading') : t('bookNow')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt="Logo" className="h-8 w-auto opacity-50" />
              ) : (
                <Building className="w-6 h-6 text-slate-600" />
              )}
              <span className="text-slate-500 text-sm">
                {getFooterText(language)}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {brand.phone && (
                <a href={`tel:${brand.phone}`} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {brand.phone}
                </a>
              )}
              {brand.email && (
                <a href={`mailto:${brand.email}`} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {brand.email}
                </a>
              )}
            </div>

            <div className="flex items-center gap-3">
              {brand.social_facebook && (
                <a href={brand.social_facebook} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {brand.social_instagram && (
                <a href={brand.social_instagram} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {brand.social_linkedin && (
                <a href={brand.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-400">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
