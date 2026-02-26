import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useBrand } from '../contexts/BrandContext';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays, 
  Users, 
  Briefcase, 
  FileText, 
  Mail, 
  UserCog, 
  Settings, 
  LogOut,
  Globe,
  Palette,
  Building
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const DashboardLayout = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, isAdmin, updateLanguage } = useAuth();
  const { brand, getBusinessName } = useBrand();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    updateLanguage(lang);
  };

  const navItems = [
    { to: '/portal/dashboard', icon: LayoutDashboard, label: 'dashboard' },
    { to: '/portal/calendar', icon: Calendar, label: 'calendar' },
    { to: '/portal/appointments', icon: CalendarDays, label: 'appointments' },
    { to: '/portal/clients', icon: Users, label: 'clients' },
    { to: '/portal/services', icon: Briefcase, label: 'services' },
    { to: '/portal/cases', icon: FileText, label: 'cases' },
    { to: '/portal/templates', icon: Mail, label: 'templates' },
    ...(isAdmin ? [
      { to: '/portal/staff', icon: UserCog, label: 'staff' },
      { to: '/portal/settings', icon: Settings, label: 'settings' },
      { to: '/portal/brand', icon: Palette, label: 'brand', labelOverride: language === 'es' ? 'Marca' : 'Brand' },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img src={brand.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
              <Building className="w-8 h-8" style={{ color: brand.accent_color }} />
            )}
            <div>
              <h1 className="text-lg font-bold font-serif" style={{ color: brand.accent_color }}>
                {getBusinessName(language)}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest">
                Portal
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.label}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors
                ${isActive 
                  ? 'bg-slate-800/80 border-r-2' 
                  : 'text-slate-400 hover:bg-slate-800/50'
                }`
              }
              style={({ isActive }) => isActive ? { color: brand.accent_color, borderColor: brand.accent_color } : {}}
            >
              <item.icon className="w-5 h-5" />
              {item.labelOverride || t(item.label)}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-semibold"
              style={{ backgroundColor: brand.accent_color }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-end gap-4 px-6 py-4">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 hover:text-[#D4AF37]"
                  data-testid="language-toggle"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange('en')}
                  className={language === 'en' ? 'text-[#D4AF37]' : 'text-slate-300'}
                  data-testid="lang-en"
                >
                  English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange('es')}
                  className={language === 'es' ? 'text-[#D4AF37]' : 'text-slate-300'}
                  data-testid="lang-es"
                >
                  Espanol (ES)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
