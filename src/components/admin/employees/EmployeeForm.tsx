
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
  commission_rate: z.number().min(0).max(100).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // Proteção adicional
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
      commission_rate: employee?.commission_rate || 40,
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    if (loading || submitted) {
      return;
    }
    
    setLoading(true);
    setSubmitted(true);
    
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
      
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 800);
    } catch (error: any) {
      console.error('Error saving employee:', error);
      setSubmitted(false);
      
      if (error.message?.includes('policy') || error.message?.includes('permission')) {
        toast({
          title: 'Erro de Permissão',
          description: 'Você não tem permissão para realizar esta operação.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast({
          title: 'Erro',
          description: 'Já existe um funcionário com este email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao salvar funcionário. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (data: EmployeeFormData) => {
    const employeeData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: data.role,
      status: data.status,
      photo_url: photoUrl || null,
      commission_rate: data.commission_rate || 40,
    };

    try {
      const { data: insertedEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (employeeError) {
        console.error('Error inserting employee:', employeeError);
        throw new Error(`Erro ao criar funcionário: ${employeeError.message}`);
      }

      // Se for barbeiro, criar também na tabela staff
      if (data.role === 'barber') {
        const staffData = {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          role: 'barber',
          is_active: data.status === 'active',
          image_url: photoUrl || null,
          commission_rate: data.commission_rate || 40,
        };

        const { error: staffError } = await supabase
          .from('staff')
          .insert([staffData]);

        if (staffError) {
          console.error('Warning: Failed to sync to staff table:', staffError);
        }
      }
    } catch (error) {
      console.error('Exception during employee creation:', error);
      throw error;
    }
  };

  const updateEmployee = async (data: EmployeeFormData) => {
    if (!employee) return;

    console.log('Updating employee:', employee.id);

    // Se for barbeiro, verificar se existe na tabela staff e atualizar
    if (data.role === 'barber' || employee.role === 'barber') {
      const { data: staffData, error: staffFetchError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', employee.email)
        .single();

      if (!staffFetchError && staffData) {
        // Atualizar na tabela staff
        const { error: staffUpdateError } = await supabase
          .from('staff')
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            is_active: data.status === 'active',
            image_url: photoUrl,
            commission_rate: data.commission_rate || 40,
          })
          .eq('id', staffData.id);

        if (staffUpdateError) {
          console.error('Error updating staff:', staffUpdateError);
          throw new Error(staffUpdateError.message);
        }
      } else if (data.role === 'barber') {
        // Se não existe como staff mas o novo role é barber, criar
        await createEmployee(data);
        return;
      }
    }

    // Atualizar na tabela employees
    const updateData: UpdateEmployeeData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: data.status,
      photo_url: photoUrl,
      commission_rate: data.commission_rate || 40,
    };

    console.log('Update data:', updateData);

    const { error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employee.id);

    if (error) {
      console.error('Error updating employee:', error);
      throw new Error(error.message);
    }

    console.log('Employee updated successfully');
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

      console.log('Uploading photo to bucket staff-photos:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('staff-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('staff-photos')
        .getPublicUrl(filePath);

      console.log('Photo uploaded successfully, URL:', urlData.publicUrl);
      setPhotoUrl(urlData.publicUrl);
      
      toast({
        title: 'Sucesso',
        description: 'Foto carregada com sucesso!',
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar foto: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg">
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
              className="bg-white border-urbana-gold/30 text-urbana-gold hover:bg-urbana-gold/10 font-raleway touch-manipulation"
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
            <Label htmlFor="name" className="text-gray-900 font-raleway font-medium">Nome *</Label>
            <Input
              {...form.register('name')}
              className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="Nome completo"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 font-raleway">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-raleway font-medium">Email *</Label>
            <Input
              {...form.register('email')}
              type="email"
              className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="email@exemplo.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 font-raleway">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-900 font-raleway font-medium">Telefone *</Label>
            <Input
              {...form.register('phone')}
              className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
              placeholder="(11) 99999-9999"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600 font-raleway">{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label className="text-gray-900 font-raleway font-medium">Cargo *</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(value) => form.setValue('role', value as any)}
            >
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                <SelectItem value="admin" className="text-gray-900 hover:bg-gray-100 font-raleway">Administrador</SelectItem>
                <SelectItem value="manager" className="text-gray-900 hover:bg-gray-100 font-raleway">Gerente</SelectItem>
                <SelectItem value="barber" className="text-gray-900 hover:bg-gray-100 font-raleway">Barbeiro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-red-600 font-raleway">{form.formState.errors.role.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2 md:col-span-1">
            <Label className="text-gray-900 font-raleway font-medium">Status *</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as any)}
            >
              <SelectTrigger className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                <SelectItem value="active" className="text-gray-900 hover:bg-gray-100 font-raleway">Ativo</SelectItem>
                <SelectItem value="inactive" className="text-gray-900 hover:bg-gray-100 font-raleway">Inativo</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-600 font-raleway">{form.formState.errors.status.message}</p>
            )}
          </div>

          {/* Taxa de Comissão (apenas para barbeiros) */}
          {form.watch('role') === 'barber' && (
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="commission_rate" className="text-gray-900 font-raleway font-medium">
                Taxa de Comissão (%) *
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.watch('commission_rate') || 40}
                onChange={(e) => form.setValue('commission_rate', parseFloat(e.target.value))}
                className="bg-white border-gray-200 text-gray-900 font-raleway focus:border-urbana-gold focus:ring-urbana-gold/20"
                placeholder="40.00"
              />
              {form.formState.errors.commission_rate && (
                <p className="text-sm text-red-600 font-raleway">{form.formState.errors.commission_rate.message}</p>
              )}
              <p className="text-xs text-gray-500 font-raleway">
                Porcentagem de comissão sobre serviços (0-100%)
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 font-raleway touch-manipulation"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-urbana-gold to-yellow-500 text-white hover:from-urbana-gold/90 hover:to-yellow-600 font-raleway font-medium transition-all duration-300 touch-manipulation"
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
