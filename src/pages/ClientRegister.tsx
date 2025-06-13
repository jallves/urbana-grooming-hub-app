
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  birth_date: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  general?: string;
}

export default function ClientRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'Data de nascimento é obrigatória';
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
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birth_date,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setErrors({ general: 'Email já cadastrado' });
        } else {
          setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
        }
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você pode fazer login agora.",
      });

      navigate('/cliente/login');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className={`bg-[#111827] border-gray-700 ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-[#F59E0B]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white font-clash">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-[#9CA3AF] font-inter">
            Crie sua conta para agendar seus horários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 font-inter">
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
                className={`bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF] ${errors.name ? 'border-red-500' : ''}`}
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
                className={`bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF] ${errors.email ? 'border-red-500' : ''}`}
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
                className={`bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF] ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(11) 99999-9999"
                required
              />
              {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="birth_date" className="text-white">Data de nascimento *</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                className={`bg-[#1F2937] border-gray-600 text-white placeholder-[#9CA3AF] ${errors.birth_date ? 'border-red-500' : ''}`}
                required
              />
              {errors.birth_date && <p className="text-red-400 text-sm mt-1">{errors.birth_date}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold"
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

            <div className="text-center text-sm space-y-2 text-[#9CA3AF]">
              <div>
                <span>Já tem uma conta? </span>
                <Link 
                  to="/cliente/login" 
                  className="text-[#F59E0B] hover:text-[#D97706] hover:underline"
                >
                  Fazer login
                </Link>
              </div>
              <div>
                <Link 
                  to="/" 
                  className="hover:text-[#F59E0B] hover:underline"
                >
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
