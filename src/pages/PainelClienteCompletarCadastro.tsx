import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthContainer from '@/components/ui/containers/AuthContainer';
import { logAdminActivity } from '@/hooks/useActivityLogger';
import { sessionManager } from '@/hooks/useSessionManager';

export default function PainelClienteCompletarCadastro() {
  const navigate = useNavigate();
  const { user, isClient, rolesChecked, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verificar se o perfil já está completo
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('painel_clientes')
          .select('whatsapp, data_nascimento')
          .eq('user_id', user.id)
          .maybeSingle();

        // Se perfil existe e está completo, ir para dashboard
        if (profile?.whatsapp && profile?.data_nascimento) {
          console.log('[CompletarCadastro] ✅ Perfil já completo, redirecionando...');
          navigate('/painel-cliente/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error('[CompletarCadastro] Erro ao verificar perfil:', err);
      }

      setChecking(false);
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading, navigate]);

  // Se não tem usuário logado, redirecionar para login
  if (!authLoading && !user) {
    navigate('/painel-cliente/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!whatsapp.trim()) {
      toast({ variant: 'destructive', title: 'WhatsApp é obrigatório' });
      return;
    }
    if (!dataNascimento) {
      toast({ variant: 'destructive', title: 'Data de nascimento é obrigatória' });
      return;
    }

    setLoading(true);

    try {
      const nome = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente';
      const email = user.email || '';

      // Verificar se já existe perfil para esse user_id
      const { data: existing } = await supabase
        .from('painel_clientes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('painel_clientes')
          .update({
            whatsapp: whatsapp.trim(),
            data_nascimento: dataNascimento,
            nome,
            email,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Tentar vincular por email primeiro
        const { data: byEmail } = await supabase
          .from('painel_clientes')
          .select('id')
          .eq('email', email)
          .is('user_id', null)
          .maybeSingle();

        if (byEmail) {
          // Vincular perfil existente
          const { error } = await supabase
            .from('painel_clientes')
            .update({
              user_id: user.id,
              whatsapp: whatsapp.trim(),
              data_nascimento: dataNascimento,
              updated_at: new Date().toISOString(),
            })
            .eq('id', byEmail.id);

          if (error) throw error;
        } else {
          // Criar novo perfil
          const { error } = await supabase
            .from('painel_clientes')
            .insert({
              user_id: user.id,
              nome,
              email,
              whatsapp: whatsapp.trim(),
              data_nascimento: dataNascimento,
            });

          if (error) throw error;
        }

        // Atribuir role 'user' se não tiver
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'user')
          .maybeSingle();

        if (!existingRole) {
          await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'user' });
        }
      }

      // Registrar sessão e log
      await logAdminActivity({
        action: 'login',
        entityType: 'session',
        entityId: user.id,
        newData: { email, userType: 'client_google', timestamp: new Date().toISOString() },
      });

      await sessionManager.createSession({
        userId: user.id,
        userType: 'painel_cliente',
        userEmail: email || undefined,
        userName: nome,
        expiresInHours: 24,
      });

      toast({
        title: '✅ Cadastro completo!',
        description: 'Bem-vindo ao Costa Urbana!',
        duration: 3000,
      });

      navigate('/painel-cliente/dashboard', { replace: true });
    } catch (err) {
      console.error('[CompletarCadastro] ❌ Erro:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar dados',
        description: 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking || authLoading) {
    return (
      <AuthContainer title="Costa Urbana" subtitle="Carregando...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-urbana-gold" />
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Costa Urbana" subtitle="Complete seu cadastro">
      <div className="w-full space-y-4">
        <div className="p-4 bg-urbana-gold/10 border border-urbana-gold/20 rounded-xl text-center">
          <p className="text-sm text-gray-600">
            Olá, <strong>{user?.user_metadata?.full_name || user?.email}</strong>! 
            Para finalizar, preencha os dados abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-gray-700 font-medium">WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento" className="text-gray-700 font-medium">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="h-12 border-gray-300 focus:border-urbana-gold focus:ring-urbana-gold rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-urbana-gold to-yellow-600 hover:from-yellow-600 hover:to-urbana-gold text-white font-semibold rounded-xl shadow-md transition-all"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Finalizar Cadastro'}
          </Button>
        </form>
      </div>
    </AuthContainer>
  );
}