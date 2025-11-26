/**
 * Utilitário de debug para problemas de autenticação
 * 
 * Use window.clearAuthCache() no console do navegador para:
 * - Limpar cache de roles
 * - Fazer logout completo
 * - Recarregar a página
 */

export const clearAuthCache = () => {
  console.log('🧹 [DEBUG] Limpando cache de autenticação...');
  
  // Limpar todos os caches de auth
  localStorage.removeItem('user_role_cache');
  localStorage.removeItem('client_auth_token');
  localStorage.removeItem('totem_auth_token');
  localStorage.removeItem('totem_auth_expiry');
  localStorage.removeItem('loginBlock');
  
  console.log('✅ [DEBUG] Cache limpo!');
  console.log('🔄 [DEBUG] Recarregando página...');
  
  // Recarregar página
  window.location.reload();
};

// Expor globalmente para facilitar debug
if (typeof window !== 'undefined') {
  (window as any).clearAuthCache = clearAuthCache;
  console.log('🔧 [DEBUG] Função clearAuthCache() disponível globalmente');
  console.log('💡 [DEBUG] Use window.clearAuthCache() para limpar cache e recarregar');
}
