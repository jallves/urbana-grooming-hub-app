
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { ClientFormData } from '@/types/client';
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePasswordStrength, sanitizeInput } from '@/lib/security';
import { validateClientRegistration } from '@/lib/inputValidation';

export default function ClientRegister() {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useClientAuth();
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
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/cliente/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Sanitize input as user types (except passwords for real-time validation)
    const sanitizedValue = name === 'password' || name === 'confirmPassword' ? value : sanitizeInput(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear general error when user modifies any field
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }

    // Real-time password strength validation
    if (name === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const validateForm = (): boolean => {
    const validation = validateClientRegistration(formData);
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        if (error.includes('Nome')) {
          newErrors.name = error;
        } else if (error.includes('Email')) {
          newErrors.email = error;
        } else if (error.includes('Telefone')) {
          newErrors.phone = error;
        } else if (error.includes('Idade') || error.includes('Data')) {
          newErrors.birth_date = error;
        } else if (error.includes('Senhas não coincidem')) {
          newErrors.confirmPassword = error;
        } else {
          newErrors.general = error;
        }
      });
      setErrors(newErrors);
      return false;
    }

    // Additional password strength validation
    if (!passwordStrength.isValid) {
      setErrors(prev => ({ ...prev, password: passwordStrength.errors[0] }));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const { error } = await signUp(formData);
      
      if (error) {
        if (error.includes('Muitas tentativas')) {
          setErrors({ general: error });
        } else {
          setErrors({ general: error });
        }
      }
      // Navigation will be handled by the auth context after email confirmation
    } catch (error) {
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-urbana-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserPlus className="h-12 w-12 text-urbana-gold" />
          </div>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta para agendar seus horários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Seu nome completo"
                maxLength={100}
                autoComplete="name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
                placeholder="seu@email.com"
                maxLength={100}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'border-red-500' : ''}
                placeholder="(11) 99999-9999"
                maxLength={20}
                autoComplete="tel"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                className={errors.birth_date ? 'border-red-500' : ''}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 14)).toISOString().split('T')[0]}
              />
              {errors.birth_date && <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>}
            </div>

            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'border-red-500' : ''}
                placeholder="Mínimo 12 caracteres com letras, números e símbolos"
                maxLength={100}
                autoComplete="new-password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordStrength.isValid ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Senha forte</span>
                    </div>
                  ) : (
                    passwordStrength.errors.length > 0 && (
                      <div className="text-red-500 text-xs space-y-1">
                        {passwordStrength.errors.map((error, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <span>•</span>
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar senha *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'border-red-500' : ''}
                placeholder="Confirme sua senha"
                maxLength={100}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-urbana-gold hover:bg-urbana-gold/90"
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

            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link to="/cliente/login" className="text-urbana-gold hover:underline">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
