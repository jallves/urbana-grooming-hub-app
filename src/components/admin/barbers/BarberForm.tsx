
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useStaffForm } from '../staff/hooks/useStaffForm';
import StaffProfileImage from '../staff/components/StaffProfileImage';
import StaffPersonalInfo from '../staff/components/StaffPersonalInfo';
import StaffProfessionalInfo from '../staff/components/StaffProfessionalInfo';
import StaffActiveStatus from '../staff/components/StaffActiveStatus';
import { BarberModuleAccess } from './BarberModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface BarberFormProps {
  barberId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BarberForm: React.FC<BarberFormProps> = ({ barberId, onCancel, onSuccess }) => {
  const { 
    form,
    onSubmit: originalOnSubmit,
    isEditing,
    isLoadingStaff,
    handleFileChange,
    selectedFile,
    uploading,
    uploadProgress,
    isSubmitting: originalIsSubmitting
  } = useStaffForm(barberId, onSuccess, 'barber');
  
  const [isSubmitting, setIsSubmitting] = useState(originalIsSubmitting);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Extended onSubmit function that also creates or updates the auth user
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Save barber data first (using the original onSubmit)
      await originalOnSubmit(data);
      
      // If we have an email, create or update the auth user
      if (data.email) {
        // Check if user already exists
        const { data: existingUsers, error: searchError } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', data.email)
          .maybeSingle();
          
        // For new barbers with no existing user account, create one
        if (!existingUsers && !barberId && password) {
          if (password !== confirmPassword) {
            toast.error('As senhas não correspondem');
            setIsSubmitting(false);
            return;
          }
          
          if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            setIsSubmitting(false);
            return;
          }
          
          // Register the user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: password,
            options: {
              data: {
                full_name: data.name,
              },
            }
          });

          if (signUpError) {
            console.error('Erro ao criar conta de usuário para o barbeiro:', signUpError);
            toast.error('Erro ao criar conta de usuário', {
              description: signUpError.message
            });
          } else if (signUpData.user) {
            // Add barber role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([{ 
                user_id: signUpData.user.id,
                role: 'barber'
              }]);
              
            if (roleError) {
              console.error('Erro ao adicionar role de barbeiro:', roleError);
              toast.error('Erro ao configurar permissões de barbeiro');
            } else {
              toast.success('Conta de usuário criada para o barbeiro', {
                description: 'O barbeiro já pode acessar o painel admin'
              });
            }
          }
        }
      }
      
      // Call the original success handler
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar barbeiro:', error);
      toast.error('Erro ao salvar barbeiro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Informações Profissionais
            </TabsTrigger>
            {!barberId && (
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Conta de Acesso
              </TabsTrigger>
            )}
            {barberId && (
              <TabsTrigger value="access" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões de Acesso
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <StaffProfileImage 
                  form={form}
                  handleFileChange={handleFileChange}
                />
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <StaffPersonalInfo form={form} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="professional" className="space-y-6">
            <StaffProfessionalInfo form={form} />
            <StaffActiveStatus form={form} />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                Criação de Conta de Acesso
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Estas credenciais permitirão que o barbeiro acesse o painel administrativo.
                A senha deve ter pelo menos 6 caracteres.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input 
                    id="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite uma senha"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirmar Senha
                  </label>
                  <Input 
                    id="confirm-password"
                    type={passwordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a senha"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-password"
                    checked={passwordVisible}
                    onChange={() => setPasswordVisible(!passwordVisible)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="show-password" className="text-sm">
                    Mostrar senha
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {barberId && (
            <TabsContent value="access" className="space-y-6">
              <BarberModuleAccess barberId={barberId} onSuccess={() => {}} />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : barberId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BarberForm;
