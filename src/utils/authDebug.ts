/**
 * Utilitário de debug para problemas de autenticação e sessões
 * 
 * Use window.clearAuthCache() no console do navegador para:
 * - Limpar cache de roles e tokens
 * - Limpar tokens de sessão
 * - Fazer logout completo do Supabase
 * - Recarregar a página
 */

import { supabase } from '@/integrations/supabase/client';

export const clearAuthCache = async () => {
  console.log('🧹 [DEBUG] Iniciando limpeza completa de autenticação...');
  
  try {
    // 1. Fazer logout do Supabase
    console.log('🚪 [DEBUG] Fazendo logout do Supabase...');
    await supabase.auth.signOut();
    
    // 2. Limpar todos os caches de auth
    console.log('🗑️ [DEBUG] Limpando localStorage...');
    localStorage.removeItem('user_role_cache');
    localStorage.removeItem('client_auth_token');
    localStorage.removeItem('totem_auth_token');
    localStorage.removeItem('totem_auth_expiry');
    localStorage.removeItem('loginBlock');
    
    // 3. Limpar todos os tokens de sessão
    const sessionKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('session_token_')
    );
    sessionKeys.forEach(key => {
      console.log(`🗑️ [DEBUG] Removendo ${key}...`);
      localStorage.removeItem(key);
    });
    
    // 4. Limpar sessionStorage também
    console.log('🗑️ [DEBUG] Limpando sessionStorage...');
    sessionStorage.clear();
    
    console.log('✅ [DEBUG] Limpeza completa realizada!');
    console.log('🔄 [DEBUG] Recarregando página em 1 segundo...');
    
    // Aguardar 1 segundo para garantir que o logout foi processado
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro durante limpeza:', error);
    // Mesmo com erro, tentar limpar o que for possível
    localStorage.clear();
    sessionStorage.clear();
    console.log('🔄 [DEBUG] Recarregando página após erro...');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }
};

// Expor globalmente para facilitar debug
if (typeof window !== 'undefined') {
  (window as any).clearAuthCache = clearAuthCache;
  console.log('🔧 [DEBUG] Função clearAuthCache() disponível globalmente');
  console.log('💡 [DEBUG] Use window.clearAuthCache() para limpar todo cache e sessões');
  console.log('💡 [DEBUG] Isso irá: deslogar do Supabase, limpar localStorage/sessionStorage e recarregar a página');
}
