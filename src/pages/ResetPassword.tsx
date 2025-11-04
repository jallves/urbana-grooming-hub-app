
import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthContainer from '@/components/ui/containers/AuthContainer';

const ResetPassword: React.FC = () => {
  return (
    <AuthContainer>
      <div className="w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">Urbana Barbearia</h1>
          <p className="mt-2 text-muted-foreground">
            Redefinir senha
          </p>
        </div>
        
        <div className="bg-card shadow-lg rounded-lg p-6 border">
          <ResetPasswordForm />
        </div>
      </div>
    </AuthContainer>
  );
};

export default ResetPassword;
