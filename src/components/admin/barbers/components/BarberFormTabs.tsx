
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings, Lock } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { StaffFormValues } from '../../staff/hooks/useStaffForm';
import StaffProfileImage from '../../staff/components/StaffProfileImage';
import StaffPersonalInfo from '../../staff/components/StaffPersonalInfo';
import StaffProfessionalInfo from '../../staff/components/StaffProfessionalInfo';
import StaffActiveStatus from '../../staff/components/StaffActiveStatus';
import { BarberModuleAccess } from '../BarberModuleAccess';
import BarberAccountTab from './BarberAccountTab';

interface BarberFormTabsProps {
  form: UseFormReturn<StaffFormValues>;
  barberId: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (visible: boolean) => void;
}

const BarberFormTabs: React.FC<BarberFormTabsProps> = ({
  form,
  barberId,
  handleFileChange,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordVisible,
  setPasswordVisible,
}) => {
  return (
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
        <BarberAccountTab
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordVisible={passwordVisible}
          setPasswordVisible={setPasswordVisible}
        />
      </TabsContent>
      
      {barberId && (
        <TabsContent value="access" className="space-y-6">
          <BarberModuleAccess barberId={barberId} onSuccess={() => {}} />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default BarberFormTabs;
