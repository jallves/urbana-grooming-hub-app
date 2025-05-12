
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { UserWithRole, AppRole } from './types';

const roleSchema = z.object({
  role: z.enum(['admin', 'barber', 'user'] as const, { required_error: 'Selecione um cargo' }),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole;
  onUserUpdated: () => void;
}

const UserRoleDialog: React.FC<UserRoleDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: (user?.role as AppRole) || 'user',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        role: (user.role as AppRole) || 'user',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: RoleFormData) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Update user role in admin_users table
      const { error } = await supabase
        .from('admin_users')
        .update({ role: data.role })
        .eq('id', user.id);

      if (error) throw error;
      
      // Also update or create entry in user_roles table
      try {
        // Check if user already has a role entry
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        if (existingRole) {
          // Update existing role
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: data.role as AppRole })
            .eq('user_id', user.id);
            
          if (updateError) throw updateError;
        } else {
          // Create new role entry
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: data.role as AppRole });
            
          if (insertError) throw insertError;
        }
      } catch (roleError) {
        console.error('Erro ao atualizar tabela user_roles:', roleError);
        // Continue execution since the main update to admin_users was successful
      }
      
      toast.success('Cargo atualizado com sucesso!');
      onOpenChange(false);
      onUserUpdated();
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      toast.error('Erro ao atualizar cargo', { 
        description: (error as Error).message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Alterar Cargo
          </DialogTitle>
          <DialogDescription>
            Altere o cargo de {user.email}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="barber">Barbeiro</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 mt-4 text-sm text-muted-foreground">
              <p><strong>Permissões:</strong></p>
              <p><strong>Administrador:</strong> Acesso total ao sistema, incluindo configurações.</p>
              <p><strong>Barbeiro:</strong> Acesso à área do profissional, agendamentos e clientes.</p>
              <p><strong>Usuário:</strong> Acesso básico, sem permissões administrativas.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleDialog;
