import React from 'react';
import { useBarberForm } from './hooks/useBarberForm';
import { BarberFormTabs } from './BarberFormTabs';

interface BarberFormProps {
  barberId: string | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const BarberForm: React.FC<BarberFormProps> = ({ barberId, onCancel, onSuccess }) => {
  const { 
    form,
    isEditing,
    isSubmitting,
    onSubmit,
  } = useBarberForm(barberId, onSuccess);

  return (
    <BarberFormTabs
      form={form}
      isEditing={isEditing}
      isSubmitting={isSubmitting}
      barberId={barberId}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

export default BarberForm;
