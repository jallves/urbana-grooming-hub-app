import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminAuthRequest {
  operation: 'create_user' | 'update_user_password' | 'delete_user' | 'get_user_by_id' | 'find_user_by_email';
  email?: string;
  password?: string;
  user_id?: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[admin-auth-operations] Request received");

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("[admin-auth-operations] No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado - token ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify they're authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's JWT to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user: authUser }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !authUser) {
      console.error("[admin-auth-operations] User not authenticated:", userError);
      return new Response(
        JSON.stringify({ error: "Não autorizado - usuário inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[admin-auth-operations] Authenticated user:", authUser.id);

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', authUser.id)
      .in('role', ['master', 'admin', 'manager']);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("[admin-auth-operations] User is not admin:", authUser.id);
      return new Response(
        JSON.stringify({ error: "Acesso negado - permissões insuficientes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[admin-auth-operations] User has admin role:", roleData[0].role);

    // Parse request body
    const body: AdminAuthRequest = await req.json();
    const { operation, email, password, user_id, email_confirm, user_metadata } = body;

    console.log("[admin-auth-operations] Operation:", operation);

    let result: unknown;

    switch (operation) {
      case 'create_user': {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: "Email e senha são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[admin-auth-operations] Creating user:", email);
        
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: email_confirm ?? true,
          user_metadata: user_metadata || {}
        });

        if (error) {
          console.error("[admin-auth-operations] Error creating user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        result = { 
          success: true, 
          user: { 
            id: data.user.id, 
            email: data.user.email,
            created_at: data.user.created_at
          } 
        };
        break;
      }

      case 'update_user_password': {
        if (!user_id || !password) {
          return new Response(
            JSON.stringify({ error: "User ID e senha são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[admin-auth-operations] Updating password for user:", user_id);

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { 
          password 
        });

        if (error) {
          console.error("[admin-auth-operations] Error updating user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        result = { 
          success: true, 
          user: { 
            id: data.user.id, 
            email: data.user.email 
          } 
        };
        break;
      }

      case 'delete_user': {
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "User ID é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[admin-auth-operations] Deleting user:", user_id);

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (error) {
          console.error("[admin-auth-operations] Error deleting user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        result = { success: true, deleted_user_id: user_id };
        break;
      }

      case 'get_user_by_id': {
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: "User ID é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[admin-auth-operations] Getting user by ID:", user_id);

        const { data, error } = await supabaseAdmin.auth.admin.getUserById(user_id);

        if (error) {
          console.error("[admin-auth-operations] Error getting user:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        result = { 
          success: true, 
          user: data.user ? { 
            id: data.user.id, 
            email: data.user.email,
            created_at: data.user.created_at,
            user_metadata: data.user.user_metadata
          } : null 
        };
        break;
      }

      case 'find_user_by_email': {
        if (!email) {
          return new Response(
            JSON.stringify({ error: "Email é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("[admin-auth-operations] Finding user by email:", email);

        // List users and find by email (Supabase doesn't have a direct getUserByEmail)
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ 
          perPage: 1000, 
          page: 1 
        });

        if (error) {
          console.error("[admin-auth-operations] Error listing users:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const foundUser = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        result = { 
          success: true, 
          user: foundUser ? { 
            id: foundUser.id, 
            email: foundUser.email,
            created_at: foundUser.created_at 
          } : null 
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Operação desconhecida: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log("[admin-auth-operations] Operation successful");

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[admin-auth-operations] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
