import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Globe, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  const { login, isAuthenticated, forcePasswordReset, clearForcePasswordReset } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  
  // Force password reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !forcePasswordReset) {
      navigate('/portal/dashboard');
    }
  }, [isAuthenticated, forcePasswordReset, navigate]);

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
      const result = await login(email, password);
      if (result.forcePasswordReset) {
        setCurrentPassword(password);
        setShowResetModal(true);
        toast.warning(
          language === 'en' 
            ? 'Password reset required for security' 
            : 'Se requiere cambio de contraseña por seguridad'
        );
      } else {
        toast.success(language === 'en' ? 'Welcome back!' : 'Bienvenido!');
        navigate('/portal/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(language === 'en' ? 'Passwords do not match' : 'Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error(language === 'en' ? 'Password must be at least 8 characters' : 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setResetting(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast.success(language === 'en' ? 'Password changed successfully!' : 'Contraseña cambiada exitosamente!');
      clearForcePasswordReset();
      setShowResetModal(false);
      navigate('/portal/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to change password';
      toast.error(message);
    } finally {
      setResetting(false);
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
      {/* Force Password Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {language === 'en' ? 'Password Reset Required' : 'Cambio de Contraseña Requerido'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {language === 'en' 
                ? 'For security reasons, you must change your password before continuing.'
                : 'Por razones de seguridad, debe cambiar su contraseña antes de continuar.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">
                {language === 'en' ? 'New Password' : 'Nueva Contraseña'}
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                required
                minLength={8}
                className="bg-slate-950 border-slate-800 focus:border-[#D4AF37]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">
                {language === 'en' ? 'Confirm Password' : 'Confirmar Contraseña'}
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                required
                className="bg-slate-950 border-slate-800 focus:border-[#D4AF37]"
              />
            </div>
            
            <p className="text-xs text-slate-500">
              {language === 'en' 
                ? 'Password must be at least 8 characters long.'
                : 'La contraseña debe tener al menos 8 caracteres.'
              }
            </p>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={resetting}
                className="w-full bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
              >
                {resetting 
                  ? (language === 'en' ? 'Changing...' : 'Cambiando...') 
                  : (language === 'en' ? 'Change Password' : 'Cambiar Contraseña')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
