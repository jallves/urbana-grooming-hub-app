
import React from 'react';
import { Input } from '@/components/ui/input';

interface BarberAccountTabProps {
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  passwordVisible: boolean;
  setPasswordVisible: (visible: boolean) => void;
}

const BarberAccountTab: React.FC<BarberAccountTabProps> = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordVisible,
  setPasswordVisible,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
          Criação de Conta de Acesso (Opcional)
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Se o barbeiro já possui uma conta no sistema, deixe os campos de senha em branco.
          Caso contrário, defina uma senha para criar uma nova conta de acesso.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha (opcional)
            </label>
            <Input 
              id="password"
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco se o usuário já existe"
            />
            <p className="text-xs text-gray-500">
              Mínimo de 6 caracteres. Deixe vazio se o barbeiro já possui conta.
            </p>
          </div>
          
          {password && (
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirmar Senha
              </label>
              <Input 
                id="confirm-password"
                type={passwordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a senha"
              />
            </div>
          )}
          
          {password && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-password"
                checked={passwordVisible}
                onChange={() => setPasswordVisible(!passwordVisible)}
                className="rounded border-gray-300"
              />
              <label htmlFor="show-password" className="text-sm">
                Mostrar senha
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberAccountTab;
