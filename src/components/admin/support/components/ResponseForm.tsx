
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ResponseFormProps {
  newResponse: string;
  setNewResponse: (response: string) => void;
  handleSubmitResponse: () => Promise<void>;
  isSubmitting: boolean;
}

const ResponseForm: React.FC<ResponseFormProps> = ({ 
  newResponse, 
  setNewResponse, 
  handleSubmitResponse, 
  isSubmitting 
}) => {
  return (
    <div className="space-y-3 mt-6">
      <label htmlFor="response" className="block text-sm font-medium">
        Adicionar Resposta
      </label>
      <Textarea
        id="response"
        rows={4}
        placeholder="Digite sua resposta aqui..."
        value={newResponse}
        onChange={(e) => setNewResponse(e.target.value)}
        className="w-full"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSubmitResponse}
          disabled={!newResponse.trim() || isSubmitting}
          className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Resposta'}
        </button>
      </div>
    </div>
  );
};

export default ResponseForm;
