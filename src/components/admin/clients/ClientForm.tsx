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

  const onSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);

      if (clientId) {
        // Atualizar client_profiles (tabela real)
        const { error } = await supabase
          .from('client_profiles')
          .update({
            nome: data.nome,
            whatsapp: data.whatsapp,
            data_nascimento: data.data_nascimento || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clientId);

        // Atualizar email em auth.users se necessário
        if (data.email) {
          await supabase.auth.admin.updateUserById(clientId, {
            email: data.email
          });
        }

        if (error) {
          throw error;
        }
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar usuário via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email || `${Date.now()}@temp.com`,
          password: Math.random().toString(36).slice(-8),
          email_confirm: true,
          user_metadata: {
            user_type: 'client',
            nome: data.nome,
            whatsapp: data.whatsapp,
            data_nascimento: data.data_nascimento
          }
        });

        if (authError) {
          throw authError;
        }

        // O perfil será criado automaticamente pelo trigger
        // Apenas precisamos garantir que os dados estejam corretos
        const { error: profileError } = await supabase
          .from('client_profiles')
          .update({
            nome: data.nome,
            whatsapp: data.whatsapp,
            data_nascimento: data.data_nascimento || null
          })
          .eq('id', authData.user.id);

        if (profileError) {
          throw profileError;
        }
        toast.success('Cliente criado com sucesso!');
      }

      onSuccess();
    } catch (error) {
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
    <form
      onSubmit={form.handleSubmit(onSubmit)}
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
          <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
          <Input id="data_nascimento" type="date" {...form.register('data_nascimento')} />
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
  );
};

export default ClientForm;
