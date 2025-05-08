
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface NotesFieldProps {
  notes: string | undefined;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const NotesField: React.FC<NotesFieldProps> = ({ notes, handleInputChange }) => {
  return (
    <div>
      <label htmlFor="notes" className="block text-sm font-medium mb-2">
        Observações Adicionais
      </label>
      <Textarea
        id="notes"
        placeholder="Pedidos especiais ou informações adicionais"
        rows={4}
        value={notes || ''}
        onChange={handleInputChange}
        className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
      />
    </div>
  );
};

export default NotesField;
