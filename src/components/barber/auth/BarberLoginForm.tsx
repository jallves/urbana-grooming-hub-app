
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { useBarberLogin } from './hooks/useBarberLogin';
import BarberLoginFields from './components/BarberLoginFields';
import { LogIn, KeyRound } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Form Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
          <LogIn className="h-6 w-6 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Fazer Login</h2>
        <p className="text-zinc-400 text-sm">
          Acesse sua conta para gerenciar seus agendamentos
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <BarberLoginFields
            control={form.control}
            loading={loading}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <div className="space-y-4">
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
            
            {/* Forgot Password */}
            <Button 
              type="button"
              variant="ghost" 
              className="w-full text-sm text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 py-2 rounded-xl transition-colors"
              onClick={() => setShowForgotPassword(true)}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Esqueceu sua senha?
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BarberLoginForm;
