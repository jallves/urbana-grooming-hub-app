
import React, { useState, useEffect } from 'react';
import BarberLayout from '../components/barber/BarberLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, User, Phone, Mail, Scissors, Percent } from 'lucide-react';
import { Staff } from '@/types/staff';

const BarberProfile: React.FC = () => {
  const { user } = useAuth();
  const [barberData, setBarberData] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarberProfile = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .single();
          
        if (error) {
          console.error('Error fetching barber profile:', error);
          toast.error('Erro ao carregar dados do perfil');
        } else if (data) {
          setBarberData(data);
        }
      } catch (err) {
        console.error('Error in barber profile fetch:', err);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBarberProfile();
  }, [user]);

  if (loading) {
    return (
      <BarberLayout title="Meu Perfil">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-white rounded-full"></div>
        </div>
      </BarberLayout>
    );
  }

  if (!barberData) {
    return (
      <BarberLayout title="Meu Perfil">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-medium">Perfil não encontrado</h3>
              <p className="mt-2 text-zinc-400">
                Não foi possível carregar seus dados. Por favor, entre em contato com o administrador.
              </p>
            </div>
          </CardContent>
        </Card>
      </BarberLayout>
    );
  }

  // Format specialties for display if they exist
  const specialtiesList = barberData.specialties 
    ? barberData.specialties.split(',').map(s => s.trim()) 
    : [];

  return (
    <BarberLayout title="Meu Perfil">
      <div className="space-y-6">
        <Card>
          <CardHeader className="relative">
            <div className="absolute right-4 top-4">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-24 w-24">
                {barberData.image_url ? (
                  <AvatarImage src={barberData.image_url} alt={barberData.name} />
                ) : (
                  <AvatarFallback className="text-2xl">
                    {barberData.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-2xl mb-2">{barberData.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{barberData.role || 'Barbeiro'}</Badge>
                  {barberData.is_active ? (
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
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações de Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-zinc-400" />
                    <span>{barberData.email || 'Nenhum e-mail cadastrado'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-zinc-400" />
                    <span>{barberData.phone || 'Nenhum telefone cadastrado'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Profissionais</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-zinc-400" />
                    <div>
                      <span className="block">Especialidades</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialtiesList.length > 0 ? (
                          specialtiesList.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-400">Nenhuma especialidade cadastrada</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Percent className="h-5 w-5 text-zinc-400" />
                    <div>
                      <span className="block">Taxa de Comissão</span>
                      <span className="text-sm">{barberData.commission_rate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Experiência</h3>
              <p className="text-zinc-400">
                {barberData.experience || 'Nenhuma informação sobre experiência cadastrada'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-zinc-400">
                Para alterar sua senha, clique no botão abaixo e siga as instruções.
              </p>
              <Button>
                Alterar senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
};

export default BarberProfile;
