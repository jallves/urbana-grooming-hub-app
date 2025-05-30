
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStaffForm, StaffFormValues } from '../../staff/hooks/useStaffForm';

export const useBarberForm = (barberId: string | null, onSuccess: () => void) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staffFormHook = useStaffForm(barberId, onSuccess, 'barber');

  const createUserAccount = async (email: string, password: string, name: string) => {
    console.log('Checking if user already exists...');
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const userExists = existingAuth.users?.find(user => user.email === email);
    
    if (userExists) {
      console.log('User already exists, checking roles...');
      
      // Check if user has barber role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userExists.id);
      
      const hasBarberRole = userRoles?.some(role => role.role === 'barber');
      
      if (!hasBarberRole) {
        // Add barber role to existing user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ 
            user_id: userExists.id,
            role: 'barber'
          }]);
          
        if (roleError) {
          console.error('Error adding barber role:', roleError);
          toast.error('Erro ao adicionar permissões de barbeiro ao usuário existente');
        } else {
          toast.success('Permissões de barbeiro adicionadas ao usuário existente');
        }
      } else {
        toast.success('Usuário já possui permissões de barbeiro');
      }
    } else {
      // Create new user account
      console.log('Creating new user account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          },
        }
      });

      if (signUpError) {
        console.error('Error creating user account:', signUpError);
        toast.error('Erro ao criar conta de usuário', {
          description: signUpError.message
        });
        throw signUpError;
      } else if (signUpData.user) {
        console.log('User account created successfully');
        
        // Add barber role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ 
            user_id: signUpData.user.id,
            role: 'barber'
          }]);
          
        if (roleError) {
          console.error('Error adding barber role:', roleError);
          toast.error('Erro ao configurar permissões de barbeiro');
        } else {
          console.log('Barber role added successfully');
          toast.success('Conta de usuário criada para o barbeiro');
        }
      }
    }
  };

  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Starting barber creation/update process...');
      
      // For new barbers with email and password, handle user account creation
      const userEmail = data.email || '';
      if (!barberId && userEmail && userEmail.trim() !== '' && password) {
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
        
        await createUserAccount(userEmail, password, data.name);
      }
      
      // Save barber data using the original onSubmit
      console.log('Saving barber staff data...');
      await staffFormHook.onSubmit(data);
      
      console.log('Barber creation/update completed successfully');
      
    } catch (error) {
      console.error('Error in barber creation process:', error);
      toast.error('Erro ao salvar barbeiro', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...staffFormHook,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordVisible,
    setPasswordVisible,
    isSubmitting,
    onSubmit,
  };
};
