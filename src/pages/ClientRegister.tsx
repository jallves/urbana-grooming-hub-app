
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ClientFormData } from '@/types/client';
import { Loader2, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ClientRegister() {
  const navigate = useNavigate();
  const { signUp, client } = useClientAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    confirmPassword: ''
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
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
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
      const { error } = await signUp(formData);
      
      if (error) {
        setErrors({ general: error });
      } else {
        navigate('/cliente/dashboard');
      }
    } catch (error) {
      console.error('Erro inesperado no cadastro:', error);
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className={`bg-gray-900 border-gray-700 ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-urbana-gold" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
          <CardDescription className="text-gray-300">
            Crie sua conta para agendar seus horários
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
              <Label htmlFor="name" className="text-white">Nome completo *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Seu nome completo"
                required
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="seu@email.com"
                required
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">Telefone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(11) 99999-9999"
                required
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="birth_date" className="text-white">Data de nascimento</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Mínimo 6 caracteres"
                required
              />
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-white">Confirmar senha *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`bg-gray-800 border-gray-600 text-white placeholder-gray-400 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirme sua senha"
                required
              />
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90 text-black font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>

            <div className="text-center text-sm space-y-2">
              <div>
                <span className="text-gray-300">Já tem uma conta? </span>
                <Link to="/cliente/login" className="text-urbana-gold hover:underline">
                  Fazer login
                </Link>
              </div>
              <div>
                <Link to="/" className="text-gray-400 hover:underline">
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
