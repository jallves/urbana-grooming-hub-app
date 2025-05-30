
import React from 'react';
import { Input } from "@/components/ui/input";
import { AppointmentFormData } from '@/types/appointment';

interface PersonalInfoFieldsProps {
  formData: AppointmentFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({ formData, handleInputChange }) => {
  return (
    <>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Nome Completo *
        </label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          required
          value={formData.name}
          onChange={handleInputChange}
          className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Telefone *
        </label>
        <Input
          id="phone"
          type="tel"
          placeholder="(11) 99999-9999"
          required
          value={formData.phone}
          onChange={handleInputChange}
          className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          E-mail (opcional)
        </label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleInputChange}
          className="bg-white/20 border-urbana-gold/50 placeholder:text-white/50"
        />
      </div>
    </>
  );
};

export default PersonalInfoFields;
