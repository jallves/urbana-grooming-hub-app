
import React from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useBarberForm } from './hooks/useBarberForm';
import BarberFormTabs from './components/BarberFormTabs';

interface BarberFormProps {
  barberId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BarberForm: React.FC<BarberFormProps> = ({ barberId, onCancel, onSuccess }) => {
  const {
    form,
    onSubmit,
    handleFileChange,
    uploading,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordVisible,
    setPasswordVisible,
    isSubmitting,
  } = useBarberForm(barberId, onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BarberFormTabs
          form={form}
          barberId={barberId}
          handleFileChange={handleFileChange}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordVisible={passwordVisible}
          setPasswordVisible={setPasswordVisible}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting ? 'Salvando...' : barberId ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BarberForm;
