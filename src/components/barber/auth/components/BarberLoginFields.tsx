
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';
import PasswordToggle from './PasswordToggle';

interface BarberLoginForm {
  email: string;
  password: string;
}

interface BarberLoginFieldsProps {
  control: Control<BarberLoginForm>;
  loading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}

const BarberLoginFields: React.FC<BarberLoginFieldsProps> = ({
  control,
  loading,
  showPassword,
  onTogglePassword,
}) => {
  return (
    <>
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="seu@email.com"
                {...field}
                disabled={loading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Senha</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  {...field}
                  disabled={loading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
                />
                <PasswordToggle
                  showPassword={showPassword}
                  onToggle={onTogglePassword}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default BarberLoginFields;
