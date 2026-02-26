import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Globe, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ForgotPasswordPage() {
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      toast.success(language === 'en' ? 'Reset link sent if email exists' : 'Enlace enviado si el correo existe');
    } catch (error) {
      toast.error(language === 'en' ? 'Failed to send reset link' : 'Error al enviar el enlace');
    } finally {
      setLoading(false);
    }
  };

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
              <Mail className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <CardTitle className="text-2xl font-serif text-slate-100">
              {t('forgotPassword')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {language === 'en' 
                ? 'Enter your email to receive a reset link'
                : 'Ingrese su correo para recibir un enlace'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-emerald-900/50 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-slate-300">
                  {language === 'en' 
                    ? 'Check your email for the reset link.'
                    : 'Revise su correo para el enlace de restablecimiento.'
                  }
                </p>
                <Link to="/portal/login">
                  <Button variant="outline" className="mt-4 border-slate-700 text-slate-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </Link>
              </div>
            ) : (
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
                    data-testid="forgot-email"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] font-semibold uppercase tracking-wide gold-glow"
                  disabled={loading}
                  data-testid="forgot-submit"
                >
                  {loading ? t('loading') : t('sendResetLink')}
                </Button>

                <Link to="/portal/login" className="block text-center">
                  <Button variant="ghost" className="text-slate-400 hover:text-[#D4AF37]">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
