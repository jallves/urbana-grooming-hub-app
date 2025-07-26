
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Key, CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

  const checkUserAuthStatus = async (email: string) => {
    try {
      // Verificar se existe um usuário autenticado com este email
      // Fazemos isso tentando fazer signIn com credenciais inválidas
      // Se o usuário existe, receberemos um erro específico
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'test-invalid-password-check-existence'
      });

      // Se o erro for "Invalid login credentials", significa que o usuário existe
      // Se for "Email not confirmed" ou similar, também existe
      // Se for outro tipo de erro, pode não existir
      const userExists = error?.message?.includes('Invalid login credentials') || 
                        error?.message?.includes('Email not confirmed') ||
                        error?.message?.includes('Password') ||
                        error?.message?.includes('invalid') ||
                        error?.message?.includes('wrong');

      return userExists || false;
    } catch (error) {
      console.log('Erro ao verificar usuário:', error);
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
            lastLogin: undefined, // Não conseguimos obter esta info facilmente
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
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-urbana-gold font-playfair">
                <Settings className="h-5 w-5" />
                Gerenciamento de Acesso ao Painel
              </CardTitle>
              <p className="text-gray-300 text-sm font-raleway mt-1">
                Controle o acesso dos barbeiros ao painel administrativo
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold hover:text-black"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            {barbers.map((barber) => (
              <div 
                key={barber.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-urbana-gold to-yellow-500 rounded-full">
                    <User className="h-5 w-5 text-black" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{barber.name}</span>
                      {barber.hasAuthUser ? (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Com Acesso
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Sem Acesso
                        </Badge>
                      )}
                      
                      {!barber.isActive && (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-300">
                      {barber.email ? (
                        <>
                          <span>{barber.email}</span>
                          {barber.lastLogin && (
                            <span className="ml-2 text-gray-400">
                              • Último login: {new Date(barber.lastLogin).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-red-400">Email não configurado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleManagePassword(barber)}
                    size="sm"
                    className="bg-urbana-gold text-black hover:bg-urbana-gold/90"
                    disabled={!barber.email || !barber.isActive}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {barber.hasAuthUser ? 'Gerenciar' : 'Criar Acesso'}
                  </Button>
                </div>
              </div>
            ))}

            {barbers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum barbeiro encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para gerenciar senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-urbana-gold">
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
