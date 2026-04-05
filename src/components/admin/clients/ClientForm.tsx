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
import { KeyRound, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

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

  // Password reset state
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [sendEmailOnReset, setSendEmailOnReset] = useState(true);

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
        setClientUserId(data.user_id || null);
        setClientEmail(data.email || null);
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
    if (clientId) {
      setPendingData(data);
      setShowConfirmDialog(true);
    } else {
      executeSubmit(data);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += specials.charAt(Math.floor(Math.random() * specials.length));
    pwd += Math.floor(Math.random() * 10);
    setNewPassword(pwd);
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!clientUserId) {
      toast.error('Este cliente não possui conta de acesso. Não é possível redefinir a senha.');
      return;
    }

    try {
      setIsResettingPassword(true);

      // Use admin-auth-operations to update password
      const { data: result, error } = await supabase.functions.invoke('admin-auth-operations', {
        body: {
          operation: 'update_user_password',
          user_id: clientUserId,
          password: newPassword,
        },
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || 'Erro ao redefinir senha');

      // Send email with new password if enabled
      if (sendEmailOnReset && clientEmail) {
        try {
          await supabase.functions.invoke('send-receipt-email', {
            body: {
              clientName: form.getValues('nome'),
              clientEmail: clientEmail,
              transactionType: 'service',
              items: [{ name: 'Redefinição de Senha', price: 0 }],
              total: 0,
              paymentMethod: 'N/A',
              transactionDate: new Date().toISOString(),
              // Custom fields for password reset email
              isPasswordReset: true,
              newPassword: newPassword,
            },
          });
          toast.success('Senha redefinida e enviada por e-mail!', {
            description: `Nova senha enviada para ${clientEmail}`,
          });
        } catch (emailError) {
          console.error('Erro ao enviar e-mail:', emailError);
          toast.success('Senha redefinida com sucesso!', {
            description: `⚠️ Não foi possível enviar o e-mail. Informe a senha manualmente: ${newPassword}`,
            duration: 15000,
          });
        }
      } else {
        toast.success('Senha redefinida com sucesso!', {
          description: clientEmail 
            ? 'Informe a nova senha ao cliente.' 
            : 'Cliente sem e-mail cadastrado. Informe a senha manualmente.',
        });
      }

      setNewPassword('');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha', {
        description: (error as Error).message,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const executeSubmit = async (data: ClientFormData) => {
    try {
      setIsLoading(true);

      if (clientId) {
        // UPDATE existing client
        const updateData = {
          nome: data.nome,
          email: data.email || null,
          whatsapp: data.whatsapp,
          data_nascimento: data.data_nascimento || null,
          updated_at: new Date().toISOString(),
        };
        
        const { data: updatedData, error } = await supabase
          .from('painel_clientes')
          .update(updateData)
          .eq('id', clientId)
          .select();

        if (error) throw error;
        
        if (!updatedData || updatedData.length === 0) {
          throw new Error('Nenhum registro foi atualizado. Verifique suas permissões.');
        }
        
        toast.success('Cliente atualizado com sucesso!');
      } else {
        // CREATE new client - insert directly into painel_clientes
        // Verify cross-role email constraint
        if (data.email) {
          const emailNorm = data.email.trim().toLowerCase();
          
          const [barberCheck, staffCheck, employeeCheck, existingClient] = await Promise.all([
            supabase.from('painel_barbeiros').select('nome').eq('email', emailNorm).maybeSingle(),
            supabase.from('staff').select('name').eq('email', emailNorm).maybeSingle(),
            supabase.from('employees').select('name').eq('email', emailNorm).maybeSingle(),
            supabase.from('painel_clientes').select('nome').eq('email', emailNorm).maybeSingle(),
          ]);

          if (barberCheck.data) {
            throw new Error(`Este e-mail já está cadastrado como barbeiro (${barberCheck.data.nome}).`);
          }
          if (staffCheck.data) {
            throw new Error(`Este e-mail já está cadastrado como funcionário (${staffCheck.data.name}).`);
          }
          if (employeeCheck.data) {
            throw new Error(`Este e-mail já está cadastrado como funcionário (${employeeCheck.data.name}).`);
          }
          if (existingClient.data) {
            throw new Error(`Este e-mail já está cadastrado como cliente (${existingClient.data.nome}).`);
          }
        }

        // Check duplicate WhatsApp
        const whatsappNorm = data.whatsapp.replace(/\D/g, '');
        const { data: allClients } = await supabase
          .from('painel_clientes')
          .select('nome, whatsapp')
          .not('whatsapp', 'is', null);

        const duplicateWhatsapp = allClients?.find(c => 
          c.whatsapp?.replace(/\D/g, '') === whatsappNorm
        );

        if (duplicateWhatsapp) {
          throw new Error(`Este WhatsApp já está cadastrado para o cliente ${duplicateWhatsapp.nome}.`);
        }

        // Insert directly into painel_clientes
        const { error: insertError } = await supabase
          .from('painel_clientes')
          .insert({
            nome: data.nome.trim(),
            email: data.email?.trim().toLowerCase() || null,
            whatsapp: data.whatsapp.trim(),
            data_nascimento: data.data_nascimento || null,
          });

        if (insertError) throw insertError;
        
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

        {/* Password Reset Section - Only shown when editing */}
        {clientId && clientUserId && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-base">Redefinir Senha do Cliente</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="whitespace-nowrap"
                  >
                    Gerar senha
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmailOnReset}
                  onChange={(e) => setSendEmailOnReset(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Enviar nova senha por e-mail para o cliente
                  {!clientEmail && (
                    <span className="text-destructive text-xs">(sem e-mail cadastrado)</span>
                  )}
                </Label>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || !newPassword}
                className="gap-2"
              >
                {isResettingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Redefinir Senha
              </Button>
            </div>
          </>
        )}

        {clientId && !clientUserId && !isLoadingData && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Este cliente não possui conta de acesso ao sistema. 
                Para criar acesso, o cliente deve se registrar pelo app ou totem.
              </p>
            </div>
          </>
        )}

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
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
