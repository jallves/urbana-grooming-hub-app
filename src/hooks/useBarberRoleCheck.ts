
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBarberRoleCheck } from '@/hooks/useBarberRoleCheck';

export default function BarberLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { checkingRole, checkBarberRole } = useBarberRoleCheck();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('Autenticação falhou');

      // Verificar permissões
      await checkBarberRole(data.user.id);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <form onSubmit={handleLogin} className="bg-zinc-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Login Barbeiro</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-zinc-300 mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-zinc-300 mb-2" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || checkingRole}
          className="w-full bg-urbana-gold text-black font-bold py-3 rounded-lg hover:bg-urbana-gold/90 transition"
        >
          {(loading || checkingRole) ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" />
              Verificando...
            </div>
          ) : (
            'Acessar Painel'
          )}
        </button>
      </form>
    </div>
  );
}