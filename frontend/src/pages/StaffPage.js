import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { Plus, Edit, Trash2, User, Shield, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StaffPage() {
  const { language, t } = useLanguage();
  const { user: currentUser } = useAuth();
  
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff',
    language: 'en',
    is_active: true
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`);
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        role: user.role,
        language: user.language || 'en',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'staff',
        language: 'en',
        is_active: true
      });
    }
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }

      if (editingUser) {
        await axios.put(`${API}/staff/${editingUser.id}`, payload);
        toast.success(language === 'es' ? 'Usuario actualizado' : 'User updated');
      } else {
        await axios.post(`${API}/staff`, payload);
        toast.success(language === 'es' ? 'Usuario creado' : 'User created');
      }
      setDialogOpen(false);
      fetchStaff();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'es' ? 'Eliminar este usuario?' : 'Delete this user?')) return;
    
    try {
      await axios.delete(`${API}/staff/${id}`);
      toast.success(language === 'es' ? 'Usuario eliminado' : 'User deleted');
      fetchStaff();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete';
      toast.error(message);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`${API}/staff/${user.id}`, { is_active: !user.is_active });
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to update');
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
    <div className="space-y-6 animate-fade-in-up" data-testid="staff-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100 font-serif">{t('staff')}</h1>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A] gold-glow"
          data-testid="new-staff-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'es' ? 'Nuevo Usuario' : 'New User'}
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">{t('fullName')}</TableHead>
                <TableHead className="text-slate-400">{t('email')}</TableHead>
                <TableHead className="text-slate-400">{language === 'es' ? 'Rol' : 'Role'}</TableHead>
                <TableHead className="text-slate-400">{t('preferredLanguage')}</TableHead>
                <TableHead className="text-slate-400">{t('status')}</TableHead>
                <TableHead className="text-slate-400 text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    {t('noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((user) => (
                  <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-slate-200 font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-[#D4AF37]/20' : 'bg-slate-700'
                        }`}>
                          {user.role === 'admin' ? (
                            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        {user.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-sm ${
                        user.role === 'admin' 
                          ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Staff'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {user.language === 'es' ? 'Español' : 'English'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleActive(user)}
                        disabled={user.id === currentUser?.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(user)}
                        className="text-slate-400 hover:text-[#D4AF37]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        className="text-slate-400 hover:text-red-400"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 font-serif">
              {editingUser 
                ? (language === 'es' ? 'Editar Usuario' : 'Edit User') 
                : (language === 'es' ? 'Nuevo Usuario' : 'New User')
              }
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">{t('fullName')} *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-950 border-slate-800"
                required
                data-testid="staff-name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">{t('email')} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-950 border-slate-800"
                required
                data-testid="staff-email"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                {t('password')} {editingUser ? '(leave blank to keep)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-950 border-slate-800 pr-10"
                  required={!editingUser}
                  minLength={editingUser ? 0 : 6}
                  data-testid="staff-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{language === 'es' ? 'Rol' : 'Role'}</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t('preferredLanguage')}</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-slate-300">
                {formData.is_active 
                  ? (language === 'es' ? 'Usuario Activo' : 'User Active')
                  : (language === 'es' ? 'Usuario Inactivo' : 'User Inactive')
                }
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963A]"
                disabled={!formData.full_name || !formData.email}
                data-testid="staff-submit-btn"
              >
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
