
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';
import PasswordToggle from './PasswordToggle';
import { BarberLoginForm } from '../hooks/useBarberLogin';
import { Mail, Lock } from 'lucide-react';

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
    <div className="space-y-4">
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-white font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-400" />
              Email
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="seu@email.com"
                {...field}
                disabled={loading}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl h-12 transition-colors"
              />
            </FormControl>
            <FormMessage className="text-red-400" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-white font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              Senha
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  {...field}
                  disabled={loading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl h-12 pr-12 transition-colors"
                />
                <PasswordToggle
                  showPassword={showPassword}
                  onToggle={onTogglePassword}
                />
              </div>
            </FormControl>
            <FormMessage className="text-red-400" />
          </FormItem>
        )}
      />
    </div>
  );
};

export default BarberLoginFields;
