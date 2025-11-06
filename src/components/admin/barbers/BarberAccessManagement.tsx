import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Key, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRPC } from '@/types/supabase-rpc';
import BarberPasswordManager from './BarberPasswordManager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Staff } from '@/types/barber';

interface BarberAccessInfo {
  id: string;
  name: string;
  email: string;
  hasAuthUser: boolean;
  lastLogin?: string;
  isActive: boolean;
}

const BarberAccessManagement: React.FC = () => {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<BarberAccessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<BarberAccessInfo | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const checkUserAuthStatus = async (email: string): Promise<boolean> => {
    try {
      console.log('Verificando status de autenticação para:', email);
      
      // Usar a função RPC para verificar se existe um usuário auth com este email
      const { data, error } = await supabaseRPC.checkAuthUserExists(email);

      if (error) {
        console.error('Erro ao verificar usuário:', error);
        // Se a função RPC não existir, usar método alternativo
        return await checkUserByRole(email);
      }

      console.log('Status do usuário:', data);
      return Boolean(data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return await checkUserByRole(email);
    }
  };

  const checkUserByRole = async (email: string): Promise<boolean> => {
    try {
      // Verificar se existe uma role de barbeiro para este email
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('role', 'barber');

      if (error) {
        console.error('Erro ao buscar roles:', error);
        return false;
      }

      // Verificar se algum dos usuários com role barber tem este email
      const hasUser = userRoles?.some((role: any) => 
        role.users?.email === email
      ) || false;

      console.log('Usuário encontrado por role:', hasUser);
      return hasUser;
    } catch (error) {
      console.error('Erro ao verificar por role:', error);
      return false;
    }
  };

  const fetchBarbersAccessInfo = async () => {
    try {
      setLoading(true);
      console.log('Buscando informações de acesso dos barbeiros...');

      // Buscar todos os barbeiros
      const { data: barbersData, error: barbersError } = await supabase
        .from('staff')
        .select('*')
        .eq('role', 'barber')
        .order('name');

      if (barbersError) {
        console.error('Erro ao buscar barbeiros:', barbersError);
        throw barbersError;
      }

      console.log('Barbeiros encontrados:', barbersData);

      // Verificar status de autenticação para cada barbeiro
      const barbersWithAccess = await Promise.all(
        (barbersData || []).map(async (barber: Staff) => {
          let hasAuthUser = false;
          
          if (barber.email) {
            hasAuthUser = await checkUserAuthStatus(barber.email);
          }

          return {
            id: barber.id,
            name: barber.name,
            email: barber.email || '',
            hasAuthUser,
            lastLogin: undefined,
            isActive: barber.is_active
          };
        })
      );

      console.log('Barbeiros com status de acesso:', barbersWithAccess);
      setBarbers(barbersWithAccess);

    } catch (error: any) {
      console.error('Erro ao buscar informações de acesso:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações de acesso dos barbeiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbersAccessInfo();
  }, []);

  const handleManagePassword = (barber: BarberAccessInfo) => {
    setSelectedBarber(barber);
    setIsPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setSelectedBarber(null);
    // Recarregar dados após fechar o dialog
    fetchBarbersAccessInfo();
  };

  const handleRefresh = () => {
    fetchBarbersAccessInfo();
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="flex items-center justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-gray-900 font-playfair text-base sm:text-lg">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                Gerenciamento de Acesso ao Painel
              </CardTitle>
              <p className="text-gray-700 text-xs sm:text-sm font-raleway mt-1">
                Controle o acesso dos barbeiros ao painel administrativo
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-white w-full sm:w-auto touch-manipulation"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {barbers.map((barber) => (
              <div 
                key={barber.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full flex-shrink-0">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{barber.name}</span>
                      {barber.hasAuthUser ? (
                        <Badge className="bg-green-600 text-white text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Com Acesso
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-600 text-gray-300 text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sem Acesso
                        </Badge>
                      )}
                      
                      {!barber.isActive && (
                        <Badge variant="destructive" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-700">
                      {barber.email ? (
                        <span className="block truncate">{barber.email}</span>
                      ) : (
                        <span className="text-red-400">Email não configurado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleManagePassword(barber)}
                    size="sm"
                    className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 text-xs sm:text-sm w-full sm:w-auto touch-manipulation"
                    disabled={!barber.email || !barber.isActive}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {barber.hasAuthUser ? 'Gerenciar' : 'Criar Acesso'}
                  </Button>
                </div>
              </div>
            ))}

            {barbers.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <p className="text-gray-600 text-sm sm:text-base">Nenhum barbeiro encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para gerenciar senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-urbana-gold text-base sm:text-lg">
              Gerenciar Acesso ao Painel
            </DialogTitle>
          </DialogHeader>
          
          {selectedBarber && (
            <BarberPasswordManager
              barberId={selectedBarber.id}
              barberName={selectedBarber.name}
              barberEmail={selectedBarber.email}
              onClose={handleClosePasswordDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarberAccessManagement;
