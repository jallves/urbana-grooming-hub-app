import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Briefcase, ShieldCheck, KeyRound } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { BarberFormValues } from './hooks/useBarberForm';
import StaffProfileImage from '../staff/components/StaffProfileImage';
import StaffPersonalInfo from '../staff/components/StaffPersonalInfo';
import StaffProfessionalInfo from '../staff/components/StaffProfessionalInfo';
import StaffActiveStatus from '../staff/components/StaffActiveStatus';
import { BarberPanelAccess } from './BarberPanelAccess';
import { Label } from '@/components/ui/label';

interface BarberFormTabsProps {
  form: UseFormReturn<BarberFormValues>;
  isEditing: boolean;
  isSubmitting: boolean;
  barberId: string | null;
  onSubmit: (data: BarberFormValues) => void;
  onCancel: () => void;
}

const roles = [
  { value: 'barber', label: 'Barbeiro' },
  { value: 'admin', label: 'Administrador' }
];

export const BarberFormTabs: React.FC<BarberFormTabsProps> = ({
  form,
  isEditing,
  isSubmitting,
  barberId,
  onSubmit,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const barberEmail = form.watch('email');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 h-auto p-1">
            <TabsTrigger 
              value="personal" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informações Pessoais</span>
              <span className="sm:hidden">Pessoal</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="professional" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Informações Profissionais</span>
              <span className="sm:hidden">Profissional</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="roles" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Cargos e Permissões</span>
              <span className="sm:hidden">Cargos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="access" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Acesso ao Sistema</span>
              <span className="sm:hidden">Acesso</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba: Informações Pessoais */}
          <TabsContent value="personal" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <StaffProfileImage 
                    form={form}
                    handleFileChange={() => {}} 
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <StaffPersonalInfo form={form} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba: Informações Profissionais */}
          <TabsContent value="professional" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Profissionais</h3>
              <div className="space-y-6">
                <StaffProfessionalInfo form={form} />
                <div className="pt-4 border-t border-gray-200">
                  <StaffActiveStatus form={form} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba: Cargos e Permissões */}
          <TabsContent value="roles" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo no Sistema</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Cargo Atribuído
                  </Label>
                  <select
                    className="w-full md:w-auto text-base font-semibold px-4 py-2.5 rounded-md border border-gray-300 bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    {...form.register('role')}
                    disabled={isEditing}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Importante:</strong> O cargo só pode ser definido durante a criação do barbeiro e não pode ser alterado posteriormente.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Sobre os Cargos</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span><strong>Barbeiro:</strong> Acesso ao painel profissional com visualização de agendamentos pessoais, comissões e estatísticas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span><strong>Administrador:</strong> Acesso completo ao painel administrativo com gestão de barbeiros, clientes, finanças e relatórios.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Aba: Acesso ao Sistema */}
          <TabsContent value="access" className="space-y-6">
            <BarberPanelAccess 
              barberEmail={barberEmail || ''}
              barberId={barberId || ''}
            />
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Atualizar Barbeiro' : 'Criar Barbeiro'
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
};
