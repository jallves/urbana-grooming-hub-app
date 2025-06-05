import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ClientLoginData } from '@/types/client';
import { Loader2, LogIn } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ClientLogin() {
  const navigate = useNavigate();
  const { signIn, client } = useClientAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientLoginData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      navigate('/cliente/dashboard');
    }
  }, [client, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erros ao digitar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const { error } = await signIn(formData);
      
      if (error) {
        setErrors({ general: error });
      } else {
        navigate('/cliente/dashboard');
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className={`bg-stone-800 border-stone-600 ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogIn className="h-12 w-12 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Entrar na Barbearia</CardTitle>
          <CardDescription className="text-stone-300">
            Acesse sua conta para agendar seu corte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md text-sm">
                {errors.general}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-stone-100">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-stone-700 border-stone-600 text-white placeholder-stone-400 focus:border-amber-600 focus:ring-amber-600/20 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="seu@email.com"
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-stone-100">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`bg-stone-700 border-stone-600 text-white placeholder-stone-400 focus:border-amber-600 focus:ring-amber-600/20 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Sua senha"
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-stone-300">Não tem uma conta? </span>
                <Link to="/cliente/registro" className="text-amber-500 hover:underline hover:text-amber-400">
                  Criar conta
                </Link>
              </div>
              <div>
                <Link to="/" className="text-stone-400 hover:underline hover:text-stone-300">
                  Voltar ao início
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}