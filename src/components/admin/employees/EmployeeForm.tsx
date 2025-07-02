
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from './types';

const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  role: z.enum(['admin', 'manager', 'barber'], {
    required_error: 'Selecione um cargo',
  }),
  status: z.enum(['active', 'inactive'], {
    required_error: 'Selecione um status',
  }),
  password: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(employee?.photo_url);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isEditing = !!employee;

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      role: employee?.role || 'barber',
      status: employee?.status || 'active',
      password: '',
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateEmployee(data);
      } else {
        await createEmployee(data);
      }
      toast({
        title: 'Sucesso',
        description: `Funcionário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar funcionário',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (data: EmployeeFormData) => {
    if (!data.password) {
      throw new Error('Senha é obrigatória para novos funcionários');
    }

    // Primeiro, criar o usuário na auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Depois, criar o registro na tabela employees
    const employeeData: CreateEmployeeData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status,
      password: data.password,
      photo_url: photoUrl,
    };

    const { error } = await supabase
      .from('employees')
      .insert([{ ...employeeData, user_id: authData.user.id }]);

    if (error) throw error;

    // Adicionar role na tabela user_roles se a role for compatível
    if (data.role === 'admin' || data.role === 'barber') {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: authData.user.id, role: data.role }]);

      if (roleError) console.warn('Erro ao adicionar role:', roleError);
    }
  };

  const updateEmployee = async (data: EmployeeFormData) => {
    if (!employee) return;

    const updateData: UpdateEmployeeData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status,
      photo_url: photoUrl,
    };

    if (data.password) {
      updateData.password = data.password;
    }

    const { error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employee.id);

    if (error) throw error;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'Arquivo muito grande. Máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `employees/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Staff Photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('Staff Photos')
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);
      toast({
        title: 'Sucesso',
        description: 'Foto carregada com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar foto',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Upload de Foto */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-urbana-gold/30">
            <AvatarImage src={photoUrl} />
            <AvatarFallback className="bg-urbana-gold/10 text-urbana-gold text-xl font-playfair">
              {form.watch('name')?.substring(0, 2).toUpperCase() || 'FU'}
            </AvatarFallback>
          </Avatar>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingPhoto}
            />
            <Button
              type="button"
              variant="outline"
              className="bg-black border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 font-raleway"
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploadingPhoto ? 'Carregando...' : 'Carregar Foto'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-urbana-gold font-raleway font-medium">Nome *</Label>
            <Input
              {...form.register('name')}
              className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="Nome completo"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-urbana-gold font-raleway font-medium">Email *</Label>
            <Input
              {...form.register('email')}
              type="email"
              className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="email@exemplo.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-urbana-gold font-raleway font-medium">Telefone *</Label>
            <Input
              {...form.register('phone')}
              className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="(11) 99999-9999"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-urbana-gold font-raleway font-medium">
              Senha {!isEditing && '*'}
            </Label>
            <Input
              {...form.register('password')}
              type="password"
              className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder={isEditing ? 'Deixe vazio para manter atual' : 'Senha do funcionário'}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.password.message}</p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label className="text-urbana-gold font-raleway font-medium">Cargo *</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as any)}
            >
              <SelectTrigger className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="admin" className="text-white hover:bg-gray-700 font-raleway">Administrador</SelectItem>
                <SelectItem value="manager" className="text-white hover:bg-gray-700 font-raleway">Gerente</SelectItem>
                <SelectItem value="barber" className="text-white hover:bg-gray-700 font-raleway">Barbeiro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.role.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-urbana-gold font-raleway font-medium">Status *</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as any)}
            >
              <SelectTrigger className="bg-black border-urbana-gold/30 text-white font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="active" className="text-white hover:bg-gray-700 font-raleway">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-white hover:bg-gray-700 font-raleway">Inativo</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-400 font-raleway">{form.formState.errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-black border-gray-600 text-gray-300 hover:bg-gray-800 font-raleway"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-urbana-gold text-black hover:bg-urbana-gold/90 font-raleway font-medium transition-all duration-300"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')} Funcionário
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
