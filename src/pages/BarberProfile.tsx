
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Staff } from '@/types/staff';
import { User, Info, Shield, Lock, X, Plus, Scissors } from 'lucide-react';

const BarberProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    specialties: [] as string[]
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  
  useEffect(() => {
    const fetchBarberProfile = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        
        setProfileData(data);
        
        // Initialize form data
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          experience: data.experience || '',
          specialties: data.specialties ? JSON.parse(data.specialties) : []
        });
      } catch (error) {
        console.error('Error in profile fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBarberProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };
  
  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(item => item !== specialty)
    }));
  };
  
  const handleProfileUpdate = async () => {
    if (!profileData?.id) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          name: formData.name,
          phone: formData.phone,
          experience: formData.experience,
          specialties: JSON.stringify(formData.specialties),
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        user.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      
      if (error) throw error;
      
      toast({
        title: 'E-mail enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.'
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erro ao enviar e-mail',
        description: 'Não foi possível enviar o e-mail de redefinição de senha.',
        variant: 'destructive'
      });
    }
  };
  
  if (loading) {
    return (
      <BarberLayout title="Meu Perfil">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full"></div>
        </div>
      </BarberLayout>
    );
  }
  
  return (
    <BarberLayout title="Meu Perfil">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Meu Perfil</h2>
          <p className="text-zinc-400">Gerencie suas informações pessoais e preferências</p>
        </div>
        
        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Dados Pessoais</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Informações Básicas</CardTitle>
                  </div>
                  <Button onClick={handleProfileUpdate} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData?.image_url || ''} alt={profileData?.name || 'Barbeiro'} />
                    <AvatarFallback className="text-2xl bg-zinc-800">{formData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium">{formData.name}</h3>
                    <p className="text-sm text-zinc-400">{formData.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary">Barbeiro</Badge>
                      {profileData?.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Telefone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="commission" className="text-sm font-medium">
                      Taxa de Comissão
                    </label>
                    <Input
                      id="commission"
                      value={profileData?.commission_rate ? `${profileData.commission_rate}%` : 'Não definido'}
                      disabled
                    />
                    <p className="text-xs text-zinc-400">Definido pelo administrador</p>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="experience" className="text-sm font-medium">
                      Experiência Profissional
                    </label>
                    <Textarea
                      id="experience"
                      name="experience"
                      value={formData.experience || ''}
                      onChange={handleInputChange}
                      placeholder="Descreva sua experiência e especialidades..."
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Especialidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                      <Scissors className="h-3 w-3" />
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(specialty)}
                        className="ml-1 rounded-full hover:bg-zinc-700 p-0.5"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remover</span>
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Adicionar especialidade..."
                    className="max-w-xs"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddSpecialty}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                <p className="text-sm text-zinc-400">
                  Adicione suas especialidades como "Corte Degradê", "Barba", "Sobrancelha", etc.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">Alterar Senha</h3>
                    <p className="text-sm text-zinc-400">
                      Mantenha sua conta segura com uma senha forte e única
                    </p>
                  </div>
                  <Button onClick={handlePasswordReset} variant="outline" className="w-full md:w-auto">
                    Redefinir Senha
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-medium">Autenticação em Dois Fatores</h3>
                    <p className="text-sm text-zinc-400">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Button variant="outline" className="w-full md:w-auto">
                    Configurar
                  </Button>
                </div>
                
                <Separator />
                
                <div className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-500">Proteja sua conta</h4>
                      <p className="text-sm text-zinc-300 mt-1">
                        Nunca compartilhe suas credenciais de acesso. Troque sua senha regularmente e use senhas diferentes para cada serviço.
                      </p>
                    </div>
                  </div>
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
