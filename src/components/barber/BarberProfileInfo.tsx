
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Barber } from '@/types/barber';
import { Skeleton } from '@/components/ui/skeleton';

const BarberProfileInfo: React.FC = () => {
  const { user } = useAuth();
  const [barberInfo, setBarberInfo] = useState<Barber | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBarberInfo = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Use 'staff' table instead of 'barbers'
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .eq('role', 'barber')
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar informações do barbeiro:', error);
        } else if (data) {
          setBarberInfo({
            id: String(data.id), // use id as string
            name: data.name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            image_url: data.image_url ?? '',
            specialties: data.specialties ?? '', // Keep as string
            experience: data.experience ?? '', // Keep as string
            commission_rate: data.commission_rate ?? 0,
            is_active: data.is_active ?? true,
            role: data.role ?? 'barber',
            created_at: data.created_at ?? '',
            updated_at: data.updated_at ?? '',
          });
        } else {
          setBarberInfo(null);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do barbeiro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarberInfo();
  }, [user]);

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Informações do Barbeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px] bg-gray-700" />
              <Skeleton className="h-3 w-[150px] bg-gray-700" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full bg-gray-700" />
            <Skeleton className="h-3 w-full bg-gray-700" />
            <Skeleton className="h-3 w-3/4 bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Informações do Barbeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={barberInfo?.image_url || ''} />
            <AvatarFallback className="bg-gray-800 text-white text-xl">
              {barberInfo?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{barberInfo?.name || 'Barbeiro'}</h3>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {barberInfo?.phone && (
            <div>
              <p className="text-sm font-medium text-gray-400">Telefone</p>
              <p className="text-white">{barberInfo.phone}</p>
            </div>
          )}
          
          {barberInfo?.specialties && (
            <div>
              <p className="text-sm font-medium text-gray-400">Especialidades</p>
              <p className="text-white">{barberInfo.specialties}</p>
            </div>
          )}
          
          {barberInfo?.experience && (
            <div>
              <p className="text-sm font-medium text-gray-400">Experiência</p>
              <p className="text-white">{barberInfo.experience}</p>
            </div>
          )}
          
          {barberInfo?.commission_rate !== null && barberInfo?.commission_rate !== undefined && (
            <div>
              <p className="text-sm font-medium text-gray-400">Taxa de Comissão</p>
              <p className="text-white">{barberInfo.commission_rate}%</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarberProfileInfo;
