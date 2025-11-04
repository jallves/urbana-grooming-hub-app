
import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthContainer from '@/components/ui/containers/AuthContainer';

const ResetPassword: React.FC = () => {
  return (
    <AuthContainer 
      title="Costa Urbana"
      subtitle="Redefinir Senha"
    >
      <ResetPasswordForm />
    </AuthContainer>
  );
};

export default ResetPassword;
