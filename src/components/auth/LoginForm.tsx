
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ loading, setLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Rate limiting: bloquear após 5 tentativas por 15 minutos
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos em ms

  useEffect(() => {
    // Verificar se há bloqueio ativo
    const blockData = localStorage.getItem('loginBlock');
    if (blockData) {
      const { blockedUntil } = JSON.parse(blockData);
      const now = Date.now();
      
      if (now < blockedUntil) {
        setIsBlocked(true);
        setBlockTimeLeft(Math.ceil((blockedUntil - now) / 1000));
        
        const interval = setInterval(() => {
          const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
          if (remaining <= 0) {
            setIsBlocked(false);
            setBlockTimeLeft(0);
            localStorage.removeItem('loginBlock');
            setLoginAttempts(0);
            clearInterval(interval);
          } else {
            setBlockTimeLeft(remaining);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem('loginBlock');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Acesso bloqueado",
        description: `Aguarde ${Math.floor(blockTimeLeft / 60)}:${(blockTimeLeft % 60).toString().padStart(2, '0')} minutos`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Limpar tentativas em caso de sucesso
        setLoginAttempts(0);
        localStorage.removeItem('loginBlock');
        
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        // Auth.tsx will handle the redirect based on user role
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const blockedUntil = Date.now() + BLOCK_DURATION;
        localStorage.setItem('loginBlock', JSON.stringify({ blockedUntil }));
        setIsBlocked(true);
        setBlockTimeLeft(BLOCK_DURATION / 1000);
        
        toast({
          title: "Conta bloqueada temporariamente",
          description: "Muitas tentativas de login. Aguarde 15 minutos.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro no login",
          description: `Email ou senha incorretos. Tentativas restantes: ${MAX_ATTEMPTS - newAttempts}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isBlocked && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-center">
          <p className="text-red-600 font-semibold mb-2">
            ⚠️ Conta bloqueada temporariamente
          </p>
          <p className="text-red-500 text-sm">
            Tempo restante: {Math.floor(blockTimeLeft / 60)}:{(blockTimeLeft % 60).toString().padStart(2, '0')}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-urbana-gold transition-colors" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-14 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl transition-all"
            required
            disabled={loading || isBlocked}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-900">
          Senha
        </Label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-urbana-gold transition-colors" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-12 pr-14 h-14 bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-urbana-gold focus:ring-2 focus:ring-urbana-gold/20 rounded-xl transition-all"
            required
            disabled={loading || isBlocked}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading || isBlocked}
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
        disabled={loading || isBlocked}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
            Entrando...
          </>
        ) : isBlocked ? (
          <>
            🔒 Bloqueado
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

export default LoginForm;
