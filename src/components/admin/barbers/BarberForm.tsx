
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useBarberForm } from './hooks/useBarberForm';
import StaffProfileImage from '../staff/components/StaffProfileImage';
import StaffPersonalInfo from '../staff/components/StaffPersonalInfo';
import StaffProfessionalInfo from '../staff/components/StaffProfessionalInfo';
import StaffActiveStatus from '../staff/components/StaffActiveStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, KeyRound } from 'lucide-react';
import { BarberModuleAccess } from './BarberModuleAccess';
import { Input } from '@/components/ui/input';

interface BarberFormProps {
  barberId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const roles = [
  { value: 'barber', label: 'Barbeiro' },
  { value: 'admin', label: 'Administrador' }
];

const BarberForm: React.FC<BarberFormProps> = ({ barberId, onCancel, onSuccess }) => {
  const { 
    form,
    isEditing,
    isSubmitting,
    onSubmit,
    handlePasswordChange,
    isPasswordLoading,
  } = useBarberForm(barberId, onSuccess);

  const [showPasswordField, setShowPasswordField] = useState(false);
  const [customPassword, setCustomPassword] = useState('');

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
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Cargo e Permissões
            </TabsTrigger>
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
                  handleFileChange={() => {}} // Upload não implementado
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

          <TabsContent value="roles" className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Cargo</label>
              <select
                className="text-base font-semibold px-3 py-2 rounded-md border w-fit"
                {...form.register('role')}
                disabled={isEditing}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <div className="text-sm text-muted-foreground mt-1">
                O cargo só pode ser definido na criação.
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ações de senha</label>
              {!showPasswordField ? (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowPasswordField(true)}
                  className="mt-1"
                >
                  {isEditing ? 'Redefinir Senha' : 'Definir senha ao criar'}
                </Button>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <Input
                    type="password"
                    placeholder="Senha temporária"
                    value={customPassword}
                    onChange={e => setCustomPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPasswordLoading || !customPassword}
                    onClick={() => handlePasswordChange(customPassword)}
                  >
                    {isPasswordLoading ? 'Enviando...' : isEditing ? 'Redefinir Senha' : 'Definir Senha'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordField(false);
                      setCustomPassword('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                A senha será enviada para o e-mail do barbeiro.
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

