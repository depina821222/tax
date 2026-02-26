import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultBrand = {
  business_name_en: 'Elite Tax Services',
  business_name_es: 'Servicios de Impuestos Elite',
  tagline_en: 'Professional Tax & Business Services',
  tagline_es: 'Servicios Profesionales de Impuestos y Negocios',
  logo_url: '',
  primary_color: '#1e293b',
  accent_color: '#D4AF37',
  office_address: '100 Financial Plaza, Suite 200, New York, NY 10001',
  phone: '(555) 123-4567',
  email: 'info@elitetax.com',
  sender_name: 'Elite Tax Services',
  hero_title_en: 'Book Your Appointment',
  hero_title_es: 'Reserve su Cita',
  hero_subtitle_en: 'Professional tax and business services tailored to your needs',
  hero_subtitle_es: 'Servicios profesionales de impuestos y negocios adaptados a sus necesidades',
  footer_text_en: '© 2026 Elite Tax Services. All rights reserved.',
  footer_text_es: '© 2026 Servicios de Impuestos Elite. Todos los derechos reservados.',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: ''
};

const BrandContext = createContext();

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(defaultBrand);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrand();
  }, []);

  const fetchBrand = async () => {
    try {
      const response = await axios.get(`${API}/brand`);
      setBrand({ ...defaultBrand, ...response.data });
      
      // Apply CSS variables for colors
      document.documentElement.style.setProperty('--brand-primary', response.data.primary_color || defaultBrand.primary_color);
      document.documentElement.style.setProperty('--brand-accent', response.data.accent_color || defaultBrand.accent_color);
    } catch (error) {
      console.error('Failed to fetch brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (updates) => {
    try {
      const response = await axios.put(`${API}/brand`, updates);
      setBrand({ ...defaultBrand, ...response.data });
      
      // Apply CSS variables for colors
      document.documentElement.style.setProperty('--brand-primary', response.data.primary_color || defaultBrand.primary_color);
      document.documentElement.style.setProperty('--brand-accent', response.data.accent_color || defaultBrand.accent_color);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API}/brand/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setBrand(prev => ({ ...prev, logo_url: response.data.logo_url }));
    return response.data.logo_url;
  };

  const getBusinessName = (language) => {
    return language === 'es' ? brand.business_name_es : brand.business_name_en;
  };

  const getTagline = (language) => {
    return language === 'es' ? brand.tagline_es : brand.tagline_en;
  };

  const getHeroTitle = (language) => {
    return language === 'es' ? brand.hero_title_es : brand.hero_title_en;
  };

  const getHeroSubtitle = (language) => {
    return language === 'es' ? brand.hero_subtitle_es : brand.hero_subtitle_en;
  };

  const getFooterText = (language) => {
    return language === 'es' ? brand.footer_text_es : brand.footer_text_en;
  };

  return (
    <BrandContext.Provider value={{
      brand,
      loading,
      updateBrand,
      uploadLogo,
      fetchBrand,
      getBusinessName,
      getTagline,
      getHeroTitle,
      getHeroSubtitle,
      getFooterText
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

export default BrandContext;
