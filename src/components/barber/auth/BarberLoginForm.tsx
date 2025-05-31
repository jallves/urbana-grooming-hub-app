
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { useBarberLogin } from './hooks/useBarberLogin';
import BarberLoginFields from './components/BarberLoginFields';

interface BarberLoginFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onLoginSuccess: (userId: string) => void;
}

const BarberLoginForm: React.FC<BarberLoginFormProps> = ({ 
  loading, 
  setLoading, 
  onLoginSuccess 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { form, onSubmit } = useBarberLogin({
    loading,
    setLoading,
    onLoginSuccess,
  });

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm 
        onBack={() => setShowForgotPassword(false)}
        redirectTo={`${window.location.origin}/barbeiro/login`}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <BarberLoginFields
          control={form.control}
          loading={loading}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        />

        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-black font-semibold" 
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
          <Button 
            type="button"
            variant="ghost" 
            className="w-full text-sm text-gray-400 hover:text-white"
            onClick={() => setShowForgotPassword(true)}
          >
            Esqueceu sua senha?
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BarberLoginForm;
