import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, IdCard, Lock, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { signInWithMatricula } from '@/lib/staffLogin';
import { useNavigate } from 'react-router-dom';
import { logAdminActivity } from '@/hooks/useActivityLogger';
import { sessionManager } from '@/hooks/useSessionManager';

interface BarberLoginFormProps {
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  onLoginSuccess?: (userId: string) => void;
}

const BarberLoginForm: React.FC<BarberLoginFormProps> = ({ loading, setLoading, onLoginSuccess }) => {
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const effectiveLoading = loading !== undefined ? loading : isLoading;
  const effectiveSetLoading = setLoading || setIsLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    effectiveSetLoading(true);

    try {
      const result = await signInWithMatricula(matricula, password);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        await logAdminActivity({
          action: 'login',
          entityType: 'session',
          entityId: user.id,
          newData: {
            userType: 'barber',
            matricula,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        });

        await sessionManager.createSession({
          userId: user.id,
          userType: 'barber',
          userEmail: user.email || undefined,
          userName: result.name || undefined,
          expiresInHours: 24
        });
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao painel do barbeiro!",
      });

      if (onLoginSuccess) {
        onLoginSuccess(result.userId);
      }

      navigate('/barbeiro');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Acesso negado. Favor verificar usuário e senha.",
        variant: "destructive",
      });
    } finally {
      effectiveSetLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="matricula" className="text-sm font-medium text-gray-300">
          Matrícula
        </Label>
        <div className="relative group">
          <IdCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-urbana-gold transition-colors" />
          <Input
            id="matricula"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            placeholder=""
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            className="pl-12 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl transition-all"
            required
            disabled={effectiveLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-300">
          Senha
        </Label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-urbana-gold transition-colors" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-12 pr-14 h-14 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl transition-all"
            required
            disabled={effectiveLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-700/50 rounded-lg transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={effectiveLoading}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 bg-gradient-to-r from-urbana-gold via-urbana-gold-light to-urbana-gold hover:shadow-lg hover:shadow-urbana-gold/30 text-black font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]" 
        disabled={effectiveLoading}
      >
        {effectiveLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5 mr-2" />
            Entrar
          </>
        )}
      </Button>
    </form>
  );
};

export default BarberLoginForm;
