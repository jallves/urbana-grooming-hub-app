
import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

const BarberProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  
  // Mock data for barber profile
  const [profile, setProfile] = useState({
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
  
  const handleProfileUpdate = () => {
    // In a real app, this would save to a database
    console.log('Perfil atualizado:', profile);
    setIsEditing(false);
  };
  
  return (
    <BarberLayout title="Meu Perfil">
      <div className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="personal" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
              Preferências
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white data-[state=active]:bg-white data-[state=active]:text-black">
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
                  >
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
                <CardDescription className="text-gray-400">
                  Atualize suas informações profissionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-zinc-800 text-white text-xl">AS</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white">Nome Completo</Label>
                          <Input 
                            id="name" 
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            disabled={!isEditing}
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
                            disabled={!isEditing}
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
                      disabled={!isEditing}
                      className="bg-zinc-800 border-zinc-700 text-white h-24 disabled:opacity-70"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end">
                      <Button className="bg-white text-black hover:bg-gray-200" onClick={handleProfileUpdate}>
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Preferências</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure suas preferências de notificação e agenda
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          className="data-[state=checked]:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Horário Padrão de Trabalho</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white block mb-2">Dias de trabalho</Label>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                          {Object.keys(profile.workDays).map((day) => (
                            <Button 
                              key={day} 
                              variant={profile.workDays[day as keyof typeof profile.workDays] ? "default" : "outline"}
                              className={
                                profile.workDays[day as keyof typeof profile.workDays] 
                                  ? "bg-white text-black hover:bg-gray-200" 
                                  : "border-zinc-700 text-white hover:bg-zinc-800"
                              }
                              onClick={() => {
                                setProfile({
                                  ...profile,
                                  workDays: {
                                    ...profile.workDays,
                                    [day]: !profile.workDays[day as keyof typeof profile.workDays]
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
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="bg-white text-black hover:bg-gray-200">
                      Salvar Preferências
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Segurança</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie suas configurações de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white">Confirme a Nova Senha</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
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
                    <Switch className="data-[state=checked]:bg-white" />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-white text-black hover:bg-gray-200">
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
