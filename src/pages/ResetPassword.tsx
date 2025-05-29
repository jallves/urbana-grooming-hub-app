
import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

const ResetPassword: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md space-y-8">
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
    </div>
  );
};

export default ResetPassword;
