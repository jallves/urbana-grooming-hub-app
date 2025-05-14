
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useStaffForm } from './hooks/useStaffForm';
import StaffProfileImage from './components/StaffProfileImage';
import StaffPersonalInfo from './components/StaffPersonalInfo';
import StaffProfessionalInfo from './components/StaffProfessionalInfo';
import StaffActiveStatus from './components/StaffActiveStatus';
import StaffModuleAccess from './components/StaffModuleAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Settings } from 'lucide-react';

interface StaffFormProps {
  staffId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const StaffForm: React.FC<StaffFormProps> = ({ staffId, onCancel, onSuccess }) => {
  const { 
    form,
    onSubmit,
    isEditing,
    isLoadingStaff,
    handleFileChange,
    selectedFile,
    uploading,
    uploadProgress,
    isSubmitting
  } = useStaffForm(staffId, onSuccess);

  useEffect(() => {
    if (staffId) {
      // Fetch staff data for editing
      // The useStaffForm hook should handle fetching and setting default values
    }
  }, [staffId]);

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
            {staffId && (
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
          
          {staffId && (
            <TabsContent value="access" className="space-y-6">
              <StaffModuleAccess staffId={staffId} onSuccess={() => {}} />
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : staffId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;
