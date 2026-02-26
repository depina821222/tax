import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SetupPage() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    language: 'en'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await axios.get(`${API}/auth/check-setup`);
      if (!response.data.setup_required) {
        navigate('/portal/login');
      }
    } catch (error) {
      console.error('Setup check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create admin
      await axios.post(`${API}/auth/setup`, formData);
      
      // Seed demo data
      await axios.post(`${API}/seed`);
      
      toast.success(language === 'en' ? 'Setup complete! Please login.' : 'Configuracion completa! Por favor inicie sesion.');
      navigate('/portal/login');
    } catch (error) {
      const message = error.response?.data?.detail || 'Setup failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 hero-glow">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-slate-400 hover:text-[#D4AF37]"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-2xl font-serif text-slate-100">
              {language === 'en' ? 'Welcome to Elite Tax' : 'Bienvenido a Elite Tax'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'en' 
                ? 'Create your admin account to get started'
                : 'Cree su cuenta de administrador para comenzar'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-300 label-uppercase">
                  {t('fullName')}
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Maria Rodriguez"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  data-testid="setup-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 label-uppercase">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@taxoffice.com"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  data-testid="setup-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 label-uppercase">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="********"
                    required
                    minLength={6}
                    className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12 pr-10"
                    data-testid="setup-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 label-uppercase">
                  {t('preferredLanguage')}
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={formData.language === 'en'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-slate-300">English</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="es"
                      checked={formData.language === 'es'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="text-slate-300">Espanol</span>
                  </label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] font-semibold uppercase tracking-wide gold-glow"
                disabled={loading}
                data-testid="setup-submit"
              >
                {loading ? t('loading') : (language === 'en' ? 'Create Admin & Setup' : 'Crear Admin y Configurar')}
              </Button>
            </form>

            <p className="mt-4 text-xs text-slate-500 text-center">
              {language === 'en' 
                ? 'This will also seed demo data including sample clients, appointments, and staff.'
                : 'Esto tambien creara datos de demostracion incluyendo clientes, citas y personal de muestra.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
