import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar se o usuário que está fazendo a requisição é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar se é admin
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin', { user_id: user.id });

    if (adminError || !isAdmin) {
      throw new Error('Apenas administradores podem gerenciar usuários');
    }

    const { action, email, password, barberId } = await req.json();

    console.log('[manage-barber-user] Ação:', action, 'Email:', email);

    switch (action) {
      case 'check': {
        // Verificar se o usuário existe
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        
        if (error) {
          console.error('[manage-barber-user] Erro ao listar usuários:', error);
          throw error;
        }

        const existingUser = users.users.find((u: any) => 
          u.email?.toLowerCase() === email.toLowerCase()
        );

        return new Response(
          JSON.stringify({ 
            exists: !!existingUser,
            user: existingUser ? {
              id: existingUser.id,
              email: existingUser.email,
              created_at: existingUser.created_at,
              last_sign_in_at: existingUser.last_sign_in_at,
              email_confirmed_at: existingUser.email_confirmed_at
            } : null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'create': {
        // Criar usuário
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            barber_id: barberId,
            role: 'barber'
          }
        });

        if (error) {
          console.error('[manage-barber-user] Erro ao criar usuário:', error);
          throw error;
        }

        console.log('[manage-barber-user] Usuário criado com sucesso:', data.user.id);

        // Vincular user_id na tabela employees
        const { error: employeesError } = await supabaseAdmin
          .from('employees')
          .update({ user_id: data.user.id })
          .eq('email', email.toLowerCase());

        if (employeesError) {
          console.error('[manage-barber-user] Erro ao vincular employees:', employeesError);
        }

        // Vincular user_id na tabela staff
        const { error: staffError } = await supabaseAdmin
          .from('staff')
          .update({ user_id: data.user.id })
          .eq('email', email.toLowerCase());

        if (staffError) {
          console.error('[manage-barber-user] Erro ao vincular staff:', staffError);
        }

        // Criar role do usuário
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'barber'
          });

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('[manage-barber-user] Erro ao criar role:', roleError);
        }

        console.log('[manage-barber-user] Vinculações concluídas com sucesso');

        return new Response(
          JSON.stringify({ 
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              created_at: data.user.created_at
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'update-password': {
        // Buscar o usuário pelo email
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('[manage-barber-user] Erro ao listar usuários:', listError);
          throw listError;
        }

        const existingUser = users.users.find((u: any) => 
          u.email?.toLowerCase() === email.toLowerCase()
        );

        if (!existingUser) {
          throw new Error('Usuário não encontrado');
        }

        // Atualizar senha
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password }
        );

        if (error) {
          console.error('[manage-barber-user] Erro ao atualizar senha:', error);
          throw error;
        }

        console.log('[manage-barber-user] Senha atualizada com sucesso para:', email);

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      default:
        throw new Error('Ação inválida');
    }
  } catch (error: any) {
    console.error('[manage-barber-user] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});