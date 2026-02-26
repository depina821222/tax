import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useBrand } from '../contexts/BrandContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { 
  Building, 
  Palette, 
  MapPin, 
  Phone, 
  Mail, 
  Image, 
  Type, 
  Globe, 
  Upload,
  Check,
  RefreshCw,
  Facebook,
  Instagram,
  Linkedin,
  Eye,
  AlertTriangle,
  ExternalLink,
  Link2,
  Shield,
  Copy,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BrandSettingsPage() {
  const { language, t } = useLanguage();
  const { brand, updateBrand, uploadLogo, fetchBrand } = useBrand();
  
  const [formData, setFormData] = useState(brand);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [domainSettings, setDomainSettings] = useState({
    custom_domain: '',
    domain_verified: false,
    ssl_status: 'pending'
  });
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData(brand);
    fetchDomainSettings();
  }, [brand]);

  const fetchDomainSettings = async () => {
    try {
      const response = await axios.get(`${API}/domain-settings`);
      setDomainSettings(response.data);
    } catch (error) {
      // Domain settings might not exist yet
    }
  };

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      await updateBrand(formData);
      toast.success(language === 'es' ? 'Configuracion de marca guardada' : 'Brand settings saved');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al guardar' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewBooking = () => {
    window.open('/book', '_blank');
  };

  const handleSaveDomain = async () => {
    try {
      await axios.put(`${API}/domain-settings`, {
        custom_domain: domainSettings.custom_domain
      });
      toast.success(language === 'es' ? 'Dominio guardado' : 'Domain saved');
      fetchDomainSettings();
    } catch (error) {
      toast.error(language === 'es' ? 'Error al guardar dominio' : 'Failed to save domain');
    }
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    try {
      const response = await axios.post(`${API}/domain-settings/verify`);
      setDomainSettings(response.data);
      if (response.data.domain_verified) {
        toast.success(language === 'es' ? 'Dominio verificado!' : 'Domain verified!');
      } else {
        toast.error(language === 'es' ? 'Verificacion fallida. Revise su DNS.' : 'Verification failed. Check your DNS.');
      }
    } catch (error) {
      toast.error(language === 'es' ? 'Error de verificacion' : 'Verification error');
    } finally {
      setVerifyingDomain(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'es' ? 'Copiado!' : 'Copied!');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'es' ? 'Solo se permiten imagenes' : 'Only images allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'es' ? 'Archivo muy grande (max 2MB)' : 'File too large (max 2MB)');
      return;
    }

    setUploading(true);
    try {
      const logoUrl = await uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      toast.success(language === 'es' ? 'Logo subido' : 'Logo uploaded');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al subir logo' : 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFormData(brand);
    toast.info(language === 'es' ? 'Cambios descartados' : 'Changes discarded');
  };

  const previewUrl = `${window.location.origin}/book`;

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="brand-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-serif">
            {language === 'es' ? 'Configuracion de Marca' : 'Brand Settings'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {language === 'es' 
              ? 'Personalice la apariencia de su portal y pagina de reservas' 
              : 'Customize the look and feel of your portal and booking page'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handlePreviewBooking}
            className="border-slate-700 text-slate-300"
            data-testid="preview-booking-btn"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Vista Previa' : 'Preview'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Descartar' : 'Discard'}
          </Button>
          <Button 
            onClick={handleSaveClick}
            className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
            disabled={saving}
            data-testid="save-brand-btn"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {saving ? (language === 'es' ? 'Guardando...' : 'Saving...') : t('save')}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <DialogTitle className="text-slate-100 font-serif text-xl">
                {language === 'es' ? 'Confirmar Cambios' : 'Confirm Changes'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400">
              {language === 'es' 
                ? 'Esta seguro que desea actualizar la marca publica? Esto cambiara como los clientes ven su pagina de reservas.'
                : 'Are you sure you want to update public branding? This will change how clients see your booking page.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-slate-700 text-slate-300"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleConfirmSave}
              className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
              data-testid="confirm-save-btn"
            >
              {language === 'es' ? 'Si, Actualizar' : 'Yes, Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="identity" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Building className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Identidad' : 'Identity'}
          </TabsTrigger>
          <TabsTrigger value="colors" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Palette className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Colores' : 'Colors'}
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Type className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Contenido' : 'Content'}
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Phone className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Contacto' : 'Contact'}
          </TabsTrigger>
          <TabsTrigger value="domain" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-slate-950">
            <Link2 className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Dominio' : 'Domain'}
          </TabsTrigger>
        </TabsList>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                  <Image className="w-5 h-5 text-[#D4AF37]" />
                  Logo
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {language === 'es' 
                    ? 'Suba su logo (PNG, JPG, max 2MB)' 
                    : 'Upload your logo (PNG, JPG, max 2MB)'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <div 
                    className="w-24 h-24 bg-slate-800 rounded-sm flex items-center justify-center border border-slate-700 overflow-hidden"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="border-slate-700 text-slate-300"
                      data-testid="upload-logo-btn"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading 
                        ? (language === 'es' ? 'Subiendo...' : 'Uploading...') 
                        : (language === 'es' ? 'Subir Logo' : 'Upload Logo')
                      }
                    </Button>
                    {formData.logo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="text-red-400 hover:text-red-300"
                      >
                        {language === 'es' ? 'Eliminar' : 'Remove'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Name Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#D4AF37]" />
                  {language === 'es' ? 'Nombre del Negocio' : 'Business Name'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> English
                  </Label>
                  <Input
                    value={formData.business_name_en}
                    onChange={(e) => setFormData({ ...formData, business_name_en: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="brand-name-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Español
                  </Label>
                  <Input
                    value={formData.business_name_es}
                    onChange={(e) => setFormData({ ...formData, business_name_es: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="brand-name-es"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tagline Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100">
                {language === 'es' ? 'Eslogan' : 'Tagline'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'es' 
                  ? 'Una frase corta que describe su negocio' 
                  : 'A short phrase that describes your business'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">English</Label>
                  <Input
                    value={formData.tagline_en}
                    onChange={(e) => setFormData({ ...formData, tagline_en: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Professional Tax & Business Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Español</Label>
                  <Input
                    value={formData.tagline_es}
                    onChange={(e) => setFormData({ ...formData, tagline_es: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="Servicios Profesionales de Impuestos"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#D4AF37]" />
                {language === 'es' ? 'Colores de Marca' : 'Brand Colors'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'es' 
                  ? 'Personalice los colores de su marca' 
                  : 'Customize your brand colors'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Color Primario' : 'Primary Color'}
                  </Label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-sm border border-slate-700"
                      style={{ backgroundColor: formData.primary_color }}
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-full h-10 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="bg-slate-950 border-slate-800 font-mono text-sm"
                        placeholder="#1e293b"
                        data-testid="primary-color"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'es' ? 'Usado en fondos y sidebar' : 'Used in backgrounds and sidebar'}
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Color de Acento' : 'Accent Color'}
                  </Label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-sm border border-slate-700"
                      style={{ backgroundColor: formData.accent_color }}
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        className="w-full h-10 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      <Input
                        value={formData.accent_color}
                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                        className="bg-slate-950 border-slate-800 font-mono text-sm"
                        placeholder="#D4AF37"
                        data-testid="accent-color"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {language === 'es' ? 'Usado en botones y enlaces' : 'Used in buttons and links'}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <Separator className="bg-slate-800" />
              
              <div>
                <Label className="text-slate-300 mb-4 block">
                  {language === 'es' ? 'Vista Previa' : 'Preview'}
                </Label>
                <div 
                  className="p-6 rounded-sm border border-slate-700"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="h-10 w-auto" />
                    ) : (
                      <div className="h-10 w-10 bg-white/10 rounded flex items-center justify-center">
                        <Building className="w-6 h-6" style={{ color: formData.accent_color }} />
                      </div>
                    )}
                    <span className="text-xl font-bold" style={{ color: formData.accent_color }}>
                      {language === 'es' ? formData.business_name_es : formData.business_name_en}
                    </span>
                  </div>
                  <button
                    className="px-6 py-2 rounded-sm font-semibold text-sm"
                    style={{ 
                      backgroundColor: formData.accent_color,
                      color: formData.primary_color
                    }}
                  >
                    {language === 'es' ? 'Reservar Ahora' : 'Book Now'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Hero Section */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100">
                {language === 'es' ? 'Pagina de Reservas - Hero' : 'Booking Page - Hero'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'es' 
                  ? 'Texto principal que veran los clientes al reservar' 
                  : 'Main text clients see when booking'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Titulo (EN)' : 'Title (EN)'}
                  </Label>
                  <Input
                    value={formData.hero_title_en}
                    onChange={(e) => setFormData({ ...formData, hero_title_en: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="hero-title-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Titulo (ES)' : 'Title (ES)'}
                  </Label>
                  <Input
                    value={formData.hero_title_es}
                    onChange={(e) => setFormData({ ...formData, hero_title_es: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="hero-title-es"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Subtitulo (EN)' : 'Subtitle (EN)'}
                  </Label>
                  <Textarea
                    value={formData.hero_subtitle_en}
                    onChange={(e) => setFormData({ ...formData, hero_subtitle_en: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {language === 'es' ? 'Subtitulo (ES)' : 'Subtitle (ES)'}
                  </Label>
                  <Textarea
                    value={formData.hero_subtitle_es}
                    onChange={(e) => setFormData({ ...formData, hero_subtitle_es: e.target.value })}
                    className="bg-slate-950 border-slate-800 h-20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100">
                {language === 'es' ? 'Texto del Pie de Pagina' : 'Footer Text'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">English</Label>
                  <Input
                    value={formData.footer_text_en}
                    onChange={(e) => setFormData({ ...formData, footer_text_en: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="footer-en"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Español</Label>
                  <Input
                    value={formData.footer_text_es}
                    onChange={(e) => setFormData({ ...formData, footer_text_es: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    data-testid="footer-es"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100">
                {language === 'es' ? 'Redes Sociales' : 'Social Media'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </Label>
                  <Input
                    value={formData.social_facebook}
                    onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Label>
                  <Input
                    value={formData.social_instagram}
                    onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Label>
                  <Input
                    value={formData.social_linkedin}
                    onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                {language === 'es' ? 'Informacion de Contacto' : 'Contact Information'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'es' 
                  ? 'Esta informacion aparecera en la pagina de reservas y correos' 
                  : 'This info will appear on booking page and emails'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {language === 'es' ? 'Direccion de la Oficina' : 'Office Address'}
                </Label>
                <Textarea
                  value={formData.office_address}
                  onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                  className="bg-slate-950 border-slate-800 h-20"
                  placeholder="100 Financial Plaza, Suite 200, New York, NY 10001"
                  data-testid="office-address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {language === 'es' ? 'Telefono' : 'Phone Number'}
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="(555) 123-4567"
                    data-testid="brand-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {language === 'es' ? 'Correo Electronico' : 'Email'}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-950 border-slate-800"
                    placeholder="info@yourbusiness.com"
                    data-testid="brand-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  {language === 'es' ? 'Nombre del Remitente (Emails)' : 'Sender Name (Emails)'}
                </Label>
                <Input
                  value={formData.sender_name}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  className="bg-slate-950 border-slate-800"
                  placeholder="Elite Tax Services"
                  data-testid="sender-name"
                />
                <p className="text-xs text-slate-500">
                  {language === 'es' 
                    ? 'El nombre que aparecera como remitente en los correos' 
                    : 'The name that will appear as sender in emails'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Button */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-slate-200">
                    {language === 'es' ? 'Vista Previa de la Pagina de Reservas' : 'Preview Booking Page'}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {language === 'es' 
                      ? 'Vea como se ve su pagina publica de reservas' 
                      : 'See how your public booking page looks'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePreviewBooking}
                  className="border-slate-700 text-slate-300"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {language === 'es' ? 'Ver Pagina' : 'View Page'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#D4AF37]" />
                {language === 'es' ? 'Dominio Personalizado' : 'Custom Domain'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {language === 'es' 
                  ? 'Configure un dominio personalizado para su pagina de reservas (ej: book.suempresa.com)' 
                  : 'Configure a custom domain for your booking page (e.g., book.yourcompany.com)'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  {language === 'es' ? 'Dominio Personalizado' : 'Custom Domain'}
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={domainSettings.custom_domain}
                    onChange={(e) => setDomainSettings({ ...domainSettings, custom_domain: e.target.value })}
                    className="bg-slate-950 border-slate-800 flex-1"
                    placeholder="book.yourcompany.com"
                    data-testid="custom-domain-input"
                  />
                  <Button 
                    onClick={handleSaveDomain}
                    variant="outline"
                    className="border-slate-700 text-slate-300"
                  >
                    {t('save')}
                  </Button>
                </div>
              </div>

              {domainSettings.custom_domain && (
                <>
                  {/* Status */}
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-sm">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      domainSettings.domain_verified ? 'bg-emerald-900/30' : 'bg-amber-900/30'
                    }`}>
                      {domainSettings.domain_verified ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-200">
                        {domainSettings.domain_verified 
                          ? (language === 'es' ? 'Dominio Verificado' : 'Domain Verified')
                          : (language === 'es' ? 'Pendiente de Verificacion' : 'Pending Verification')
                        }
                      </p>
                      <p className="text-sm text-slate-400">
                        {domainSettings.domain_verified 
                          ? (language === 'es' ? 'Su dominio esta configurado correctamente' : 'Your domain is configured correctly')
                          : (language === 'es' ? 'Configure su DNS y verifique la propiedad' : 'Configure your DNS and verify ownership')
                        }
                      </p>
                    </div>
                    <Button
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                      data-testid="verify-domain-btn"
                    >
                      {verifyingDomain ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      {language === 'es' ? 'Verificar' : 'Verify'}
                    </Button>
                  </div>

                  {/* DNS Instructions */}
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#D4AF37]" />
                        {language === 'es' ? 'Instrucciones de DNS' : 'DNS Instructions'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-slate-400">
                        {language === 'es' 
                          ? 'Agregue el siguiente registro CNAME en la configuracion DNS de su dominio:' 
                          : 'Add the following CNAME record in your domain DNS settings:'
                        }
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-sm font-mono text-sm">
                          <div>
                            <span className="text-slate-500">{language === 'es' ? 'Tipo:' : 'Type:'}</span>
                            <span className="text-slate-200 ml-2">CNAME</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-sm font-mono text-sm">
                          <div className="flex-1">
                            <span className="text-slate-500">{language === 'es' ? 'Nombre:' : 'Name:'}</span>
                            <span className="text-[#D4AF37] ml-2">
                              {domainSettings.custom_domain.split('.')[0] || 'book'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(domainSettings.custom_domain.split('.')[0] || 'book')}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-sm font-mono text-sm">
                          <div className="flex-1">
                            <span className="text-slate-500">{language === 'es' ? 'Valor:' : 'Value:'}</span>
                            <span className="text-[#D4AF37] ml-2">cname.emergentagent.com</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('cname.emergentagent.com')}
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator className="bg-slate-700" />

                      {/* SSL Status */}
                      <div className="flex items-center gap-3">
                        <Shield className={`w-5 h-5 ${
                          domainSettings.ssl_status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {language === 'es' ? 'Certificado SSL' : 'SSL Certificate'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {domainSettings.ssl_status === 'active' 
                              ? (language === 'es' ? 'HTTPS activo y funcionando' : 'HTTPS active and working')
                              : domainSettings.ssl_status === 'provisioning'
                                ? (language === 'es' ? 'Aprovisionando certificado...' : 'Provisioning certificate...')
                                : (language === 'es' ? 'Se activara automaticamente despues de verificar el dominio' : 'Will be activated automatically after domain verification')
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* How it works */}
                  <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-sm">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">
                      {language === 'es' ? 'Como funciona' : 'How it works'}
                    </h4>
                    <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                      <li>{language === 'es' ? 'Ingrese su dominio personalizado arriba' : 'Enter your custom domain above'}</li>
                      <li>{language === 'es' ? 'Agregue el registro CNAME en su proveedor de DNS' : 'Add the CNAME record at your DNS provider'}</li>
                      <li>{language === 'es' ? 'Espere a que se propague el DNS (hasta 48 horas)' : 'Wait for DNS propagation (up to 48 hours)'}</li>
                      <li>{language === 'es' ? 'Haga clic en Verificar para confirmar' : 'Click Verify to confirm'}</li>
                      <li>{language === 'es' ? 'El SSL se activara automaticamente' : 'SSL will be activated automatically'}</li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
