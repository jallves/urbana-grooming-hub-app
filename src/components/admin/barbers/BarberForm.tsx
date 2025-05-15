
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStaffForm } from '../staff/hooks/useStaffForm';
import StaffProfileImage from '../staff/components/StaffProfileImage';
import StaffPersonalInfo from '../staff/components/StaffPersonalInfo';
import StaffProfessionalInfo from '../staff/components/StaffProfessionalInfo';
import StaffActiveStatus from '../staff/components/StaffActiveStatus';
import { BarberModuleAccess } from './BarberModuleAccess';

const barberFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  phone: z.string().nullable().optional(),
  role: z.string().default('barber'),
  is_active: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  commission_rate: z.number().nullable().optional(),
  specialties: z.string().nullable().optional(),
  password: z.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .refine(
      (password) => /[A-Z]/.test(password),
      'A senha deve conter pelo menos uma letra maiúscula'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'A senha deve conter pelo menos uma letra minúscula'
    )
    .refine(
      (password) => /[0-9]/.test(password),
      'A senha deve conter pelo menos um número'
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type BarberFormValues = z.infer<typeof barberFormSchema>;

interface BarberFormProps {
  barberId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BarberForm: React.FC<BarberFormProps> = ({ barberId, onCancel, onSuccess }) => {
  const { 
    form,
    onSubmit: staffFormSubmit,
    isEditing,
    isLoadingStaff,
    handleFileChange,
    selectedFile,
    uploading,
    uploadProgress,
    isSubmitting
  } = useStaffForm(barberId, onSuccess, 'barber');

  const form2 = useForm<BarberFormValues>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'barber',
      is_active: true,
      image_url: '',
      experience: '',
      commission_rate: null,
      specialties: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Sync the forms when staff data is loaded
  useEffect(() => {
    if (!isLoadingStaff && form.getValues()) {
      const values = form.getValues();
      form2.reset({
        ...values,
        password: '',
        confirmPassword: '',
      });
    }
  }, [isLoadingStaff, form]);

  const onSubmit = async (values: BarberFormValues) => {
    try {
      // First save the staff record
      await staffFormSubmit(values);
      
      // If this is a new barber, create auth account
      if (!barberId && values.email) {
        // Create auth account with the password
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.name,
              role: 'barber'
            },
          }
        });

        if (error) {
          toast.error('Erro ao criar conta de acesso', {
            description: error.message
          });
          return;
        }
        
        if (data?.user) {
          // Add user to user_roles table as barber
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([
              { 
                user_id: data.user.id,
                role: 'barber'
              }
            ]);
  
          if (roleError) {
            toast.error('Erro ao definir permissões', {
              description: roleError.message
            });
          } else {
            toast.success('Conta de barbeiro criada com sucesso');
          }
        }
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao salvar barbeiro', {
        description: error.message
      });
    }
  };

  return (
    <Form {...form2}>
      <form onSubmit={form2.handleSubmit(onSubmit)} className="space-y-6">
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
            <TabsTrigger value="access" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Acesso ao Sistema
            </TabsTrigger>
            {barberId && (
              <TabsTrigger value="permissions" className="flex items-center gap-2">
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
                <StaffPersonalInfo form={form2} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="professional" className="space-y-6">
            <StaffProfessionalInfo form={form} />
            <StaffActiveStatus form={form} />
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form2.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha de Acesso</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Senha para acesso ao sistema" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form2.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite novamente a senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="font-medium text-foreground">Requisitos de senha:</div>
                    <ul className="list-disc pl-5">
                      <li>Mínimo de 6 caracteres</li>
                      <li>Pelo menos uma letra maiúscula</li>
                      <li>Pelo menos uma letra minúscula</li>
                      <li>Pelo menos um número</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {barberId && (
            <TabsContent value="permissions" className="space-y-6">
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
