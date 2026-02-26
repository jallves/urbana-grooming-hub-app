import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const clientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  clientId?: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ clientId, onCancel, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(!!clientId);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<ClientFormData | null>(null);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: '',
      email: '',
      whatsapp: '',
      data_nascimento: '',
    },
  });

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setIsLoadingData(true);
      const { data, error } = await supabase
        .from('painel_clientes')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          nome: data.nome || '',
          email: data.email || '',
          whatsapp: data.whatsapp || '',
          data_nascimento: data.data_nascimento || '',
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do cliente', {
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFormSubmit = (data: ClientFormData) => {
    // Para edição, mostrar confirmação. Para criação, executar direto.
    if (clientId) {
      setPendingData(data);
      setShowConfirmDialog(true);
    } else {
      executeSubmit(data);
    }
  };

  const executeSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);

      if (clientId) {
        const updateData = {
          nome: data.nome,
          email: data.email || null,
          whatsapp: data.whatsapp,
          data_nascimento: data.data_nascimento || null,
          updated_at: new Date().toISOString(),
        };
        
        const { data: updatedData, error } = await supabase
          .from('client_profiles')
          .update(updateData)
          .eq('id', clientId)
          .select();

        if (error) {
          throw error;
        }
        
        if (!updatedData || updatedData.length === 0) {
          throw new Error('Nenhum registro foi atualizado. Verifique suas permissões.');
        }
        
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Para criar novo cliente, usar signUp público
        const tempEmail = data.email || `cliente_${Date.now()}@temp.barbearia.com`;
        const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: {
            data: {
              user_type: 'client',
              nome: data.nome,
              whatsapp: data.whatsapp,
              data_nascimento: data.data_nascimento
            }
          }
        });

        if (authError) {
          throw authError;
        }

        if (!authData.user) {
          throw new Error('Falha ao criar usuário');
        }

        // Aguardar um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 500));

        // Atualizar o perfil com os dados corretos
        const { error: profileError } = await supabase
          .from('client_profiles')
          .upsert({
            id: authData.user.id,
            nome: data.nome,
            email: data.email || null,
            whatsapp: data.whatsapp,
            data_nascimento: data.data_nascimento || null
          });

        if (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
        }
        
        toast.success('Cliente criado com sucesso!');
      }

      onSuccess();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(clientId ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente', {
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" placeholder="Nome completo" {...form.register('nome')} />
            {form.formState.errors.nome && (
              <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              placeholder="(11) 99999-9999"
              {...form.register('whatsapp')}
            />
            {form.formState.errors.whatsapp && (
              <p className="text-sm text-red-500">{form.formState.errors.whatsapp.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cada cliente deve ter um número único. Este número será usado no Totem.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Data de Nascimento *</Label>
            <DateOfBirthPicker
              value={form.watch('data_nascimento') ? new Date(form.watch('data_nascimento') + 'T12:00:00') : undefined}
              onChange={(date) => form.setValue('data_nascimento', date ? format(date, 'yyyy-MM-dd') : '', { shouldValidate: true })}
            />
            {form.formState.errors.data_nascimento && (
              <p className="text-sm text-red-500">{form.formState.errors.data_nascimento.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {clientId ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              clientId ? 'Atualizar Cliente' : 'Criar Cliente'
            )}
          </Button>
        </div>
      </form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar os dados deste cliente? Esta ação irá atualizar as informações no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingData) {
                  executeSubmit(pendingData);
                  setPendingData(null);
                }
                setShowConfirmDialog(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientForm;
