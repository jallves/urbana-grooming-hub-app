
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useStaffForm } from './hooks/useStaffForm';
import StaffPersonalInfo from './components/StaffPersonalInfo';
import StaffProfessionalInfo from './components/StaffProfessionalInfo';
import StaffProfileImage from './components/StaffProfileImage';
import StaffActiveStatus from './components/StaffActiveStatus';

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
    uploading,
    uploadProgress,
    isSubmitting
  } = useStaffForm(staffId, onSuccess);

  if (isEditing && isLoadingStaff) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <StaffPersonalInfo form={form} />
        <StaffProfessionalInfo form={form} />
        <StaffProfileImage form={form} handleFileChange={handleFileChange} />
        <StaffActiveStatus form={form} />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || uploading || uploadProgress}
          >
            {(isSubmitting || uploading || uploadProgress) && 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            }
            {isEditing ? 'Salvar Alterações' : 'Criar Profissional'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;
