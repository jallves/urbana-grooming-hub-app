
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Key, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
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

interface AuthUser {
  id: string;
  email?: string;
  last_sign_in_at?: string;
}

interface AuthResponse {
  users: AuthUser[];
}

const BarberAccessManagement: React.FC = () => {
  const { toast } = useToast();
  const [barbers, setBarbers] = useState<BarberAccessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<BarberAccessInfo | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const fetchBarbersAccessInfo = async () => {
    try {
      setLoading(true);

      // Buscar todos os barbeiros
      const { data: barbersData, error: barbersError } = await supabase
        .from('staff')
        .select('*')
        .eq('role', 'barber')
        .order('name');

      if (barbersError) {
        throw barbersError;
      }

      // Buscar usuários do auth usando service role key
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

      if (authError) {
        console.error('Erro ao buscar usuários:', authError);
      }

      // Combinar dados
      const barbersWithAccess = (barbersData || []).map((barber: Staff) => {
        const authUser = (authData?.users as AuthUser[] || []).find(
          (user: AuthUser) => user.email === barber.email
        );
        
        return {
          id: barber.id,
          name: barber.name,
          email: barber.email || '',
          hasAuthUser: !!authUser,
          lastLogin: authUser?.last_sign_in_at || undefined,
          isActive: barber.is_active
        };
      });

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
          <CardTitle className="flex items-center gap-2 text-urbana-gold font-playfair">
            <Settings className="h-5 w-5" />
            Gerenciamento de Acesso ao Painel
          </CardTitle>
          <p className="text-gray-300 text-sm font-raleway">
            Controle o acesso dos barbeiros ao painel administrativo
          </p>
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
                    disabled={!barber.email}
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
