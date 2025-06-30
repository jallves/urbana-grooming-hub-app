
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppointmentFormData } from '@/types/appointment';

interface NotesFieldProps {
  formData: AppointmentFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Observações</Label>
      <Textarea
        id="notes"
        placeholder="Alguma observação especial?"
        value={formData.notes}
        onChange={handleInputChange}
        className="min-h-[80px]"
      />
    </div>
  );
};

export default NotesField;
