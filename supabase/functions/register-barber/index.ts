import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

interface RegisterBarberRequest {
  email: string;
  senha: string;
  barber_id: string;
  nome: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [register-barber] Iniciando registro de barbeiro...');

    // Parse request body
    const body: RegisterBarberRequest = await req.json();
    const { email, senha, barber_id, nome } = body;

    // Validações básicas
    if (!email?.trim() || !senha || !barber_id) {
      console.error('❌ Dados obrigatórios faltando');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email, senha e barber_id são obrigatórios' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase admin client
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

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase());
    
    if (existingUser) {
      console.log('⚠️ Usuário já existe, atualizando senha e staff_id...');
      
      // Update password for existing user
      const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: senha }
      );
      
      if (updatePasswordError) {
        console.error('❌ Erro ao atualizar senha:', updatePasswordError);
      } else {
        console.log('✅ Senha atualizada com sucesso');
      }
      
      // Update painel_barbeiros with existing user's auth.uid
      const { error: updateError } = await supabaseAdmin
        .from('painel_barbeiros')
        .update({ staff_id: existingUser.id })
        .eq('id', barber_id);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar painel_barbeiros:', updateError);
      }
      
      // Also update staff table if linked
      const { data: barberData } = await supabaseAdmin
        .from('painel_barbeiros')
        .select('staff_id')
        .eq('id', barber_id)
        .single();
      
      // Ensure user has barber role
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('role', 'barber')
        .single();
      
      if (!existingRole) {
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role: 'barber'
          });
        console.log('✅ Role barber atribuída ao usuário existente');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário já existia, vinculação atualizada',
          user_id: existingUser.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new auth user
    console.log('📧 Criando usuário auth para:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: senha,
      email_confirm: true, // Auto-confirm email for barbers
      user_metadata: {
        nome: nome,
        user_type: 'barber'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário auth:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user?.id;
    console.log('✅ Usuário auth criado:', userId);

    // Update painel_barbeiros with new auth.uid as staff_id
    const { error: updateBarberError } = await supabaseAdmin
      .from('painel_barbeiros')
      .update({ staff_id: userId })
      .eq('id', barber_id);

    if (updateBarberError) {
      console.error('❌ Erro ao atualizar painel_barbeiros:', updateBarberError);
    } else {
      console.log('✅ painel_barbeiros.staff_id atualizado');
    }

    // Update staff table if exists
    const { data: staffData } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (staffData) {
      await supabaseAdmin
        .from('staff')
        .update({ staff_id: userId })
        .eq('id', staffData.id);
      console.log('✅ staff.staff_id atualizado');
    }

    // Assign barber role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'barber'
      });

    if (roleError) {
      console.error('❌ Erro ao atribuir role:', roleError);
    } else {
      console.log('✅ Role barber atribuída');
    }

    console.log('🎉 [register-barber] Registro completo para:', nome);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Barbeiro registrado com sucesso',
        user_id: userId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [register-barber] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
