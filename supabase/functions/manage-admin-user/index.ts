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

    // Verificar se o usuário que está fazendo a requisição é admin/master
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Não autorizado');
    }

    // Verificar se é admin ou master
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => ['master', 'admin'].includes(r.role));
    
    if (!hasPermission) {
      throw new Error('Apenas administradores e master podem gerenciar usuários');
    }

    const { action, email, password, employeeId } = await req.json();

    console.log('[manage-admin-user] Ação:', action, 'Email:', email);

    switch (action) {
      case 'create': {
        // Buscar dados do funcionário
        const { data: employee, error: empError } = await supabaseAdmin
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();

        if (empError || !employee) {
          throw new Error('Funcionário não encontrado');
        }

        // Verificar se já existe usuário auth
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find((u: any) => 
          u.email?.toLowerCase() === email.toLowerCase()
        );

        let authUserId: string;

        if (existingUser) {
          // Atualizar senha do usuário existente
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password }
          );

          if (updateError) {
            throw updateError;
          }

          authUserId = existingUser.id;
          console.log('[manage-admin-user] Senha atualizada para usuário existente:', authUserId);
        } else {
          // Criar novo usuário
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              employee_id: employeeId,
              role: employee.role,
              name: employee.name
            }
          });

          if (createError) {
            throw createError;
          }

          authUserId = newUser.user.id;
          console.log('[manage-admin-user] Novo usuário criado:', authUserId);
        }

        // Atualizar employee com user_id
        const { error: updateEmpError } = await supabaseAdmin
          .from('employees')
          .update({ user_id: authUserId })
          .eq('id', employeeId);

        if (updateEmpError) {
          throw updateEmpError;
        }

        // Criar/atualizar admin_users
        const { error: adminUserError } = await supabaseAdmin
          .from('admin_users')
          .upsert({
            email: email,
            name: employee.name,
            role: employee.role,
            user_id: authUserId
          }, {
            onConflict: 'email'
          });

        if (adminUserError) {
          throw adminUserError;
        }

        // Criar user_roles
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authUserId,
            role: employee.role
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) {
          throw roleError;
        }

        // Sincronizar com tabela staff (usada pelo front-end para listar usuários)
        const { error: staffError } = await supabaseAdmin
          .from('staff')
          .upsert({
            email: email,
            name: employee.name,
            role: employee.role,
            is_active: true,
            staff_id: authUserId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'email'
          });

        if (staffError) {
          console.warn('[manage-admin-user] Aviso ao sincronizar staff:', staffError);
        }

        console.log('[manage-admin-user] Acesso criado com sucesso');

        return new Response(
          JSON.stringify({ 
            success: true,
            user_id: authUserId
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'revoke': {
        // Buscar employee
        const { data: employee, error: empError } = await supabaseAdmin
          .from('employees')
          .select('user_id, email')
          .eq('id', employeeId)
          .single();

        if (empError || !employee || !employee.user_id) {
          throw new Error('Funcionário não encontrado ou sem acesso');
        }

        // Proteger master
        if (employee.email === 'joao.colimoides@gmail.com') {
          throw new Error('Não é possível revogar acesso do usuário master');
        }

        // Deletar user_roles
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', employee.user_id);

        // Deletar admin_users
        await supabaseAdmin
          .from('admin_users')
          .delete()
          .eq('user_id', employee.user_id);

        // Limpar user_id do employee
        await supabaseAdmin
          .from('employees')
          .update({ user_id: null })
          .eq('id', employeeId);

        // Deletar usuário auth
        await supabaseAdmin.auth.admin.deleteUser(employee.user_id);

        console.log('[manage-admin-user] Acesso revogado com sucesso');

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'update-password': {
        // Buscar usuário pelo email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
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
          throw error;
        }

        console.log('[manage-admin-user] Senha atualizada com sucesso');

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
    console.error('[manage-admin-user] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
