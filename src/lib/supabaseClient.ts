import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// IMPORTANTE: Usar URLs diretas conforme configuração do projeto
const supabaseUrl = "https://bqftkknbvmggcbsubicl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZnRra25idm1nZ2Nic3ViaWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNDQ4MjQsImV4cCI6MjA2MDkyMDgyNH0.50TxAQPb5vrvB1GQalFuLgW7WbH0xN9w6W3vU5w8PLM";

console.log('🔧 Supabase Client inicializando com URL:', supabaseUrl);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});