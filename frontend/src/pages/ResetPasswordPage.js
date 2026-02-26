import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResetPasswordPage() {
  const { language, setLanguage, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error(language === 'en' ? 'Passwords do not match' : 'Las contrasenas no coinciden');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: password });
      toast.success(language === 'en' ? 'Password reset successful' : 'Contrasena restablecida exitosamente');
      navigate('/portal/login');
    } catch (error) {
      const message = error.response?.data?.detail || 'Reset failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/80 border-slate-800 p-8 text-center">
          <p className="text-red-400 mb-4">
            {language === 'en' ? 'Invalid reset link' : 'Enlace de restablecimiento invalido'}
          </p>
          <Link to="/portal/forgot-password">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              {language === 'en' ? 'Request new link' : 'Solicitar nuevo enlace'}
            </Button>
          </Link>
        </Card>
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
            <div className="mx-auto mb-4 w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-2xl font-serif text-slate-100">
              {t('resetPassword')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'en' 
                ? 'Enter your new password'
                : 'Ingrese su nueva contrasena'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 label-uppercase">
                  {t('newPassword')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    minLength={6}
                    className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12 pr-10"
                    data-testid="reset-password"
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
                <Label htmlFor="confirmPassword" className="text-slate-300 label-uppercase">
                  {t('confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  className="bg-slate-950 border-slate-800 focus:border-[#D4AF37] focus:ring-[#D4AF37] h-12"
                  data-testid="reset-confirm-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] font-semibold uppercase tracking-wide gold-glow"
                disabled={loading}
                data-testid="reset-submit"
              >
                {loading ? t('loading') : t('resetPassword')}
              </Button>

              <Link to="/portal/login" className="block text-center">
                <Button variant="ghost" className="text-slate-400 hover:text-[#D4AF37]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('backToLogin')}
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
