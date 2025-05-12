
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { User, Settings, Clock, Bell, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BarberProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  workDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  workHours: {
    start: string;
    end: string;
  };
  commission: string;
  avatar_url?: string;
}

const BarberProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyApp, setNotifyApp] = useState(true);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  
  // State for profile information
  const [profile, setProfile] = useState<BarberProfile>({
    name: "André Silva",
    email: user?.email || "andre.silva@example.com",
    phone: "+55 11 98765-4321",
    bio: "Especialista em cortes masculinos com mais de 5 anos de experiência. Trabalho com degradê, disfarçado e cortes tradicionais.",
    workDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    workHours: {
      start: "09:00",
      end: "18:00"
    },
    commission: "60%"
  });

  // For password change
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  
  // Load barber profile data
  useEffect(() => {
    const fetchBarberProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // In a real app, fetch from database
        // For now, just use a timeout to simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // If this was real, we would update the profile state with data from API
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching barber profile:', error);
        toast.error('Erro ao carregar dados do perfil');
        setIsLoading(false);
      }
    };
    
    fetchBarberProfile();
  }, [user]);
  
  const handleProfileUpdate = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would save to a database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Perfil atualizado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (passwords.new.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, call authentication service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Senha atualizada com sucesso');
      
      // Clear password fields
      setPasswords({
        current: "",
        new: "",
        confirm: ""
      });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast.error('Erro ao atualizar senha');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSavePreferences = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, save preferences to database
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Preferências salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEnableTwoFactor = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, enable 2FA in authentication service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsTwoFactorEnabled(!isTwoFactorEnabled);
      toast.success(
        isTwoFactorEnabled 
          ? 'Autenticação em dois fatores desativada' 
          : 'Autenticação em dois fatores ativada'
      );
    } catch (error) {
      console.error('Erro ao configurar autenticação:', error);
      toast.error('Erro ao alterar configuração de autenticação');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <BarberLayout title="Meu Perfil">
      <div className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger 
              value="personal" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black flex gap-2 items-center"
            >
              <User className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black flex gap-2 items-center"
            >
              <Settings className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black flex gap-2 items-center"
            >
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Informações Pessoais</CardTitle>
                  <Button 
                    variant="outline" 
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isLoading}
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
                <CardDescription className="text-gray-400">
                  Atualize suas informações profissionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && !isEditing ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-zinc-800 text-white text-xl">
                          {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Nome Completo</Label>
                            <Input 
                              id="name" 
                              value={profile.name}
                              onChange={(e) => setProfile({...profile, name: e.target.value})}
                              disabled={!isEditing || isLoading}
                              className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-70"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={profile.email}
                              onChange={(e) => setProfile({...profile, email: e.target.value})}
                              disabled
                              className="bg-zinc-800 border-zinc-700 text-white opacity-70"
                            />
                            <p className="text-xs text-gray-400">*O email não pode ser alterado</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-white">Telefone</Label>
                            <Input 
                              id="phone" 
                              value={profile.phone}
                              onChange={(e) => setProfile({...profile, phone: e.target.value})}
                              disabled={!isEditing || isLoading}
                              className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-70"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="commission" className="text-white">Comissão</Label>
                            <Input 
                              id="commission" 
                              value={profile.commission}
                              disabled
                              className="bg-zinc-800 border-zinc-700 text-white opacity-70"
                            />
                            <p className="text-xs text-gray-400">*Definido pelo administrador</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-white">Biografia Profissional</Label>
                      <Textarea 
                        id="bio" 
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        disabled={!isEditing || isLoading}
                        className="bg-zinc-800 border-zinc-700 text-white h-24 disabled:opacity-70"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <Button 
                          className="bg-white text-black hover:bg-gray-200" 
                          onClick={handleProfileUpdate}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferências
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure suas preferências de notificação e agenda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Notificações</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-white">Notificações por Email</Label>
                            <p className="text-xs text-gray-400">Receba um email quando tiver novos agendamentos</p>
                          </div>
                          <Switch 
                            checked={notifyEmail} 
                            onCheckedChange={setNotifyEmail}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-white"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-white">Notificações por SMS</Label>
                            <p className="text-xs text-gray-400">Receba um SMS quando tiver novos agendamentos</p>
                          </div>
                          <Switch 
                            checked={notifySMS} 
                            onCheckedChange={setNotifySMS}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-white"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-white">Notificações no Aplicativo</Label>
                            <p className="text-xs text-gray-400">Receba notificações ao fazer login</p>
                          </div>
                          <Switch 
                            checked={notifyApp} 
                            onCheckedChange={setNotifyApp}
                            disabled={isLoading}
                            className="data-[state=checked]:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Horário Padrão de Trabalho
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-white block mb-2">Dias de trabalho</Label>
                          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                            {Object.entries(profile.workDays).map(([day, active]) => (
                              <Button 
                                key={day} 
                                variant={active ? "default" : "outline"}
                                className={
                                  active 
                                    ? "bg-white text-black hover:bg-gray-200" 
                                    : "border-zinc-700 text-white hover:bg-zinc-800"
                                }
                                disabled={isLoading}
                                onClick={() => {
                                  setProfile({
                                    ...profile,
                                    workDays: {
                                      ...profile.workDays,
                                      [day]: !active
                                    }
                                  });
                                }}
                              >
                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startHour" className="text-white">Horário Inicial</Label>
                            <Input 
                              id="startHour" 
                              type="time" 
                              value={profile.workHours.start}
                              onChange={(e) => setProfile({
                                ...profile, 
                                workHours: {...profile.workHours, start: e.target.value}
                              })}
                              disabled={isLoading}
                              className="bg-zinc-800 border-zinc-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endHour" className="text-white">Horário Final</Label>
                            <Input 
                              id="endHour" 
                              type="time" 
                              value={profile.workHours.end}
                              onChange={(e) => setProfile({
                                ...profile, 
                                workHours: {...profile.workHours, end: e.target.value}
                              })}
                              disabled={isLoading}
                              className="bg-zinc-800 border-zinc-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        className="bg-white text-black hover:bg-gray-200"
                        onClick={handleSavePreferences}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Salvando...' : 'Salvar Preferências'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie suas configurações de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading && !passwords.current && !passwords.new ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Alterar Senha</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-white">Senha Atual</Label>
                          <Input 
                            id="currentPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
                          <Input 
                            id="newPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-white">Confirme a Nova Senha</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="pt-2">
                          <Button 
                            className="bg-white text-black hover:bg-gray-200"
                            onClick={handleUpdatePassword}
                            disabled={isLoading || !passwords.current || !passwords.new || !passwords.confirm}
                          >
                            {isLoading ? 'Processando...' : 'Atualizar Senha'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Autenticação em Dois Fatores</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white">Ativar Autenticação em Dois Fatores</Label>
                          <p className="text-xs text-gray-400">Aumenta a segurança da sua conta exigindo um código além da senha</p>
                        </div>
                        <Switch 
                          checked={isTwoFactorEnabled}
                          onCheckedChange={handleEnableTwoFactor}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-800">
                      <h3 className="text-lg font-medium text-white mb-4">Registro de Atividades</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <div>
                            <p className="text-white">Login realizado</p>
                            <p className="text-xs text-gray-400">IP: 187.36.163.19</p>
                          </div>
                          <p className="text-sm text-gray-400">12/05/2025 00:44:24</p>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <div>
                            <p className="text-white">Perfil atualizado</p>
                            <p className="text-xs text-gray-400">Alterações nas informações pessoais</p>
                          </div>
                          <p className="text-sm text-gray-400">10/05/2025 14:22:10</p>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                          <div>
                            <p className="text-white">Login realizado</p>
                            <p className="text-xs text-gray-400">IP: 187.36.163.19</p>
                          </div>
                          <p className="text-sm text-gray-400">10/05/2025 09:15:33</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
