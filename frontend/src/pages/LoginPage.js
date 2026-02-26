import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/portal/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await axios.get(`${API}/auth/check-setup`);
      if (response.data.setup_required) {
        navigate('/portal/setup');
      }
    } catch (error) {
      console.error('Setup check failed:', error);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success(language === 'en' ? 'Welcome back!' : 'Bienvenido!');
      navigate('/portal/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-[#D4AF37]">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 hero-glow">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-slate-400 hover:text-[#D4AF37]"
            data-testid="login-lang-toggle"
          >
            <Globe className="w-4 h-4 mr-2" />
            {language === 'en' ? 'ES' : 'EN'}
          </Button>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <h1 className="text-3xl font-bold text-[#D4AF37] font-serif">
                Elite Tax
              </h1>
            </div>
            <CardTitle className="text-2xl font-serif text-slate-100">
              {t('login')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'en' 
                ? 'Enter your credentials to access the portal'
                : 'Ingrese sus credenciales para acceder al portal'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 label-uppercase">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taxoffice.com"
                  required
                  className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  data-testid="login-email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12 pr-10"
                    data-testid="login-password"
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

              <div className="flex justify-end">
                <Link 
                  to="/portal/forgot-password" 
                  className="text-sm text-[#D4AF37] hover:underline"
                  data-testid="forgot-password-link"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] font-semibold uppercase tracking-wide gold-glow"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? t('loading') : t('login')}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-sm border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                Demo Credentials
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Admin:</span> admin@taxoffice.com / admin123
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Staff:</span> staff1@taxoffice.com / staff123
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-slate-500 text-sm">
          {language === 'en' 
            ? 'Need to book an appointment?'
            : 'Necesita reservar una cita?'
          }
          {' '}
          <Link to="/book" className="text-[#D4AF37] hover:underline">
            {language === 'en' ? 'Book here' : 'Reserve aqui'}
          </Link>
        </p>
      </div>
    </div>
  );
}
